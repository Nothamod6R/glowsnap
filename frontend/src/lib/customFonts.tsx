import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export const BUILTIN_FONTS = ["Inter", "Arial", "Courier New", "Georgia"];

const SUPPORTED_EXTS = [".ttf", ".otf", ".woff", ".woff2"];

const FONT_MIME_TYPES = [
  "font/ttf",
  "font/otf",
  "font/woff",
  "font/woff2",
  "application/font-sfnt",
  "application/x-font-ttf",
  "application/x-font-otf",
  "application/vnd.ms-fontobject",
];

const ACCEPT_EXTENSIONS = [...SUPPORTED_EXTS, ...FONT_MIME_TYPES].join(",");

export interface CustomFont {
  id: string;
  name: string;
  filename: string;
  ext: string;
  loaded: boolean;
}

interface StoredFont {
  id: string;
  name: string;
  filename: string;
  ext: string;
  data: ArrayBuffer;
}

const DB_NAME = "glowsnap-custom-fonts";
const DB_VERSION = 1;
const STORE = "fonts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("IndexedDB open blocked"));
  });
}

function idbPut(record: StoredFont): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(record);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

function idbGetAll(): Promise<StoredFont[]> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => {
          db.close();
          resolve((req.result as StoredFont[]) || []);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
      .catch(reject);
  });
}

function idbDelete(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    openDB()
      .then((db) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
      .catch(reject);
  });
}

export function familyFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base.length > 0 ? base : filename;
}

function isValidFontSignature(data: ArrayBuffer, ext: string): boolean {
  const bytes = new Uint8Array(data);
  if (bytes.length < 4) return false;
  const tag =
    String.fromCharCode(bytes[0]) +
    String.fromCharCode(bytes[1]) +
    String.fromCharCode(bytes[2]) +
    String.fromCharCode(bytes[3]);

  switch (ext) {
    case ".woff":
      return tag === "wOFF";
    case ".woff2":
      return tag === "wOF2";
    case ".otf":
      return (
        tag === "OTTO" ||
        tag === "\x00\x01\x00\x00" ||
        tag === "true" ||
        tag === "ttcf"
      );
    case ".ttf":
      return tag === "\x00\x01\x00\x00" || tag === "true" || tag === "ttcf";
    default:
      return false;
  }
}

function generateId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface CustomFontsContextValue {
  fonts: string[];
  builtinFonts: string[];
  customFonts: CustomFont[];
  addFont: (file: File) => Promise<CustomFont>;
  removeFont: (id: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
  acceptExtensions: string;
}

const CustomFontsContext = createContext<CustomFontsContextValue | null>(null);

export function CustomFontsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadedFaces = useRef<Map<string, FontFace>>(new Map());
  const customFontsRef = useRef<CustomFont[]>([]);
  customFontsRef.current = customFonts;

  const registerFace = useCallback(
    async (stored: StoredFont): Promise<CustomFont> => {
      const family = stored.name || familyFromFilename(stored.filename);
      let loaded = false;
      try {
        const face = new FontFace(family, stored.data);
        await face.load();
        document.fonts.add(face);
        loadedFaces.current.set(stored.id, face);
        loaded = true;
      } catch {
        loadedFaces.current.delete(stored.id);
      }
      return {
        id: stored.id,
        name: family,
        filename: stored.filename,
        ext: stored.ext,
        loaded,
      };
    },
    [],
  );

  const buildList = useCallback(async () => {
    try {
      const all = await idbGetAll();
      const items: CustomFont[] = [];
      for (const stored of all) {
        if (!loadedFaces.current.has(stored.id)) {
          items.push(await registerFace(stored));
        } else {
          items.push({
            id: stored.id,
            name: stored.name || familyFromFilename(stored.filename),
            filename: stored.filename,
            ext: stored.ext,
            loaded: true,
          });
        }
      }
      setCustomFonts(items);
    } catch (err) {
      console.error("Failed to load custom fonts:", err);
    }
  }, [registerFace]);

  useEffect(() => {
    buildList().catch(() => {});
  }, [buildList]);

  const addFont = useCallback(
    async (file: File): Promise<CustomFont> => {
      const lower = file.name.toLowerCase();
      const extMatch = SUPPORTED_EXTS.find((e) => lower.endsWith(e));
      if (!extMatch) {
        const msg = `Unsupported font file "${file.name}". Use .ttf, .otf, .woff, or .woff2.`;
        setError(msg);
        throw new Error(msg);
      }
      const data = await file.arrayBuffer();

      if (!isValidFontSignature(data, extMatch)) {
        const msg = `"${file.name}" doesn't look like a valid ${extMatch} font file. Please choose an actual font file.`;
        setError(msg);
        throw new Error(msg);
      }

      const family = familyFromFilename(file.name);

      const existing = customFontsRef.current.find(
        (c) => c.name.toLowerCase() === family.toLowerCase(),
      );
      if (existing) {
        const msg = `Font "${family}" is already available as a custom font.`;
        setError(msg);
        throw new Error(msg);
      }

      const stored: StoredFont = {
        id: generateId(),
        name: family,
        filename: file.name,
        ext: extMatch,
        data,
      };
      await idbPut(stored);
      const item = await registerFace(stored);
      setCustomFonts((prev) => [...prev, item]);
      setError(null);
      return item;
    },
    [registerFace],
  );

  const removeFont = useCallback(async (id: string) => {
    await idbDelete(id);
    const face = loadedFaces.current.get(id);
    if (face) {
      try {
        document.fonts.delete(face);
      } catch {
        // ignore
      }
      loadedFaces.current.delete(id);
    }
    setCustomFonts((prev) => prev.filter((c) => c.id !== id));
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fonts = useMemo(
    () => [...BUILTIN_FONTS, ...customFonts.map((c) => c.name)],
    [customFonts],
  );

  const value = useMemo<CustomFontsContextValue>(
    () => ({
      fonts,
      builtinFonts: [...BUILTIN_FONTS],
      customFonts,
      addFont,
      removeFont,
      error,
      clearError,
      acceptExtensions: ACCEPT_EXTENSIONS,
    }),
    [fonts, customFonts, addFont, removeFont, error, clearError],
  );

  return (
    <CustomFontsContext.Provider value={value}>
      {children}
    </CustomFontsContext.Provider>
  );
}

export function useCustomFonts(): CustomFontsContextValue {
  const ctx = useContext(CustomFontsContext);
  if (!ctx) {
    throw new Error("useCustomFonts must be used within a CustomFontsProvider");
  }
  return ctx;
}

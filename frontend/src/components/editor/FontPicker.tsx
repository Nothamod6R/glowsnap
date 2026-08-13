import React, { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useCustomFonts } from "@/lib/customFonts";

interface FontPickerProps {
  value: string;
  onChange: (family: string) => void;
  selectClassName?: string;
  optionClassName?: string;
}

const selectBase =
  "bg-transparent text-white/90 border border-white/10 rounded focus:outline-none focus:border-white/30 appearance-none cursor-pointer";

export default function FontPicker({
  value,
  onChange,
  selectClassName = "text-xs px-1.5 py-0.5",
  optionClassName = "bg-gray-800 text-white",
}: FontPickerProps) {
  const { customFonts, builtinFonts, addFont, removeFont, acceptExtensions } =
    useCustomFonts();
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const added = await addFont(file);
      onChange(added.name);
      setMessage({ type: "info", text: `Added "${added.name}".` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not add font.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await removeFont(id);
      if (value.toLowerCase() === name.toLowerCase()) {
        onChange("");
      }
      setMessage({ type: "info", text: `Removed "${name}".` });
    } catch {
      setMessage({ type: "error", text: "Could not remove the font." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={menuRef} className="relative flex items-center gap-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${selectBase} ${selectClassName}`}
      >
        {builtinFonts.map((f) => (
          <option key={f} value={f} className={optionClassName}>
            {f}
          </option>
        ))}
        {customFonts.length > 0 && (
          <optgroup label="Custom Fonts">
            {customFonts.map((c) => (
              <option key={c.id} value={c.name} className={optionClassName}>
                {c.name}
                {c.loaded ? "" : " (unavailable)"}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="p-1 bg-white/5 hover:bg-white/20 text-white/60 hover:text-white rounded transition-colors"
        title="Add or manage custom fonts"
        disabled={busy}
      >
        {busy ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Plus size={12} />
        )}
      </button>

      {menuOpen && (
        <div className="absolute top-full right-0 mt-1 z-50 w-60 rounded-xl border border-white/10 bg-[#181818] shadow-2xl p-1.5 text-left">
          <input
            ref={fileRef}
            type="file"
            accept={acceptExtensions}
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-white/80 hover:bg-white/10 transition-colors"
          >
            <Upload size={13} className="text-white/50" />
            Upload font (.ttf, .otf, .woff, .woff2)
          </button>
          <div className="my-1 h-px bg-white/10" />
          <div className="px-2.5 pb-1 text-[10px] uppercase tracking-wider text-white/40">
            Custom fonts
          </div>
          {customFonts.length === 0 ? (
            <div className="px-2.5 py-1.5 text-xs text-white/40">
              No custom fonts yet.
            </div>
          ) : (
            customFonts.map((c) => (
              <div
                key={c.id}
                className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10"
              >
                <span className="flex-1 truncate text-xs text-white/80">
                  {c.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(c.id, c.name)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                  title={`Remove ${c.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
          {message && (
            <div
              className={`mt-1 px-2.5 py-1 text-[11px] leading-tight rounded-lg ${
                message.type === "error"
                  ? "text-red-400 bg-red-500/10"
                  : "text-white/70 bg-white/5"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

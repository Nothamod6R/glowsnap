import { useEffect } from "react";

export default function useKeyboardShortcut(
  keys: { alt?: boolean; ctrl?: boolean; key: string },
  callback: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.altKey === !!keys.alt &&
        e.ctrlKey === !!keys.ctrl &&
        e.key.toLowerCase() === keys.key.toLowerCase()
      ) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keys, callback]);
}

import { useState, useCallback, useRef } from "react";
import { ShapeConfig } from "@/types/types";
import { cloneShape } from "@/lib/utils";

export function useHistory() {
  const [history, setHistory] = useState<ShapeConfig[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const historyRef = useRef({ history: [] as ShapeConfig[][], index: -1 });

  const saveHistory = useCallback((shapes: ShapeConfig[]) => {
    const current = historyRef.current;
    const newHistory = current.history.slice(0, current.index + 1);
    newHistory.push(shapes.map((s) => cloneShape(s)));
    current.history = newHistory;
    current.index = newHistory.length - 1;
    setHistory(newHistory);
    setHistoryIndex(current.index);
  }, []);

  const undo = useCallback(() => {
    const current = historyRef.current;
    if (current.index > 0) {
      current.index -= 1;
      setHistoryIndex(current.index);
      setHistory(current.history);
      return current.history[current.index].map((s) => cloneShape(s));
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    const current = historyRef.current;
    if (current.index < current.history.length - 1) {
      current.index += 1;
      setHistoryIndex(current.index);
      setHistory(current.history);
      return current.history[current.index].map((s) => cloneShape(s));
    }
    return null;
  }, []);

  return {
    saveHistory,
    undo,
    redo,
    historyIndex,
    historyLength: history.length,
  };
}

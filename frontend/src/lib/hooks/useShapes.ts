import { useState, useCallback } from "react";
import { ShapeConfig } from "@/types/types";
import { useHistory } from "@/lib/hooks/useHistory";

export function useShapes() {
  const [shapes, setShapes] = useState<ShapeConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { saveHistory, undo, redo } = useHistory();

  const addShape = useCallback(
    (shape: ShapeConfig, select = true, save = true) => {
      setShapes((prev) => {
        const newShapes = [...prev, shape];
        if (save) saveHistory(newShapes);
        return newShapes;
      });
      if (select) setSelectedId(shape.id);
    },
    [saveHistory],
  );

  const updateShape = useCallback(
    (id: string, newAttrs: Partial<ShapeConfig>, save = true) => {
      setShapes((prev) => {
        const newShapes = prev.map((s) =>
          s.id === id ? { ...s, ...newAttrs } : s,
        );
        if (save) saveHistory(newShapes);
        return newShapes;
      });
    },
    [saveHistory],
  );

  const deleteShape = useCallback(
    (id: string) => {
      setShapes((prev) => {
        const newShapes = prev.filter((s) => s.id !== id);
        saveHistory(newShapes);
        return newShapes;
      });
      setSelectedId(null);
    },
    [saveHistory],
  );

  const commitShapes = useCallback(() => {
    saveHistory(shapes);
  }, [shapes, saveHistory]);

  const handleUndo = useCallback(() => {
    const prevShapes = undo();
    if (prevShapes) setShapes(prevShapes);
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextShapes = redo();
    if (nextShapes) setShapes(nextShapes);
  }, [redo]);

  return {
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    addShape,
    updateShape,
    deleteShape,
    commitShapes,
    handleUndo,
    handleRedo,
  };
}

import { useState, useRef } from "react";

export function useCrop() {
  const [cropRect, setCropRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const startCrop = (pos: { x: number; y: number }) => {
    startPosRef.current = pos;
    setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const updateCrop = (point: { x: number; y: number }) => {
    if (!startPosRef.current) return;
    const start = startPosRef.current;
    setCropRect({
      x: Math.min(point.x, start.x),
      y: Math.min(point.y, start.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  };

  const finishCrop = () => {
    startPosRef.current = null;
  };

  const applyCrop = () => {
    setCropRect(null);
    return cropRect;
  };

  const cancelCrop = () => {
    startPosRef.current = null;
    setCropRect(null);
  };

  return { cropRect, startCrop, updateCrop, finishCrop, applyCrop, cancelCrop };
}

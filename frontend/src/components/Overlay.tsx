import { useCallback, useEffect, useRef, useState } from "react";
import { OverlayProps, OverlayRect } from "@/types/types";

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const toRect = (a: Point, b: Point): Rect => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
};

export default function Overlay({
  imageUrl,
  onComplete,
  onCancel,
}: OverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [current, setCurrent] = useState<Point | null>(null);
  const [selection, setSelection] = useState<Rect | null>(null);
  const [natural, setNatural] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const innerW = window.innerWidth;
  const innerH = window.innerHeight;
  const scaleX = natural && natural.width > 0 ? natural.width / innerW : 1;
  const scaleY = natural && natural.height > 0 ? natural.height / innerH : 1;

  const toImageRect = useCallback(
    (rect: Rect): OverlayRect | null => {
      if (!natural || rect.width < 2 || rect.height < 2) return null;
      return {
        x: Math.round(rect.x * scaleX),
        y: Math.round(rect.y * scaleY),
        width: Math.round(rect.width * scaleX),
        height: Math.round(rect.height * scaleY),
      };
    },
    [natural, scaleX, scaleY],
  );

  const localPoint = (clientX: number, clientY: number): Point => {
    const rect = containerRef.current?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    return {
      x: Math.max(0, Math.min(innerW, clientX - left)),
      y: Math.max(0, Math.min(innerH, clientY - top)),
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const imgRect = selection ? toImageRect(selection) : null;
        if (imgRect) onComplete(imgRect);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, toImageRect, onComplete, onCancel]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return;
      setCurrent(localPoint(e.clientX, e.clientY));
    };
    const handleMouseUp = () => {
      if (dragStart && current) {
        const rect = toRect(dragStart, current);
        if (rect.width >= 2 && rect.height >= 2) {
          setSelection(rect);
        }
      }
      setDragStart(null);
      setCurrent(null);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragStart, current]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setDragStart(localPoint(e.clientX, e.clientY));
    setCurrent(localPoint(e.clientX, e.clientY));
  };

  const activeRect =
    dragStart && current ? toRect(dragStart, current) : selection;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="fixed inset-0 overflow-hidden cursor-crosshair select-none wails-no-drag"
      style={{ backgroundColor: "#000" }}
    >
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const el = e.currentTarget;
          setNatural({ width: el.naturalWidth, height: el.naturalHeight });
        }}
        className="pointer-events-none w-full h-full object-fill"
        style={{ imageRendering: "auto" }}
      />

      <div className="absolute inset-0 pointer-events-none bg-black/60" />

      {activeRect && (
        <div
          className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
          style={{
            left: activeRect.x,
            top: activeRect.y,
            width: activeRect.width,
            height: activeRect.height,
          }}
        >
          <span className="absolute top-0 left-0 -translate-y-full bg-red-500/90 text-white text-[11px] font-medium px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            {activeRect.width} × {activeRect.height}
          </span>
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none rounded-lg bg-black/70 px-3 py-1.5 text-white/90 text-xs flex items-center gap-3 whitespace-nowrap">
        {selection ? (
          <>
            <span className="text-red-500">Selection ready</span>
            <span className="text-white/40">|</span>
            <span>
              <kbd className="text-red-500">Enter</kbd> capture
            </span>
            <span className="text-white/40">|</span>
            <span>
              <kbd className="text-red-500">Esc</kbd> cancel
            </span>
          </>
        ) : (
          <>
            <span>Drag to select an area</span>
            <span className="text-white/40">|</span>
            <span>
              <kbd className="text-red-500">Esc</kbd> cancel
            </span>
          </>
        )}
      </div>
    </div>
  );
}

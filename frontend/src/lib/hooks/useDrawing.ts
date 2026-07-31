import { useRef } from 'react';
import { ShapeConfig, Tool } from '@/types/types';

export function useDrawing(
  addShape: (shape: ShapeConfig, select?: boolean) => void,
  updateShape: (id: string, attrs: Partial<ShapeConfig>, save?: boolean) => void,
  shapes: ShapeConfig[],
  commitShapes: () => void,
) {
  const drawingRef = useRef<ShapeConfig | null>(null);

  const startDrawing = (tool: Tool, pos: { x: number; y: number }, color: string, strokeWidth: number, opacity: number) => {
    const id = Date.now().toString(36);
    const newShape: ShapeConfig = {
      id,
      type: tool === 'arrow' ? 'arrow' : 'line',
      x: 0, y: 0,
      points: [pos.x, pos.y],
      stroke: color,
      strokeWidth,
      opacity,
      fill: 'transparent',
    };
    drawingRef.current = newShape;
    addShape(newShape, false);
  };

  const updateDrawing = (point: { x: number; y: number }) => {
    if (!drawingRef.current) return;
    const shape = drawingRef.current;
    const newPoints = [...(shape.points || []), point.x, point.y];
    updateShape(shape.id, { points: newPoints }, false); 
  };

  const finishDrawing = () => {
    if (drawingRef.current) {
      commitShapes(); 
      drawingRef.current = null;
    }
  };

  const cancelDrawing = () => {
    drawingRef.current = null;
  };

  return { startDrawing, updateDrawing, finishDrawing, cancelDrawing };
}
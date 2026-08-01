import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Group, Rect, Ellipse, Arrow, Text, Line, Image as KonvaImage, Transformer } from 'react-konva';
import { ShapeConfig, Tool } from '@/types/types';
import { BackgroundSettings } from '@/lib/hooks/useBackground';

const HANDLE_ANCHOR_SIZE = 10;
const BOUNDING_BOX_STROKE = '#4A90D9';
const HANDLE_FILL = '#ffffff';
const HANDLE_STROKE = '#4A90D9';

interface CanvasProps {
  image: HTMLImageElement | null;
  stageSize: { width: number; height: number };
  selectedTool: Tool;
  shapes: ShapeConfig[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  addShape: (shape: ShapeConfig, select?: boolean, save?: boolean) => void;
  updateShape: (id: string, attrs: Partial<ShapeConfig>, save?: boolean) => void;
  deleteShape: (id: string) => void;
  commitShapes: () => void;
  color: string;
  strokeWidth: number;
  opacity: number;
  fillEnabled: boolean;
  cropMode: boolean;
  setCropMode: (v: boolean) => void;
  cropRect: { x: number; y: number; width: number; height: number } | null;
  setCropRect: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>
  >;
  onTextDoubleClick: (shape: ShapeConfig) => void;
  editingTextId: string | null;
  backgroundSettings: BackgroundSettings;
  imageTransform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number };
  onImageTransform: (attrs: { x: number; y: number; scaleX: number; scaleY: number; rotation: number }) => void;
  onChangeTool?: (tool: Tool) => void;
}

function snapToNearestAngle(angle: number): number {
  const snapIncrement = Math.PI / 4;
  return Math.round(angle / snapIncrement) * snapIncrement;
}

function getConstrainedPoint(start: { x: number; y: number }, current: { x: number; y: number }): { x: number; y: number } {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 1) return current;
  const angle = Math.atan2(dy, dx);
  const snappedAngle = snapToNearestAngle(angle);
  return {
    x: start.x + Math.cos(snappedAngle) * distance,
    y: start.y + Math.sin(snappedAngle) * distance,
  };
}

const Canvas = forwardRef<Konva.Stage, CanvasProps>(({
  image, stageSize, selectedTool, shapes, selectedId, setSelectedId,
  addShape, updateShape, deleteShape, commitShapes, color, strokeWidth, opacity, fillEnabled,
  cropMode, setCropMode, cropRect, setCropRect,
  onTextDoubleClick, editingTextId,
  backgroundSettings, imageTransform, onImageTransform,
  onChangeTool,
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  const contentGroupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const drawingRef = useRef<ShapeConfig | null>(null);
  const isDrawing = useRef(false);
  const isShiftPressed = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const cropStartPos = useRef<{ x: number; y: number } | null>(null);
  const justFinishedDrawing = useRef(false);

  useImperativeHandle(ref, () => stageRef.current as Konva.Stage);

  const groupOffsetX = imageTransform.x;
  const groupOffsetY = imageTransform.y;

  const getRelativePointer = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x - groupOffsetX, y: pos.y - groupOffsetY };
  }, [groupOffsetX, groupOffsetY]);

  const getGradientEndPoint = () => {
    const rad = (backgroundSettings.angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * stageSize.width,
      y: Math.sin(rad) * stageSize.height,
    };
  };

  const renderBackground = () => {
    if (!backgroundSettings.enabled) return null;
    if (backgroundSettings.type === 'linear') {
      const endPoint = getGradientEndPoint();
      return (
        <Rect
          x={0}
          y={0}
          width={stageSize.width}
          height={stageSize.height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={endPoint}
          fillLinearGradientColorStops={[0, backgroundSettings.startColor, 1, backgroundSettings.endColor]}
        />
      );
    } else {
      return (
        <Rect
          x={0}
          y={0}
          width={stageSize.width}
          height={stageSize.height}
          fillRadialGradientStartPoint={{ x: stageSize.width / 2, y: stageSize.height / 2 }}
          fillRadialGradientEndPoint={{ x: stageSize.width / 2, y: stageSize.height / 2 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndRadius={stageSize.width}
          fillRadialGradientColorStops={[0, backgroundSettings.startColor, 1, backgroundSettings.endColor]}
        />
      );
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressed.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressed.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (transformerRef.current && selectedId && selectedTool === 'select' && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, selectedTool, shapes]);

  const handleShapeDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    if (shape.type === 'circle') {
      const w = shape.width || 80;
      const h = shape.height || 80;
      updateShape(id, { x: node.x() - w / 2, y: node.y() - h / 2 });
    } else {
      updateShape(id, { x: node.x(), y: node.y() });
    }
  }, [shapes, updateShape]);

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const newAttrs: Partial<ShapeConfig> = {
      rotation: node.rotation(),
    };

    if (shape.type === 'text' || shape.type === 'number') {
      newAttrs.fontSize = Math.max(8, Math.min(200, Math.round((shape.fontSize || 24) * ((scaleX + scaleY) / 2))));
      if (shape.width) newAttrs.width = (shape.width || 100) * scaleX;
      if (shape.height) newAttrs.height = (shape.height || 30) * scaleY;
      newAttrs.x = node.x();
      newAttrs.y = node.y();
    } else if (shape.type === 'circle') {
      const newWidth = (shape.width || 80) * scaleX;
      const newHeight = (shape.height || 80) * scaleY;
      newAttrs.width = Math.max(10, newWidth);
      newAttrs.height = Math.max(10, newHeight);
      newAttrs.x = node.x() - newWidth / 2;
      newAttrs.y = node.y() - newHeight / 2;
    } else {
      if (shape.width) newAttrs.width = (shape.width || 100) * scaleX;
      if (shape.height) newAttrs.height = (shape.height || 30) * scaleY;
      newAttrs.x = node.x();
      newAttrs.y = node.y();
    }

    updateShape(id, newAttrs);
  }, [shapes, updateShape]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = getRelativePointer();
    if (!pos) return;

    if (selectedTool === 'pen' || selectedTool === 'arrow') {
      isDrawing.current = true;
      startPointRef.current = { x: pos.x, y: pos.y };
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      drawingRef.current = {
        id,
        type: selectedTool === 'arrow' ? 'arrow' : 'line',
        x: 0, y: 0,
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth,
        opacity,
        fill: 'transparent',
      };
      addShape(drawingRef.current, false, false);
    } else if (selectedTool === 'rectangle' || selectedTool === 'circle') {
      isDrawing.current = true;
      startPointRef.current = { x: pos.x, y: pos.y };
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      const shapeType = selectedTool === 'rectangle' ? 'rect' : 'circle';
      drawingRef.current = {
        id,
        type: shapeType,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        fill: fillEnabled ? color : 'transparent',
        fillEnabled: fillEnabled,
        stroke: color,
        strokeWidth,
        opacity,
      };
      addShape(drawingRef.current, false, false);
    } else if (selectedTool === 'crop') {
      setCropMode(true);
      cropStartPos.current = { x: pos.x, y: pos.y };
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  }, [selectedTool, color, strokeWidth, opacity, fillEnabled, addShape, setCropMode, setCropRect, getRelativePointer]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const point = getRelativePointer();
    if (!point) return;

    if (isDrawing.current && drawingRef.current) {
      const startPoint = startPointRef.current;
      if (!startPoint) return;

      if (drawingRef.current.type === 'rect' || drawingRef.current.type === 'circle') {
        const dx = point.x - startPoint.x;
        const dy = point.y - startPoint.y;

        let width = Math.abs(dx);
        let height = Math.abs(dy);

        if (isShiftPressed.current) {
          const size = Math.max(width, height);
          width = size;
          height = size;
        }

        const x = dx >= 0 ? startPoint.x : startPoint.x - width;
        const y = dy >= 0 ? startPoint.y : startPoint.y - height;

        drawingRef.current = { ...drawingRef.current, x, y, width, height };
        updateShape(drawingRef.current.id, {
          x,
          y,
          width,
          height,
        }, false);
      } else {
        if (isShiftPressed.current) {
          const constrainedEnd = getConstrainedPoint(startPoint, point);
          const newPoints = [startPoint.x, startPoint.y, constrainedEnd.x, constrainedEnd.y];
          drawingRef.current.points = newPoints;
          updateShape(drawingRef.current.id, { points: newPoints }, false);
        } else {
          const currentPoints = drawingRef.current.points || [];
          const newPoints = [...currentPoints, point.x, point.y];
          drawingRef.current.points = newPoints;
          updateShape(drawingRef.current.id, { points: newPoints }, false);
        }
      }
    } else if (selectedTool === 'crop' && cropStartPos.current) {
      const start = cropStartPos.current;
      setCropRect({
        x: Math.min(point.x, start.x),
        y: Math.min(point.y, start.y),
        width: Math.abs(point.x - start.x),
        height: Math.abs(point.y - start.y),
      });
    }
  }, [selectedTool, updateShape, setCropRect, getRelativePointer]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing.current && drawingRef.current) {
      const shape = drawingRef.current;
      const isRectOrCircle = shape.type === 'rect' || shape.type === 'circle';

      if (isRectOrCircle) {
        const minDimension = 5;
        const hasValidSize = (shape.width || 0) > minDimension && (shape.height || 0) > minDimension;

        if (hasValidSize) {
          commitShapes();
          setSelectedId(shape.id);
          onChangeTool?.('select');
        } else {
          deleteShape(shape.id);
        }
      } else {
        commitShapes();
        setSelectedId(shape.id);
        onChangeTool?.('select');
      }

      isDrawing.current = false;
      drawingRef.current = null;
      startPointRef.current = null;
      justFinishedDrawing.current = true;
    }
    cropStartPos.current = null;
  }, [commitShapes, setSelectedId, onChangeTool, deleteShape]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (justFinishedDrawing.current) {
      justFinishedDrawing.current = false;
      return;
    }
    if (selectedTool === 'select') {
      setSelectedId(null);
      return;
    }
    if (selectedTool === 'crop' || selectedTool === 'pen' || selectedTool === 'arrow' || selectedTool === 'rectangle' || selectedTool === 'circle') return;
    const pos = getRelativePointer();
    if (!pos) return;
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    if (selectedTool === 'text' || selectedTool === 'number') {
      const isNumber = selectedTool === 'number';
      const text = selectedTool === 'number'
        ? (shapes.filter(s => s.type === 'number').length + 1).toString()
        : 'Text';
      const fillColor = selectedTool === 'number' ? '#ff3b30' : color;
      const style = selectedTool === 'number' ? 'bold' : '';
      addShape({
        id, type: selectedTool === 'number' ? 'number' : 'text',
        x: pos.x, y: pos.y,
        text, fill: fillColor, fillEnabled: true, fontSize: 24, fontFamily: 'Inter', fontStyle: style, opacity,
      });
      if (!isNumber) {
        onChangeTool?.('select');
      }
    }
  }, [selectedTool, color, strokeWidth, opacity, shapes, addShape, onChangeTool, getRelativePointer]);

  const renderShape = (shape: ShapeConfig) => {
    if (editingTextId === shape.id) return null;

    const commonProps = {
      id: shape.id,
      key: shape.id,
      draggable: selectedTool === 'select',
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (selectedTool === 'select' || shape.type === 'text' || shape.type === 'number') {
          setSelectedId(shape.id);
          if (selectedTool !== 'select') onChangeTool?.('select');
          e.cancelBubble = true;
        }
      },
      onTap: (e: Konva.KonvaEventObject<Event>) => {
        if (selectedTool === 'select' || shape.type === 'text' || shape.type === 'number') {
          setSelectedId(shape.id);
          if (selectedTool !== 'select') onChangeTool?.('select');
          e.cancelBubble = true;
        }
      },
      onDragEnd: handleShapeDragEnd,
      onTransformEnd: handleTransformEnd,
      onDblClick: () => { if (shape.type === 'text' || shape.type === 'number') onTextDoubleClick(shape); },
      stroke: shape.stroke,
      fill: shape.fillEnabled === false ? 'transparent' : (shape.fill || 'transparent'),
      strokeWidth: shape.strokeWidth,
      opacity: shape.opacity,
    };

    const rotation = shape.rotation || 0;

    switch (shape.type) {
      case 'rect':
        return <Rect {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rotation={rotation} />;
      case 'circle':
        return <Ellipse {...commonProps} x={shape.x + (shape.width || 80) / 2} y={shape.y + (shape.height || 80) / 2} radiusX={(shape.width || 80) / 2} radiusY={(shape.height || 80) / 2} rotation={rotation} />;
      case 'arrow':
        return <Arrow {...commonProps} points={shape.points!} rotation={rotation} />;
      case 'text':
      case 'number':
        return (
          <Text
            {...commonProps}
            x={shape.x}
            y={shape.y}
            text={shape.text}
            fontSize={shape.fontSize}
            fontFamily={shape.fontFamily}
            fontStyle={shape.fontStyle}
            rotation={rotation}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={shape.points!}
            tension={0.2}
            lineCap="round"
            lineJoin="round"
            rotation={rotation}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stage
      width={stageSize.width}
      height={stageSize.height}
      ref={stageRef}
      onClick={handleStageClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ margin: 'auto', display: 'block' }}
    >
      <Layer>
        {renderBackground()}
        <Group
          ref={contentGroupRef}
          x={groupOffsetX}
          y={groupOffsetY}
        >
          {image && (
            <KonvaImage
              id="main-image"
              image={image}
              x={0}
              y={0}
              width={image.width}
              height={image.height}
              cornerRadius={25}
              scaleX={imageTransform.scaleX}
              scaleY={imageTransform.scaleY}
              rotation={imageTransform.rotation}
              draggable={false}
            />
          )}
          {shapes.map(renderShape)}
          {selectedId && selectedTool === 'select' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
              borderStroke={BOUNDING_BOX_STROKE}
              borderStrokeWidth={1.5}
              borderDash={[4, 4]}
              anchorFill={HANDLE_FILL}
              anchorStroke={HANDLE_STROKE}
              anchorSize={HANDLE_ANCHOR_SIZE}
              anchorCornerRadius={2}
              keepRatio={false}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox;
                return newBox;
              }}
            />
          )}
        </Group>
        {cropMode && cropRect && (
          <Rect
            {...cropRect}
            fill="rgba(0,0,0,0.3)"
            stroke="#fff"
            strokeWidth={2}
            dash={[10, 5]}
            draggable
            onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
              setCropRect(prev => prev ? { ...prev, x: e.target.x(), y: e.target.y() } : null)
            }
          />
        )}
      </Layer>
    </Stage>
  );
});

export default Canvas;
import React, { forwardRef, useImperativeHandle, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Rect, Circle, Arrow, Text, Line, Image as KonvaImage, Transformer } from 'react-konva';
import { ShapeConfig, Tool } from '@/types/types';
import { BackgroundSettings } from '@/lib/hooks/useBackground';

const HANDLE_ANCHOR_SIZE = 10;
const HANDLE_STROKE_WIDTH = 2;
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
  addShape: (shape: ShapeConfig, select?: boolean) => void;
  updateShape: (id: string, attrs: Partial<ShapeConfig>, save?: boolean) => void;
  commitShapes: () => void;
  color: string;
  strokeWidth: number;
  opacity: number;
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

const Canvas = forwardRef<Konva.Stage, CanvasProps>(({
  image, stageSize, selectedTool, shapes, selectedId, setSelectedId,
  addShape, updateShape, commitShapes, color, strokeWidth, opacity,
  cropMode, setCropMode, cropRect, setCropRect,
  onTextDoubleClick, editingTextId,
  backgroundSettings, imageTransform, onImageTransform,
  onChangeTool,
}, ref) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const imageTransformerRef = useRef<Konva.Transformer>(null);
  const drawingRef = useRef<ShapeConfig | null>(null);
  const isDrawing = useRef(false);
  const cropStartPos = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => stageRef.current as Konva.Stage);


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
    updateShape(id, {
      x: node.x(),
      y: node.y(),
    });
  }, [updateShape]);

  const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const id = node.id();
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update properties
    node.scaleX(1);
    node.scaleY(1);

    const newAttrs: Partial<ShapeConfig> = {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
    };

    if (shape.type === 'text' || shape.type === 'number') {
      // For text, scale the font size proportionally
      const newFontSize = Math.round((shape.fontSize || 24) * ((scaleX + scaleY) / 2));
      newAttrs.fontSize = Math.max(8, Math.min(200, newFontSize));
      // Also update width/height if available
      if (shape.width) newAttrs.width = (shape.width || 100) * scaleX;
      if (shape.height) newAttrs.height = (shape.height || 30) * scaleY;
    } else {
      // For non-text shapes, update width/height
      if (shape.width) newAttrs.width = (shape.width || 100) * scaleX;
      if (shape.height) newAttrs.height = (shape.height || 30) * scaleY;
    }

    updateShape(id, newAttrs);
  }, [shapes, updateShape]);

  useEffect(() => {
    if (backgroundSettings.enabled && stageRef.current) {
      const node = stageRef.current.findOne('#main-image');
      if (node && imageTransformerRef.current) {
        imageTransformerRef.current.nodes([node]);
        imageTransformerRef.current.getLayer()?.batchDraw();
      }
    } else if (imageTransformerRef.current) {
      imageTransformerRef.current.nodes([]);
      imageTransformerRef.current.getLayer()?.batchDraw();
    }
  }, [backgroundSettings.enabled, imageTransform]);

  const handleImageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onImageTransform({
      ...imageTransform,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleImageTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    onImageTransform({
      x: node.x(),
      y: node.y(),
      scaleX: imageTransform.scaleX * scaleX,
      scaleY: imageTransform.scaleY * scaleY,
      rotation: node.rotation(),
    });
  };


  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    if (selectedTool === 'pen' || selectedTool === 'arrow') {
      isDrawing.current = true;
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      const newShape: ShapeConfig = {
        id,
        type: selectedTool === 'arrow' ? 'arrow' : 'line',
        x: 0, y: 0,
        points: [pos.x, pos.y],
        stroke: color,
        strokeWidth,
        opacity,
        fill: 'transparent',
      };
      drawingRef.current = newShape;
      addShape(newShape, false);
    } else if (selectedTool === 'crop') {
      setCropMode(true);
      cropStartPos.current = { x: pos.x, y: pos.y };
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  }, [selectedTool, color, strokeWidth, opacity, addShape, setCropMode, setCropRect]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const point = e.target.getStage()?.getPointerPosition();
    if (!point) return;

    if (isDrawing.current && drawingRef.current) {
      const shape = drawingRef.current;
      const newPoints = [...(shape.points || []), point.x, point.y];
      updateShape(shape.id, { points: newPoints }, false);
    } else if (selectedTool === 'crop' && cropStartPos.current) {
      const start = cropStartPos.current;
      setCropRect({
        x: Math.min(point.x, start.x),
        y: Math.min(point.y, start.y),
        width: Math.abs(point.x - start.x),
        height: Math.abs(point.y - start.y),
      });
    }
  }, [selectedTool, updateShape, setCropRect]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing.current) {
      commitShapes(); 
      isDrawing.current = false;
      drawingRef.current = null;
    }
    cropStartPos.current = null;
  }, [commitShapes]);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool === 'select') {
      setSelectedId(null);
      return;
    }
    if (selectedTool === 'crop' || selectedTool === 'pen' || selectedTool === 'arrow') return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    if (selectedTool === 'text' || selectedTool === 'number') {
      const text = selectedTool === 'number'
        ? (shapes.filter(s => s.type === 'number').length + 1).toString()
        : 'Text';
      const fillColor = selectedTool === 'number' ? '#ff3b30' : color;
      const style = selectedTool === 'number' ? 'bold' : '';
      addShape({
        id, type: selectedTool === 'number' ? 'number' : 'text',
        x: pos.x, y: pos.y,
        text, fill: fillColor, fontSize: 24, fontFamily: 'Inter', fontStyle: style, opacity,
      });
      // Auto-switch to select tool so the user can move/resize immediately
      onChangeTool?.('select');
    } else if (selectedTool === 'rectangle') {
      addShape({
        id, type: 'rect', x: pos.x, y: pos.y,
        width: 100, height: 80, fill: 'transparent', stroke: color, strokeWidth, opacity,
      });
    } else if (selectedTool === 'circle') {
      addShape({
        id, type: 'circle', x: pos.x, y: pos.y,
        width: 80, height: 80, fill: 'transparent', stroke: color, strokeWidth, opacity,
      });
    }
    commitShapes();
  }, [selectedTool, color, strokeWidth, opacity, shapes, addShape, commitShapes, onChangeTool]);

  const renderShape = (shape: ShapeConfig) => {
    if (editingTextId === shape.id) return null;

    const commonProps = {
      id: shape.id,
      key: shape.id,
      draggable: selectedTool === 'select',
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Text/number shapes can be clicked in any tool mode to select them
        if (selectedTool === 'select' || shape.type === 'text' || shape.type === 'number') {
          setSelectedId(shape.id);
          if (selectedTool !== 'select') {
            onChangeTool?.('select');
          }
          e.cancelBubble = true;
        }
      },
      onTap: (e: Konva.KonvaEventObject<Event>) => {
        if (selectedTool === 'select' || shape.type === 'text' || shape.type === 'number') {
          setSelectedId(shape.id);
          if (selectedTool !== 'select') {
            onChangeTool?.('select');
          }
          e.cancelBubble = true;
        }
      },
      onDragEnd: handleShapeDragEnd,
      onTransformEnd: handleTransformEnd,
      onDblClick: () => { if (shape.type === 'text' || shape.type === 'number') onTextDoubleClick(shape); },
      stroke: shape.stroke,
      fill: shape.fill,
      strokeWidth: shape.strokeWidth,
      opacity: shape.opacity,
    };

    switch (shape.type) {
      case 'rect':
        return <Rect {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} />;
      case 'circle':
        return <Circle {...commonProps} x={shape.x} y={shape.y} radius={(shape.width || 80) / 2} />;
      case 'arrow':
        return <Arrow {...commonProps} points={shape.points!} />;
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
            rotation={shape.rotation || 0}
          />
        );
        case 'line':
          return (
            <Line
              {...commonProps}
              points={shape.points!}
              tension={0.3}
              lineCap="round"
              lineJoin="round"
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
        {image && (
          <KonvaImage
            id="main-image"
            image={image}
            x={imageTransform.x}
            y={imageTransform.y}
            width={image.width}  
            height={image.height}
              cornerRadius={25}
            scaleX={imageTransform.scaleX}
            scaleY={imageTransform.scaleY}
            rotation={imageTransform.rotation}
            draggable={backgroundSettings.enabled}
            onDragEnd={handleImageDragEnd}
            onTransformEnd={handleImageTransformEnd}
          />
        )}
        {shapes.map(renderShape)}
        {selectedId && selectedTool === 'select' && (
          <Transformer
            ref={transformerRef}
            rotateEnabled={true}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
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
        {/*{backgroundSettings.enabled && <Transformer ref={imageTransformerRef} />}*/}
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
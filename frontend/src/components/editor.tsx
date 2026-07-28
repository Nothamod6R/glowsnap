import React, { useState, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Arrow, Text, Line, Transformer } from 'react-konva';
import {
  Crop, ArrowUpRight, Type, Hash, Pen, Square, Circle as CircleIcon,
  Download, Undo2, Redo2, Trash2, X, Bold, Italic, Minus, Plus,
  Layers, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';

type Tool = 'select' | 'crop' | 'arrow' | 'text' | 'number' | 'pen' | 'rectangle' | 'circle';

interface ShapeConfig {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'text' | 'number' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  rotation?: number;
}

interface EditorProps {
  imageUrl: string;
  onBack: () => void;
}

export default function Editor({ imageUrl, onBack }: EditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [shapes, setShapes] = useState<ShapeConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [color, setColor] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [cropMode, setCropMode] = useState(false);
  const [history, setHistory] = useState<ShapeConfig[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      imageRef.current = img;
    };
  }, [imageUrl]);

  const saveHistory = useCallback((newShapes: ShapeConfig[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newShapes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const addShape = (shape: ShapeConfig) => {
    const newShapes = [...shapes, shape];
    setShapes(newShapes);
    saveHistory(newShapes);
    setSelectedId(shape.id);
  };

  const updateShape = (id: string, newAttrs: Partial<ShapeConfig>) => {
    const newShapes = shapes.map(s => s.id === id ? { ...s, ...newAttrs } : s);
    setShapes(newShapes);
    saveHistory(newShapes);
  };

  const deleteShape = (id: string) => {
    const newShapes = shapes.filter(s => s.id !== id);
    setShapes(newShapes);
    saveHistory(newShapes);
    setSelectedId(null);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setShapes(history[newIndex]);
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool === 'select' || selectedTool === 'crop' || selectedTool === 'pen') return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    if (selectedTool === 'text') {
      addShape({
        id, type: 'text', x: pointer.x, y: pointer.y,
        text: 'Text', fill: color, fontSize, fontFamily,
        fontStyle: (isBold ? 'bold ' : '') + (isItalic ? 'italic' : ''),
        opacity,
      });
    } else if (selectedTool === 'number') {
      const count = shapes.filter(s => s.type === 'number').length + 1;
      addShape({
        id, type: 'number', x: pointer.x, y: pointer.y,
        text: count.toString(), fill: '#ff3b30', fontSize: 28, fontFamily: 'Inter',
        fontStyle: 'bold', opacity: 1,
      });
    } else if (selectedTool === 'rectangle') {
      addShape({
        id, type: 'rect', x: pointer.x, y: pointer.y,
        width: 100, height: 80, fill: 'transparent', stroke: color,
        strokeWidth, opacity,
      });
    } else if (selectedTool === 'circle') {
      addShape({
        id, type: 'circle', x: pointer.x, y: pointer.y,
        width: 80, height: 80, fill: 'transparent', stroke: color,
        strokeWidth, opacity,
      });
    } else if (selectedTool === 'arrow') {
      addShape({
        id, type: 'arrow', x: pointer.x, y: pointer.y,
        points: [0, 0, 100, 0], stroke: color, strokeWidth, opacity,
      });
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (selectedTool !== 'pen') return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setIsDrawing(true);
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    addShape({
      id, type: 'line', x: 0, y: 0, points: [pos.x, pos.y],
      stroke: color, strokeWidth, opacity, fill: 'transparent',
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool !== 'pen') return;
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getPointerPosition();
    if (!point) return;
    const lastLine = shapes[shapes.length - 1];
    if (lastLine && lastLine.type === 'line') {
      const newPoints = lastLine.points!.concat([point.x, point.y]);
      updateShape(lastLine.id, { points: newPoints });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const startCrop = () => {
    setSelectedTool('crop');
    setCropMode(true);
    if (!cropRect) {
      setCropRect({ x: 50, y: 50, width: 300, height: 200 });
    }
  };

  const applyCrop = () => {
    setCropMode(false);
    setSelectedTool('select');
  };

  const cancelCrop = () => {
    setCropMode(false);
    setCropRect(null);
    setSelectedTool('select');
  };

  const exportImage = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const uri = stage.toDataURL({ pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = 'edited.png';
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (transformerRef.current && selectedId && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedId, shapes]);

  const handleSliderChange = (setter: (val: number) => void) => (v: number | readonly number[]) => {
    const value = Array.isArray(v) ? v[0] : v;
    setter(value);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/95 backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm hover:bg-white/10 px-3 py-1 rounded-lg">
          <X size={16} /> Back
        </button>
        <div className="flex gap-1">
          {([
            { tool: 'select', icon: Layers, label: 'Select' },
            { tool: 'crop', icon: Crop, label: 'Crop' },
            { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
            { tool: 'text', icon: Type, label: 'Text' },
            { tool: 'number', icon: Hash, label: 'Number' },
            { tool: 'pen', icon: Pen, label: 'Pen' },
            { tool: 'rectangle', icon: Square, label: 'Rect' },
            { tool: 'circle', icon: CircleIcon, label: 'Circle' },
          ] as const).map(({ tool, icon: Icon, label }) => (
            <Toggle
              key={tool}
              pressed={selectedTool === tool}
              onPressedChange={() => {
                if (tool === 'crop') startCrop();
                else setSelectedTool(tool);
              }}
              className="p-2"
              title={label}
            >
              <Icon size={16} />
            </Toggle>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={undo} className="p-2 hover:bg-white/10 rounded"><Undo2 size={16} /></button>
          <button onClick={redo} className="p-2 hover:bg-white/10 rounded"><Redo2 size={16} /></button>
          {selectedId && (
            <button onClick={() => deleteShape(selectedId)} className="p-2 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={exportImage} className="p-2 hover:bg-blue-500/20 rounded text-blue-400">
            <Download size={16} />
          </button>
        </div>
      </div>

      {selectedTool !== 'select' && selectedTool !== 'crop' && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Palette size={14} />
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <Minus size={14} />
            <Slider value={[strokeWidth]} min={1} max={20} onValueChange={handleSliderChange(setStrokeWidth)} className="w-24" />
            <Plus size={14} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Opacity</span>
            <Slider value={[opacity * 100]} min={10} max={100} onValueChange={handleSliderChange(val => setOpacity(val / 100))} className="w-24" />
          </div>
          {selectedTool === 'text' && (
            <>
              <div className="flex items-center gap-1">
                <Toggle pressed={isBold} onPressedChange={setIsBold}><Bold size={14} /></Toggle>
                <Toggle pressed={isItalic} onPressedChange={setIsItalic}><Italic size={14} /></Toggle>
              </div>
              <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="bg-white/10 rounded text-xs p-1">
                {['Inter', 'Arial', 'Courier New', 'Georgia'].map(f => <option key={f}>{f}</option>)}
              </select>
              <Slider value={[fontSize]} min={12} max={72} onValueChange={handleSliderChange(setFontSize)} className="w-20" />
            </>
          )}
        </div>
      )}

      <div className="flex-1 relative" style={{ background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)' }}>
        {image && (
          <Stage
            width={window.innerWidth * 0.8}
            height={window.innerHeight * 0.75}
            ref={stageRef}
            onClick={handleStageClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ margin: 'auto', display: 'block' }}
          >
            <Layer>
              <KonvaImage image={image} x={0} y={0} width={image.width} height={image.height} />
              {shapes.map(shape => {
                const commonProps = {
                  id: shape.id,
                  key: shape.id,
                  draggable: selectedTool === 'select',
                  onClick: () => { if (selectedTool === 'select') setSelectedId(shape.id); },
                  stroke: shape.stroke,
                  fill: shape.fill,
                  strokeWidth: shape.strokeWidth,
                  opacity: shape.opacity,
                };
                switch (shape.type) {
                  case 'rect': return <Rect {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} />;
                  case 'circle': return <Circle {...commonProps} x={shape.x} y={shape.y} radius={(shape.width || 80) / 2} />;
                  case 'arrow': return <Arrow {...commonProps} points={shape.points!} />;
                  case 'text': case 'number':
                    return <Text {...commonProps} x={shape.x} y={shape.y} text={shape.text} fontSize={shape.fontSize} fontFamily={shape.fontFamily} fontStyle={shape.fontStyle} />;
                  case 'line': return <Line {...commonProps} points={shape.points!} tension={0.5} lineCap="round" />;
                  default: return null;
                }
              })}
              {selectedId && <Transformer ref={transformerRef} />}
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
        )}
        {cropMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={applyCrop} variant="secondary">Apply Crop</Button>
            <Button onClick={cancelCrop} variant="ghost">Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
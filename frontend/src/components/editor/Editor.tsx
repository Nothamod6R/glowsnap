import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { X, Download, Undo2, Redo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tool, EditorProps } from '@/types/types';
import { useShapes } from '@/hooks/useShapes';
import { useTextEditing } from '@/hooks/useTextEditing';
import { useBackground } from '@/hooks/useBackground';
import Toolbar from './Toolbar';
import OptionsBar from './OptionsBar';
import BackgroundControls from './BackgroundControls';
import TextEditor from './TextEditor';
import Canvas from './Canvas';
import { SaveFileDialog, WriteFile } from '../../../wailsjs/go/main/App';


export default function Editor({ imageUrl, onBack }: EditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ff3b30');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });

  const {
    background,
    toggleBackground,
    setType,
    setStartColor,
    setEndColor,
    setAngle,
    setPadding,
  } = useBackground();

  const {
    shapes, selectedId, setSelectedId,
    addShape, updateShape, deleteShape,
    commitShapes, handleUndo, handleRedo,
  } = useShapes();

  const {
    editingTextId, editingTextValue, editingTextPosition,
    startEditing, finishEditing, setEditingTextValue,
  } = useTextEditing(updateShape);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      const maxW = window.innerWidth * 0.8;
      const maxH = window.innerHeight * 0.75;
      const baseScale = Math.min(maxW / img.width, maxH / img.height, 1);
      const pad = background.enabled ? background.padding : 0;
      setStageSize({
        width: img.width * baseScale + pad * 2,
        height: img.height * baseScale + pad * 2,
      });
      setImageTransform({
        x: pad,
        y: pad,
        scaleX: baseScale,
        scaleY: baseScale,
        rotation: 0,
      });
    };
  }, [imageUrl, background.enabled, background.padding]);

  useEffect(() => {
    if (image) {
      const pad = background.enabled ? background.padding : 0;
      setImageTransform(prev => ({ ...prev, x: pad, y: pad }));
    }
  }, [background.padding, background.enabled, image]);

  useEffect(() => {
    if (selectedId) {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape && (shape.type === 'text' || shape.type === 'number')) {
        updateShape(selectedId, {
          fontSize,
          fontFamily,
          fontStyle: (isBold ? 'bold ' : '') + (isItalic ? 'italic' : ''),
        }, false);
      }
    }
  }, [fontSize, fontFamily, isBold, isItalic]);

  useEffect(() => {
    if (selectedId) {
      updateShape(selectedId, { stroke: color, strokeWidth, opacity }, false);
    }
  }, [color, strokeWidth, opacity]);

  const handleToolChange = (tool: Tool) => {
    setSelectedTool(tool);
    setCropMode(tool === 'crop');
  };

  const applyCrop = () => {
    setCropMode(false);
    setCropRect(null);
    setSelectedTool('select');
  };

  const cancelCrop = () => {
    setCropMode(false);
    setCropRect(null);
    setSelectedTool('select');
  };

  const exportImage = async () => {
    if (!stageRef.current) return;

    try {
      const defaultName = `edited-${Date.now()}.png`;
      const filePath = await SaveFileDialog(defaultName);

      if (!filePath) return;

      const uri = stageRef.current.toDataURL({ pixelRatio: 2 });

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8arr = new Uint8Array(arrayBuffer);

      await WriteFile(filePath, Array.from(uint8arr));
      
      console.log('Image saved to:', filePath);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };




  return (
    <div className="w-full h-screen flex flex-col bg-black/95 backdrop-blur-3xl rounded-3xl border border-white/10 overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-sm hover:bg-white/10 px-3 py-1 rounded-lg">
          <X size={16} /> Back
        </button>
        <Toolbar selectedTool={selectedTool} onToolChange={handleToolChange} />
        <div className="flex gap-2">
          <button onClick={handleUndo} className="p-2 hover:bg-white/10 rounded"><Undo2 size={16} /></button>
          <button onClick={handleRedo} className="p-2 hover:bg-white/10 rounded"><Redo2 size={16} /></button>
          {selectedId && (
            <button onClick={() => deleteShape(selectedId)} className="p-2 hover:bg-red-500/20 rounded text-red-400">
              <Trash2 size={16} />
            </button>
          )}
          <button  onClick={exportImage} className="p-2 hover:bg-white/10  rounded ">
            <Download size={16} />
          </button>
        </div>
      </div>

      <BackgroundControls
        bg={background}
        onToggle={toggleBackground}
        onTypeChange={setType}
        onStartColor={setStartColor}
        onEndColor={setEndColor}
        onAngle={setAngle}
        onPadding={setPadding}
      />

      <OptionsBar
        selectedTool={selectedTool}
        color={color} setColor={setColor}
        strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
        opacity={opacity} setOpacity={setOpacity}
        fontSize={fontSize} setFontSize={setFontSize}
        fontFamily={fontFamily} setFontFamily={setFontFamily}
        isBold={isBold} setIsBold={setIsBold}
        isItalic={isItalic} setIsItalic={setIsItalic}
      />

      <div className="flex-1 relative wails-no-drag flex justify-center items-center flex-col" style={{ background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)' }}>
        <Canvas
          ref={stageRef}
          image={image}
          stageSize={stageSize}
          selectedTool={selectedTool}
          shapes={shapes}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          addShape={addShape}
          updateShape={updateShape}
          commitShapes={commitShapes}
          color={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          cropMode={cropMode}
          setCropMode={setCropMode}
          cropRect={cropRect}
          setCropRect={setCropRect}
          onTextDoubleClick={startEditing}
          editingTextId={editingTextId}
          backgroundSettings={background}
          imageTransform={imageTransform}
          onImageTransform={setImageTransform}
        />
        {editingTextId && (
          <TextEditor
            value={editingTextValue}
            onChange={setEditingTextValue}
            onFinish={finishEditing}
            position={editingTextPosition}
            fontSize={fontSize}
            fontFamily={fontFamily}
            color={color}
          />
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

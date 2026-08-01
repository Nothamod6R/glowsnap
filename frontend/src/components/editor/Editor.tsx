import React, { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { X, Download, Undo2, Redo2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tool, EditorProps, ShapeConfig } from '@/types/types';
import { useShapes } from '@/lib/hooks/useShapes';
import { useTextEditing } from '@/lib/hooks/useTextEditing';
import { useBackground } from '@/lib/hooks/useBackground';
import Toolbar from './Toolbar';
import OptionsBar from './OptionsBar';
import BackgroundControls from './BackgroundControls';
import TextEditor from './TextEditor';
import Canvas from './Canvas';
import FloatingToolbar from './FloatingToolbar';
import { SaveFileDialog, WriteFile } from '../../../wailsjs/go/main/App';


export default function Editor({ imageUrl, onBack }: EditorProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [stageContainerRect, setStageContainerRect] = useState<DOMRect | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [color, setColor] = useState('#ff3b30');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [fillEnabled, setFillEnabled] = useState(false);
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
    if (selectedId && selectedTool === 'select') {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape && (shape.type === 'text' || shape.type === 'number')) {
        updateShape(selectedId, {
          fontSize,
          fontFamily,
          fontStyle: (isBold ? 'bold ' : '') + (isItalic ? 'italic' : ''),
        }, false);
      }
    }
  }, [fontSize, fontFamily, isBold, isItalic, selectedId, selectedTool]);

  useEffect(() => {
    if (selectedId && selectedTool === 'select') {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape) {
        if (shape.type === 'text' || shape.type === 'number') {
          updateShape(selectedId, { fill: color }, false);
        } else {
          const attrs: Partial<ShapeConfig> = { stroke: color, strokeWidth, opacity };
          if (shape.type === 'rect' || shape.type === 'circle') {
            attrs.fill = fillEnabled ? color : 'transparent';
            attrs.fillEnabled = fillEnabled;
          }
          updateShape(selectedId, attrs, false);
        }
      }
    }
  }, [color, strokeWidth, opacity, fillEnabled, selectedId, selectedTool]);

  useEffect(() => {
    if (canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      setStageContainerRect(rect);
    }
  }, [stageSize, image]);

  useEffect(() => {
    if (selectedId) {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape) {
        if (shape.type === 'text' || shape.type === 'number') {
          if (shape.fill) setColor(shape.fill);
          if (shape.fontSize) setFontSize(shape.fontSize);
          if (shape.fontFamily) setFontFamily(shape.fontFamily);
          if (shape.fontStyle) {
            setIsBold(shape.fontStyle.includes('bold'));
            setIsItalic(shape.fontStyle.includes('italic'));
          }
        } else {
          if (shape.stroke) setColor(shape.stroke);
          if (shape.strokeWidth !== undefined) setStrokeWidth(shape.strokeWidth);
          if (shape.opacity !== undefined) setOpacity(shape.opacity);
          if (shape.type === 'rect' || shape.type === 'circle') {
            if (shape.fillEnabled !== undefined) setFillEnabled(shape.fillEnabled);
          }
        }
      }
    }
  }, [selectedId, shapes]);

  const handleDuplicate = useCallback((shape: ShapeConfig) => {
    const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newShape: ShapeConfig = {
      ...shape,
      id: newId,
      x: (shape.x || 0) + 20,
      y: (shape.y || 0) + 20,
    };
    addShape(newShape, true);
  }, [addShape]);

  const handleToolChange = (tool: Tool) => {
    setSelectedTool(tool);
    setCropMode(tool === 'crop');
  };

  const applyCrop = () => {
    if (!image || !cropRect || !stageRef.current) return;

    const scaleX = imageTransform.scaleX;
    const scaleY = imageTransform.scaleY;
    const offsetX = imageTransform.x;
    const offsetY = imageTransform.y;

    const cropX = (cropRect.x - offsetX) / scaleX;
    const cropY = (cropRect.y - offsetY) / scaleY;
    const cropWidth = cropRect.width / scaleX;
    const cropHeight = cropRect.height / scaleY;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      image,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );

    const croppedImage = new window.Image();
    croppedImage.src = canvas.toDataURL();
    croppedImage.onload = () => {
      setImage(croppedImage);
      const maxW = window.innerWidth * 0.8;
      const maxH = window.innerHeight * 0.75;
      const baseScale = Math.min(maxW / croppedImage.width, maxH / croppedImage.height, 1);
      const pad = background.enabled ? background.padding : 0;
      setStageSize({
        width: croppedImage.width * baseScale + pad * 2,
        height: croppedImage.height * baseScale + pad * 2,
      });
      setImageTransform({
        x: pad,
        y: pad,
        scaleX: baseScale,
        scaleY: baseScale,
        rotation: 0,
      });
    };

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

  const clipboardRef = useRef<ShapeConfig | null>(null);

  useEffect(() => {

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      if (isEditableTarget(e.target)) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteShape(selectedId);
        return;
      }

      if (isCtrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (isCtrl && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (isCtrl && e.key === 's' || isCtrl && e.key === 'S') {
        e.preventDefault();
        exportImage();
        return;
      }

      if (isCtrl && e.key === 'c' && selectedId) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedId);
        if (shape) {
          clipboardRef.current = { ...shape };
        }
        return;
      }

      if (isCtrl && e.key === 'v' && clipboardRef.current) {
        e.preventDefault();
        const newId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const pastedShape: ShapeConfig = {
          ...clipboardRef.current,
          id: newId,
          x: (clipboardRef.current.x || 0) + 20,
          y: (clipboardRef.current.y || 0) + 20,
        };
        addShape(pastedShape, true);
        setSelectedTool('select');
        return;
      }

      if (isCtrl && e.key === 'd' && selectedId) {
        e.preventDefault();
        const shape = shapes.find(s => s.id === selectedId);
        if (shape) {
          handleDuplicate(shape);
        }
        return;
      }

      if (isCtrl && e.key === 'y' && !editingTextId) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedId(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, shapes, editingTextId, deleteShape, addShape, commitShapes, handleDuplicate, handleUndo, handleRedo, setSelectedTool, setSelectedId]);

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
          <button onClick={exportImage} className="p-2 hover:bg-white/10  rounded ">
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
        fillEnabled={fillEnabled} setFillEnabled={setFillEnabled}
      />

      <div
        ref={canvasContainerRef}
        className="flex-1 relative wails-no-drag flex justify-center items-center flex-col"
        style={{ background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)' }}
      >
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
          deleteShape={deleteShape}
          commitShapes={commitShapes}
          color={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          fillEnabled={fillEnabled}
          cropMode={cropMode}
          setCropMode={setCropMode}
          cropRect={cropRect}
          setCropRect={setCropRect}
          onTextDoubleClick={startEditing}
          editingTextId={editingTextId}
          backgroundSettings={background}
          imageTransform={imageTransform}
          onImageTransform={setImageTransform}
          onChangeTool={handleToolChange}
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
        <FloatingToolbar
          selectedShape={shapes.find(s => s.id === selectedId) || null}
          visible={selectedTool === 'select' && !!selectedId}
          stageContainerRect={stageContainerRect}
          stageSize={stageSize}
          onUpdateShape={updateShape}
          onDelete={deleteShape}
          onDuplicate={handleDuplicate}
          color={color}
          setColor={setColor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          fontSize={fontSize}
          setFontSize={setFontSize}
          opacity={opacity}
          setOpacity={setOpacity}
          isBold={isBold}
          setIsBold={setIsBold}
          isItalic={isItalic}
          setIsItalic={setIsItalic}
          fillEnabled={fillEnabled}
          setFillEnabled={setFillEnabled}
        />
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
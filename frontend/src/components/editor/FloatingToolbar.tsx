import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2,
  Copy,
  RotateCw,
  Type,
  Layers,
  Bold,
  Italic,
  Palette,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { ShapeConfig } from '@/types/types';

interface FloatingToolbarProps {
  selectedShape: ShapeConfig | null;
  visible: boolean;
  stageContainerRect: DOMRect | null;
  stageSize: { width: number; height: number };
  onUpdateShape: (id: string, attrs: Partial<ShapeConfig>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (shape: ShapeConfig) => void;
  color: string;
  setColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  isBold: boolean;
  setIsBold: (b: boolean) => void;
  isItalic: boolean;
  setIsItalic: (i: boolean) => void;
}

export default function FloatingToolbar({
  selectedShape,
  visible,
  stageContainerRect,
  stageSize,
  onUpdateShape,
  onDelete,
  onDuplicate,
  color,
  setColor,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  opacity,
  setOpacity,
  isBold,
  setIsBold,
  isItalic,
  setIsItalic,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!selectedShape || !stageContainerRect) return;
    const stageCenterX = window.innerWidth * 0.5;
    const stageLeft = stageCenterX - stageSize.width / 2;
    const stageTop = stageContainerRect.top;
    const shapeX = selectedShape.x || 0;
    const shapeY = selectedShape.y || 0;
    const viewportX = stageLeft + shapeX;
    const viewportY = stageTop + shapeY;
    setPosition({ x: viewportX, y: viewportY });
  }, [selectedShape, stageContainerRect, stageSize]);

  const handleOpacityChange = (v: number | readonly number[]) => {
    if (!selectedShape) return;
    const val = Array.isArray(v) ? v[0] : v;
    const opacityVal = val / 100;
    setOpacity(opacityVal);
    onUpdateShape(selectedShape.id, { opacity: opacityVal });
  };

  const handleFontSizeChange = (v: number | readonly number[]) => {
    if (!selectedShape) return;
    const val = Array.isArray(v) ? v[0] : v;
    setFontSize(val);
    onUpdateShape(selectedShape.id, { fontSize: val });
  };

  const handleRotationChange = (v: number | readonly number[]) => {
    if (!selectedShape) return;
    const val = Array.isArray(v) ? v[0] : v;
    onUpdateShape(selectedShape.id, { rotation: val });
  };

  const handleDuplicate = () => {
    if (!selectedShape) return;
    onDuplicate(selectedShape);
  };

  const handleDelete = () => {
    if (!selectedShape) return;
    onDelete(selectedShape.id);
  };

  const isText = selectedShape?.type === 'text' || selectedShape?.type === 'number';
  if (!isText) return null;

  const currentOpacity = selectedShape?.opacity ?? 1;
  const currentFontSize = selectedShape?.fontSize ?? 24;
  const currentRotation = selectedShape?.rotation ?? 0;

  return (
    <AnimatePresence>
      {visible && selectedShape && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
          className="absolute z-50"
          style={{
            left: position.x,
            top: position.y - 70,
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
          }}
        >
          <div className="flex items-center gap-1.5 bg-gray-900/95 backdrop-blur-xl border border-white/15 rounded-xl px-2.5 py-2 shadow-2xl shadow-black/50">
            {/* Color Picker */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-1.5 py-1">
              <Palette size={12} className="text-white/50 shrink-0" />
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Bold / Italic */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
              <Toggle
                pressed={isBold}
                onPressedChange={setIsBold}
                className="data-[state=on]:bg-white/20 text-white/60 hover:text-white rounded p-1 h-6 w-6"
                title="Bold"
              >
                <Bold size={12} />
              </Toggle>
              <Toggle
                pressed={isItalic}
                onPressedChange={setIsItalic}
                className="data-[state=on]:bg-white/20 text-white/60 hover:text-white rounded p-1 h-6 w-6"
                title="Italic"
              >
                <Italic size={12} />
              </Toggle>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Font Family */}
            <div className="bg-white/5 rounded-lg px-1.5 py-1">
              <select
                value={fontFamily}
                onChange={e => setFontFamily(e.target.value)}
                className="bg-transparent text-[10px] text-white/90 border border-white/10 rounded px-1 py-0.5 focus:outline-none focus:border-white/30 appearance-none cursor-pointer w-16"
              >
                {['Inter', 'Arial', 'Courier New', 'Georgia'].map(f => (
                  <option key={f} value={f} className="bg-gray-800 text-white">{f}</option>
                ))}
              </select>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Font Size */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <Type size={12} className="text-white/50 shrink-0" />
              <Slider
                value={[currentFontSize]}
                min={8}
                max={120}
                onValueChange={handleFontSizeChange}
                className="w-16 h-4"
              />
              <span className="text-[10px] text-white/60 w-7 text-right tabular-nums">{currentFontSize}</span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Opacity */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <Layers size={12} className="text-white/50 shrink-0" />
              <Slider
                value={[Math.round(currentOpacity * 100)]}
                min={10}
                max={100}
                onValueChange={handleOpacityChange}
                className="w-16 h-4"
              />
              <span className="text-[10px] text-white/60 w-7 text-right tabular-nums">{Math.round(currentOpacity * 100)}%</span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Rotation */}
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <RotateCw size={12} className="text-white/50 shrink-0" />
              <Slider
                value={[currentRotation]}
                min={-180}
                max={180}
                onValueChange={handleRotationChange}
                className="w-16 h-4"
              />
              <span className="text-[10px] text-white/60 w-7 text-right tabular-nums">{Number(currentRotation).toFixed(1)}°</span>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Duplicate */}
            <button
              onClick={handleDuplicate}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

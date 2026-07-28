import React from 'react';
import { Palette, Minus, Plus, Bold, Italic, Layers, Type } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tool } from '@/types/types';

interface OptionsBarProps {
  selectedTool: Tool;
  color: string;
  setColor: (c: string) => void;
  strokeWidth: number;
  setStrokeWidth: (w: number) => void;
  opacity: number;
  setOpacity: (o: number) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  isBold: boolean;
  setIsBold: (b: boolean) => void;
  isItalic: boolean;
  setIsItalic: (i: boolean) => void;
}

const handleSlider = (setter: (v: number) => void) => (v: number | readonly number[]) => {
  setter(Array.isArray(v) ? v[0] : v);
};

export default function OptionsBar({
  selectedTool, color, setColor, strokeWidth, setStrokeWidth, opacity, setOpacity,
  fontSize, setFontSize, fontFamily, setFontFamily, isBold, setIsBold, isItalic, setIsItalic
}: OptionsBarProps) {
  if (selectedTool === 'select' || selectedTool === 'crop') return null;

  return (
    <div className="flex wails-no-drag items-center gap-3 px-4 py-1.5 border-b border-white/10 bg-black/40 backdrop-blur-md text-white">
      <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
        <Palette size={13} className="text-white/50" />
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
        />
      </div>

      <div className="w-px h-4 bg-white/20" />

      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
        <Minus size={13} className="text-white/50" />
        <Slider
          value={[strokeWidth]}
          min={1}
          max={20}
          onValueChange={handleSlider(setStrokeWidth)}
          className="w-20 h-4"
        />
        <Plus size={13} className="text-white/50" />
        <span className="text-[10px] text-white/60 w-6 text-right">{strokeWidth}px</span>
      </div>

      <div className="w-px h-4 bg-white/20" />

      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
        <Layers size={13} className="text-white/50" />
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Opacity</span>
        <Slider
          value={[opacity * 100]}
          min={10}
          max={100}
          onValueChange={handleSlider(v => setOpacity(v / 100))}
          className="w-20 h-4"
        />
        <span className="text-[10px] text-white/60 w-8 text-right">{Math.round(opacity * 100)}%</span>
      </div>

      {selectedTool === 'text' && (
        <>
          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
            <Toggle
              pressed={isBold}
              onPressedChange={setIsBold}
              className="data-[state=on]:bg-white/20 text-white/60 hover:text-white rounded p-1.5"
              title="Bold"
            >
              <Bold size={13} />
            </Toggle>
            <Toggle
              pressed={isItalic}
              onPressedChange={setIsItalic}
              className="data-[state=on]:bg-white/20 text-white/60 hover:text-white rounded p-1.5"
              title="Italic"
            >
              <Italic size={13} />
            </Toggle>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
            <Type size={13} className="text-white/50" />
            <select
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              className="bg-transparent text-xs text-white/90 border border-white/10 rounded px-1.5 py-0.5 focus:outline-none focus:border-white/30 appearance-none cursor-pointer"
            >
              {['Inter', 'Arial', 'Courier New', 'Georgia'].map(f => (
                <option key={f} value={f} className="bg-gray-800 text-white">{f}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
            <Type size={13} className="text-white/50" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Size</span>
            <Slider
              value={[fontSize]}
              min={12}
              max={72}
              onValueChange={handleSlider(setFontSize)}
              className="w-20 h-4"
            />
            <span className="text-[10px] text-white/60 w-6 text-right">{fontSize}px</span>
          </div>
        </>
      )}
    </div>
  );
}
import React from "react";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { BackgroundSettings } from "@/lib/hooks/useBackground";
import {
  Paintbrush,
  ArrowRightLeft,
  Palette,
  RotateCw,
  Maximize,
} from "lucide-react";

interface Props {
  bg: BackgroundSettings;
  onToggle: () => void;
  onTypeChange: (t: "linear" | "radial") => void;
  onStartColor: (c: string) => void;
  onEndColor: (c: string) => void;
  onAngle: (a: number) => void;
  onPadding: (p: number) => void;
}

export default function BackgroundControls({
  bg,
  onToggle,
  onTypeChange,
  onStartColor,
  onEndColor,
  onAngle,
  onPadding,
}: Props) {
  return (
    <div className="flex items-center wails-no-drag gap-2 px-3 py-1.5 border-b border-white/10 bg-black/40 backdrop-blur-md text-white">
      <Toggle
        pressed={bg.enabled}
        onPressedChange={onToggle}
        className="data-[state=on]:bg-white/15 data-[state=on]:text-white text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-1.5"
        title="Toggle Background"
      >
        <Paintbrush size={15} />
      </Toggle>

      {bg.enabled && (
        <>
          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => onTypeChange("linear")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                bg.type === "linear"
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <ArrowRightLeft size={13} />
              <span className="hidden sm:inline">Linear</span>
            </button>
            <button
              onClick={() => onTypeChange("radial")}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all ${
                bg.type === "radial"
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Palette size={13} />
              <span className="hidden sm:inline">Radial</span>
            </button>
          </div>

          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                Start
              </span>
              <input
                type="color"
                value={bg.startColor}
                onChange={(e) => onStartColor(e.target.value)}
                className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 rounded-lg px-2 py-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">
                End
              </span>
              <input
                type="color"
                value={bg.endColor}
                onChange={(e) => onEndColor(e.target.value)}
                className="w-5 h-5 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
          </div>

          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
            <RotateCw size={13} className="text-white/50" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider w-8">
              Angle
            </span>
            <Slider
              value={[bg.angle]}
              min={0}
              max={360}
              step={1}
              onValueChange={(v) => onAngle(Array.isArray(v) ? v[0] : v)}
              className="w-20 h-4"
            />
            <span className="text-[10px] text-white/60 w-6 text-right tabular-nums">
              {Number(bg.angle).toFixed(1)}°
            </span>
          </div>

          <div className="w-px h-4 bg-white/20" />

          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
            <Maximize size={13} className="text-white/50" />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Pad
            </span>
            <Slider
              value={[bg.padding]}
              min={0}
              max={200}
              step={2}
              onValueChange={(v) => onPadding(Array.isArray(v) ? v[0] : v)}
              className="w-20 h-4"
            />
            <span className="text-[10px] text-white/60 w-8 text-right tabular-nums">
              {bg.padding}px
            </span>
          </div>
        </>
      )}
    </div>
  );
}

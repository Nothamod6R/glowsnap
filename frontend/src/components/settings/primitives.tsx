import React from "react";
import {
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-1 pt-1 pb-2">
      <div className="text-sm font-medium text-white/90">{title}</div>
      {description && (
        <div className="text-[11px] text-white/40 leading-4 mt-0.5">
          {description}
        </div>
      )}
    </div>
  );
}

interface RowProps {
  label: string;
  description?: string;
  children?: React.ReactNode;
}

export function SettingRow({ label, description, children }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className="min-w-0">
        <div className="text-xs text-white/90">{label}</div>
        {description && (
          <div className="text-[11px] text-white/40 leading-4 mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full border relative transition-colors disabled:opacity-40 ${
        checked ? "bg-red-500/80 border-red-400" : "bg-white/10 border-white/20"
      }`}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function Select({ value, onChange, options, disabled }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 pl-2 pr-8 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:border-white/30 appearance-none cursor-pointer disabled:opacity-40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50"
      />
    </div>
  );
}

interface NumberProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  disabled,
}: NumberProps) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 bg-white/10 hover:bg-white/15 text-xs text-white/90 rounded-lg px-2 py-1.5 border border-white/10 outline-none disabled:opacity-40 text-right"
      />
      {suffix && <span className="text-[11px] text-white/40">{suffix}</span>}
    </div>
  );
}

interface PathProps {
  value: string;
  onPick: () => void;
  title: string;
}

export function PathPicker({ value, onPick, title }: PathProps) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="text-[11px] text-white/50 font-mono truncate max-w-[180px]"
        title={value}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onPick}
        title={title}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white/80 transition-colors"
      >
        <FolderOpen size={12} />
        <span>Change</span>
      </button>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 60,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        className="p-1 rounded hover:bg-white/10 text-white/70"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="w-8 text-center text-xs text-white/80">{value}</span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        className="p-1 rounded hover:bg-white/10 text-white/70"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

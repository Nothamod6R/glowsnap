import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crop, ArrowUpRight, Type, Hash, Pen, Square, Circle as CircleIcon, MousePointer2 } from 'lucide-react';
import { Tool } from '@/types/types';
import { TOOL_SHORTCUTS, matchesShortcut, isEditableTarget } from '@/lib/shortcut';

interface ToolbarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  isEditingText?: boolean;
}

const tools: { tool: Tool; icon: React.ElementType; label: string }[] = [
  { tool: 'select', icon: MousePointer2, label: 'Select' },
  { tool: 'crop', icon: Crop, label: 'Crop' },
  { tool: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { tool: 'text', icon: Type, label: 'Text' },
  { tool: 'number', icon: Hash, label: 'Number' },
  { tool: 'pen', icon: Pen, label: 'Pen' },
  { tool: 'rectangle', icon: Square, label: 'Rect' },
  { tool: 'circle', icon: CircleIcon, label: 'Circle' },
];

const shortcutFor = (tool: Tool): string | undefined =>
  TOOL_SHORTCUTS.find(s => s.tool === tool)?.keys;

export default function Toolbar({ selectedTool, onToolChange, isEditingText }: ToolbarProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingText) return;
      if (isEditableTarget(e.target)) return;
      for (const shortcut of TOOL_SHORTCUTS) {
        if (matchesShortcut(shortcut, e)) {
          e.preventDefault();
          onToolChange(shortcut.tool);
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToolChange, isEditingText]);

  return (
    <div className="flex gap-0.5 bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/10">
      {tools.map(({ tool, icon: Icon, label }) => (
        <motion.button
          key={tool}
          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToolChange(tool)}
          className={`relative p-2 rounded-lg text-xs transition-colors ${
            selectedTool === tool
              ? 'text-white bg-white/20 shadow-sm'
              : 'text-white/60 hover:text-white/90'
          }`}
          title={`${label} (${shortcutFor(tool) ?? ''})`}
        >
          <Icon size={16} />
          {selectedTool === tool && (
            <motion.div
              layoutId="toolbar-indicator"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

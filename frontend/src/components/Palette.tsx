import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Crop, Type, EyeOff, Video, X } from 'lucide-react';
import { Button } from './ui/button';
import ToolButton from './ToolButton';
import { PALETTE_SHORTCUTS, matchesShortcut, isEditableTarget } from '@/lib/shortcut';

export default function Palette({ onTakeScreenshot, onTakeAreaScreenshot, onSwitchToStudio, onClose, onStartRecording }: any) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      for (const shortcut of PALETTE_SHORTCUTS) {
        if (matchesShortcut(shortcut, e)) {
          e.preventDefault();
          switch (shortcut.action) {
            case 'full-screen':
              onTakeScreenshot();
              break;
            case 'select-area':
              onTakeAreaScreenshot();
              break;
            case 'record':
              onStartRecording();
              break;
            case 'studio':
              onSwitchToStudio();
              break;
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTakeScreenshot, onTakeAreaScreenshot, onSwitchToStudio]);

  const shortcutFor = (action: string) => PALETTE_SHORTCUTS.find(s => s.action === action)?.keys;

  return (
    <motion.div
      key="palette"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 p-2 rounded-2xl backdrop-blur-2xl bg-black shadow-2xl text-white"
    >
      <ToolButton icon={<Camera size={18} />} label="Full Screen" shortcut={shortcutFor('full-screen')} onClick={onTakeScreenshot} />
      <ToolButton icon={<Crop size={18} />} label="Select Area" shortcut={shortcutFor('select-area')} onClick={onTakeAreaScreenshot} />
      <ToolButton icon={<Video size={18} />} label="Record" shortcut={shortcutFor('record')} onClick={onStartRecording} />
      {/* Commented-out buttons intentionally get no shortcut.
      <ToolButton icon={<Type size={18} />} label="OCR Text" />
      <ToolButton icon={<EyeOff size={18} />} label="Smart Blur" /> */}

      <div className="h-6 w-[1px] bg-white/20 mx-1" />

      <Button onClick={onSwitchToStudio}>
        <span>Studio</span>
      </Button>

      {/*<Button variant="outline" onClick={onClose}>
        <X size={14} />
      </Button>*/}
    </motion.div>
  );
}
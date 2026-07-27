import { motion } from 'framer-motion';
import { Camera, Crop, Type, EyeOff, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import ToolButton from './ToolButton';
import { PaletteProps } from '@/types/types';



export default function Palette({ onTakeScreenshot, onTakeAreaScreenshot, onSwitchToStudio, onClose }: PaletteProps) {
  return (
    <motion.div
      key="palette"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 p-2 rounded-2xl backdrop-blur-2xl bg-black shadow-2xl text-white"
    >
      <ToolButton icon={<Camera size={18} />} label="Full Screen" onClick={onTakeScreenshot} />
      <ToolButton icon={<Crop size={18} />} label="Select Area" onClick={onTakeAreaScreenshot} />
      <ToolButton icon={<Type size={18} />} label="OCR Text" />
      <ToolButton icon={<EyeOff size={18} />} label="Smart Blur" />

      <div className="h-6 w-[1px] bg-white/20 mx-1" />

      <Button onClick={onSwitchToStudio}>
        <span>Studio</span>
      </Button>

      <Button variant="outline" onClick={onClose}>
        <X size={14} />
      </Button>
    </motion.div>
  );
}
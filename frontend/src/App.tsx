import React, { useEffect, useState } from 'react';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ResizeToPalette, ResizeToStudio, TakeScreenshot } from '../wailsjs/go/main/App'; 
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Crop, Type, EyeOff, Sparkles, X, ArrowLeft, Image as ImageIcon, Sliders, Download
} from 'lucide-react';
import { Button } from './components/ui/button';

type WindowMode = 'palette' | 'studio' | 'closed';

export default function App() {
  const [mode, setMode] = useState<WindowMode>('palette');

  const switchToPalette = () => {
    setMode('palette');
    ResizeToPalette();
  };

  const switchToStudio = () => {
    setMode('studio');
    ResizeToStudio();
  };

  const handleTakeScreenshot = async () => {
    try {
      await TakeScreenshot();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = EventsOn('toggle-palette', () => {
      switchToPalette();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        switchToPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="w-full wails-drag h-full flex items-center justify-center bg-transparent select-none overflow-hidden">
      <AnimatePresence mode="wait">

        {mode === 'palette' && (
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2  p-2 rounded-2xl backdrop-blur-2xl  bg-black shadow-2xl text-white"
          >
            <ToolButton icon={<Camera size={18} />} label="Full Screen" onClick={handleTakeScreenshot} />
            <ToolButton icon={<Crop size={18} />} label="Select Area" />
            <ToolButton icon={<Type size={18} />} label="OCR Text" />
            <ToolButton icon={<EyeOff size={18} />} label="Smart Blur" />

            <div className="h-6 w-[1px] bg-white/20 mx-1" />

            <Button onClick={switchToStudio}>
              <span>Studio</span>
            </Button>

            <Button variant="outline" onClick={() => setMode('closed')}>
              <X size={14} />
            </Button>
          </motion.div>
        )}

        {mode === 'studio' && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full flex flex-col rounded-3xl backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden text-white"
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={switchToPalette}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/15 text-xs border border-white/10 text-white/80 hover:text-white"
                >
                  <ArrowLeft size={14} />
                  <span>Palette</span>
                </motion.button>
                <h1 className="text-sm font-semibold text-white/90">GlowSnap Studio</h1>
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium">
                  <Sliders size={14} />
                  <span>Adjust</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg shadow-blue-600/30">
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-8">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl w-full h-full p-6 text-center text-white/40">
                <ImageIcon size={48} className="mb-3 stroke-1" />
                <p className="text-sm">Select an option from the palette or drop an image here</p>
              </div>
            </main>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative group flex items-center wails-no-drag justify-center p-2.5 rounded-xl transition-colors duration-150"
    >
      {icon}
      <span className="absolute -top-9 scale-0 group-hover:scale-100 transition-all duration-150 bg-black/80 text-[11px] px-2 py-0.5 rounded-md border border-white/10 text-white/90 whitespace-nowrap backdrop-blur-md shadow-lg pointer-events-none">
        {label}
      </span>
    </motion.button>
  );
}
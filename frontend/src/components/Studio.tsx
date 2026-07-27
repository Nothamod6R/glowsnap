import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon, Sliders, Download } from 'lucide-react';
import { StudioProps } from '@/types/types';

export default function Studio({ onBackToPalette }: StudioProps) {
  return (
    <motion.div
      key="studio"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full h-full flex flex-col rounded-3xl backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden text-white bg-black"
    >
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBackToPalette}
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
  );
}
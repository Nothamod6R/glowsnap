import React, { useEffect, useState } from 'react';
import { EventsOn } from '../wailsjs/runtime/runtime';
import { ResizeToPalette, ResizeToStudio, TakeScreenshot, TakeAreaScreenshot } from '../wailsjs/go/main/App';
import { AnimatePresence } from 'framer-motion';
import Palette from './components/Palette';
import Studio from './components/Studio';
import useKeyboardShortcut from './hooks/useKeyboardShortcut';
import { WindowMode } from './types/types';


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

  const handleTakeAreaScreenshot = async () => {
    try {
      await TakeAreaScreenshot();
    } catch (err) {
      console.error('Area screenshot failed:', err);
    }
  };

  useKeyboardShortcut({ alt: true, ctrl: true, key: 's' }, switchToPalette);

  useEffect(() => {
    const unsubscribe = EventsOn('toggle-palette', () => {
      switchToPalette();
    });
    return unsubscribe;
  }, []);

  return (
    <div className="w-full wails-drag h-full flex items-center justify-center bg-transparent select-none overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'palette' && (
          <Palette
            onTakeScreenshot={handleTakeScreenshot}
            onTakeAreaScreenshot={handleTakeAreaScreenshot}
            onSwitchToStudio={switchToStudio}
            onClose={() => setMode('closed')}
          />
        )}

        {mode === 'studio' && (
          <Studio onBackToPalette={switchToPalette} />
        )}
      </AnimatePresence>
    </div>
  );
}
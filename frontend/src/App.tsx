import React, { useState, useEffect } from 'react';
import { EventsOn } from '../wailsjs/runtime/runtime';
import {
  ResizeToPalette,
  ResizeToStudio,
  TakeScreenshot,
  TakeAreaScreenshot,
  StartRecording,
  PauseRecording,
  ResumeRecording,
  StopRecording,
  GetHomeDir,
} from '../wailsjs/go/main/App';
import { AnimatePresence } from 'framer-motion';
import Palette from './components/Palette';
import Studio from './components/Studio';
import RecordingBar from './components/RecordingBar';
import useKeyboardShortcut from './lib/hooks/useKeyboardShortcut';
import { WindowMode } from './types/types';

export default function App() {
  const [mode, setMode] = useState<WindowMode>('palette');
  const [isPaused, setIsPaused] = useState(false);

  const switchToPalette = () => {
    setMode('palette');
    ResizeToPalette();
  };

  const switchToStudio = () => {
    setMode('studio');
    ResizeToStudio();
  };

  const handleTakeScreenshot = async () => {
    try { await TakeScreenshot(); } catch (err) { console.error(err); }
  };
  const handleTakeAreaScreenshot = async () => {
    try { await TakeAreaScreenshot(); } catch (err) { console.error(err); }
  };

  const handleStartRecording = async () => {
    try {
      const home = await GetHomeDir();
      const outPath = `${home}/Videos/recording.webm`;
      await StartRecording(outPath, true, true);
      setMode('recording');
      setIsPaused(false);
    } catch (err) {
      console.error('StartRecording failed:', err);
    }
  };

  const handlePause = async () => {
    await PauseRecording();
    setIsPaused(true);
  };
  const handleResume = async () => {
    await ResumeRecording();
    setIsPaused(false);
  };
  const handleStop = async () => {
    try {
      const path = await StopRecording();
      console.log('Recording saved:', path);
      setIsPaused(false);
      setMode('palette');
    } catch (err) {
      console.error('StopRecording failed:', err);
    }
  };

  useKeyboardShortcut({ alt: true, ctrl: true, key: 's' }, switchToPalette);

  useEffect(() => {
    const unsub = EventsOn('toggle-palette', switchToPalette);
    return unsub;
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
            onStartRecording={handleStartRecording}
          />
        )}

        {mode === 'studio' && (
          <Studio onBackToPalette={switchToPalette} />
        )}

        {mode === 'recording' && (
          <RecordingBar
            isPaused={isPaused}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
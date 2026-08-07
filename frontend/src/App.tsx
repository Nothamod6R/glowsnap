import React, { useState, useEffect } from 'react';
import { EventsOn } from '../wailsjs/runtime/runtime';
import {
  ResizeToPalette,
  ResizeToStudio,
  ResizeToSettings,
  ResizeToPreferences,
  TakeScreenshot,
  TakeAreaScreenshot,
  StartRecording,
  PauseRecording,
  ResumeRecording,
  StopRecording,
  CancelRecording,
  SaveMicrophone,
  SetMicEnabled,
  SetSystemEnabled,
} from '../wailsjs/go/main/App';
import { AnimatePresence } from 'framer-motion';
import Palette from './components/Palette';
import Studio from './components/Studio';
import RecordingBar from './components/RecordingBar';
import RecordingSettings from './components/RecordingSettings';
import SettingsPanel from './components/SettingsPanel';
import { APP_SHORTCUTS, matchesShortcut, isEditableTarget } from './lib/shortcut';
import { WindowMode } from './types/types';

export default function App() {
  const [mode, setMode] = useState<WindowMode>('palette');
  const [isPaused, setIsPaused] = useState(false);
  const [recStarted, setRecStarted] = useState(false);
  const [recMicEnabled, setRecMicEnabled] = useState(true);
  const [recSystemEnabled, setRecSystemEnabled] = useState(true);

  const switchToPalette = () => {
    setMode('palette');
    ResizeToPalette();
  };

  const switchToStudio = () => {
    setMode('studio');
    ResizeToStudio();
  };

  const switchToPreferences = () => {
    setMode('preferences');
    ResizeToPreferences();
  };

  const handleTakeScreenshot = async () => {
    try { await TakeScreenshot(); } catch (err) { console.error(err); }
  };
  const handleTakeAreaScreenshot = async () => {
    try { await TakeAreaScreenshot(); } catch (err) { console.error(err); }
  };

  const openRecordingSettings = () => {
    setMode('settings');
    ResizeToSettings();
  };

  const handleStartFromSettings = async (micOn: boolean, systemOn: boolean, micDevice: string) => {
    if (micOn && micDevice) {
      await SaveMicrophone(micDevice);
    }
    await StartRecording(micOn, systemOn, micDevice);
    setRecStarted(false);
    setIsPaused(false);
    setRecMicEnabled(micOn);
    setRecSystemEnabled(systemOn);
    setMode('recording');
    ResizeToPalette();
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
    } catch (err) {
      console.error('StopRecording failed:', err);
    } finally {
      setRecStarted(false);
      setIsPaused(false);
      switchToPalette();
    }
  };
  const handleCancel = async () => {
    try {
      await CancelRecording();
    } catch (err) {
      console.error('CancelRecording failed:', err);
    } finally {
      setRecStarted(false);
      setIsPaused(false);
      switchToPalette();
    }
  };

  const handleToggleMic = (enabled: boolean) => {
    SetMicEnabled(enabled).catch(err => console.error('SetMicEnabled failed:', err));
  };
  const handleToggleSystem = (enabled: boolean) => {
    SetSystemEnabled(enabled).catch(err => console.error('SetSystemEnabled failed:', err));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      for (const shortcut of APP_SHORTCUTS) {
        if (matchesShortcut(shortcut, e)) {
          e.preventDefault();
          switch (shortcut.action) {
            case 'toggle-palette':
              switchToPalette();
              break;
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchToPalette]);

  useEffect(() => {
    const unsub = EventsOn('toggle-palette', switchToPalette);
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = EventsOn('recording-started', () => {
      setRecStarted(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = EventsOn('recording-ended', () => {
      setRecStarted(false);
      setIsPaused(false);
      switchToPalette();
    });
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
            onStartRecording={openRecordingSettings}
            onOpenSettings={switchToPreferences}
          />
        )}

        {mode === 'studio' && (
          <Studio onBackToPalette={switchToPalette} />
        )}

        {mode === 'settings' && (
          <RecordingSettings
            onBack={switchToPalette}
            onStart={handleStartFromSettings}
          />
        )}

        {mode === 'preferences' && (
          <SettingsPanel onBack={switchToPalette} />
        )}

        {mode === 'recording' && (
          <RecordingBar
            isPaused={isPaused}
            started={recStarted}
            micEnabled={recMicEnabled}
            systemEnabled={recSystemEnabled}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onCancel={handleCancel}
            onToggleMic={handleToggleMic}
            onToggleSystem={handleToggleSystem}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
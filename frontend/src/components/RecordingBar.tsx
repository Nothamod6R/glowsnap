import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Square, X, Mic, Volume2 } from 'lucide-react';
import { RecordingBarProps } from '@/types/types';

export default function RecordingBar({ onStop, onPause, onResume, onCancel, isPaused, onToggleMic, onToggleSystem }: RecordingBarProps) {
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [systemOn, setSystemOn] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      if (!isPaused) {
        setSeconds(s => s + 1);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    const next = !micOn;
    onToggleMic(next);
    setMicOn(next);
  };

  const toggleSystem = () => {
    const next = !systemOn;
    onToggleSystem(next);
    setSystemOn(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex items-center gap-3 p-2 rounded-2xl backdrop-blur-2xl bg-black shadow-2xl text-white"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-mono text-red-400">{formatTime(seconds)}</span>
      </div>

      <button
        onClick={isPaused ? onResume : onPause}
        className="p-2 rounded-xl hover:bg-white/10 transition-colors"
        title={isPaused ? 'Resume' : 'Pause'}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </button>

      <button
        onClick={onStop}
        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-red-400"
        title="Stop"
      >
        <Square size={16} />
      </button>

      <button
        onClick={onCancel}
        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60"
        title="Cancel recording"
      >
        <X size={16} />
      </button>

      <div className="h-6 w-px bg-white/20" />

      <button
        onClick={toggleMic}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${micOn ? 'text-white text-red-400' : 'text-white/35 line-through'}`}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        <Mic size={14} />
        <span>Mic</span>
      </button>
      <button
        onClick={toggleSystem}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors ${systemOn ? 'text-white text-red-400' : 'text-white/35 line-through'}`}
        title={systemOn ? 'Mute system audio' : 'Unmute system audio'}
      >
        <Volume2 size={14} />
        <span>System</span>
      </button>
    </motion.div>
  );
}
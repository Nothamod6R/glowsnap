import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Folder, FolderOpen, RotateCcw, Check, Camera, Video, Info } from 'lucide-react';
import {
  GetSettings,
  UpdateSettings,
  ResetSettings,
  SelectDirectory,
  GetAppVersion,
} from '../../wailsjs/go/main/App';
import { settings } from '../../wailsjs/go/models';
import type { AppSettings, SettingsPanelProps } from '@/types/types';

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide text-white/40">
      {icon}
      <span>{children}</span>
    </div>
  );
}

interface SaveLocationRowProps {
  label: string;
  description: string;
  value: string;
  onPick: () => void;
  pickerTitle: string;
}

function SaveLocationRow({ label, description, value, onPick, pickerTitle }: SaveLocationRowProps) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white/90">{label}</div>
        <div className="text-[11px] text-white/40 leading-4">{description}</div>
        <div className="mt-1 text-[11px] text-white/60 truncate break-all font-mono" title={value}>
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onPick}
        title={pickerTitle}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white/80 transition-colors"
      >
        <FolderOpen size={13} />
        <span>Change</span>
      </button>
    </div>
  );
}

function AboutRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 px-2 py-1.5">
      <span className="text-xs text-white/40">{label}</span>
      <span className="flex-1 text-xs text-white/80 text-right break-all">{value}</span>
    </div>
  );
}

export default function SettingsPanel({ onBack }: SettingsPanelProps) {
  const [config, setConfig] = useState<AppSettings | null>(null);
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<null | 'screenshot' | 'recording'>(null);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loaded, ver] = await Promise.all([GetSettings(), GetAppVersion()]);
        if (!active) return;
        setConfig(loaded);
        setVersion(ver);
      } catch {
        if (active) setError('Failed to load settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = async (next: AppSettings) => {
    try {
      const saved = await UpdateSettings(next);
      setConfig(saved);
      setError('');
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      setError('Failed to save settings. Please try again.');
    }
  };

  const pickDirectory = async (which: 'screenshot' | 'recording') => {
    if (!config) return;
    setPicking(which);
    try {
      const title =
        which === 'screenshot' ? 'Choose Screenshot Save Location' : 'Choose Recording Save Location';
      const path = await SelectDirectory(title);
      if (!path) return;
      const next = settings.Settings.createFrom({
        screenshot: { saveDir: which === 'screenshot' ? path : config.screenshot.saveDir },
        recording: {
          saveDir: which === 'recording' ? path : config.recording.saveDir,
          microphone: config.recording.microphone,
        },
      });
      await persist(next);
    } catch {
      setError('Failed to open the directory picker.');
    } finally {
      setPicking(null);
    }
  };

  const handleReset = async () => {
    try {
      const defaults = await ResetSettings();
      setConfig(defaults);
      setError('');
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      setError('Failed to reset settings.');
    }
  };

  return (
    <motion.div
      key="settings-panel"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-[520px] max-h-[640px] flex flex-col rounded-2xl backdrop-blur-2xl bg-black shadow-2xl text-white overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-medium">Settings</span>
        <div className="flex items-center gap-2">
          {savedFlash && (
            <span className="flex items-center gap-1 text-[11px] text-green-400">
              <Check size={12} /> Saved
            </span>
          )}
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 transition-colors"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-white/50">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : (
          <>
            <SectionLabel icon={<Camera size={12} />}>Screenshots</SectionLabel>
            <SaveLocationRow
              label="Save Location"
              description="Where new screenshots are stored."
              value={config?.screenshot.saveDir ?? ''}
              onPick={() => pickDirectory('screenshot')}
              pickerTitle="Choose screenshot save location"
            />

            <SectionLabel icon={<Video size={12} />}>Recording</SectionLabel>
            <SaveLocationRow
              label="Save Location"
              description="Where screen recordings are stored."
              value={config?.recording.saveDir ?? ''}
              onPick={() => pickDirectory('recording')}
              pickerTitle="Choose recording save location"
            />

            <SectionLabel icon={<Info size={12} />}>About</SectionLabel>
            <div className="flex flex-col gap-0.5 pb-2">
              <AboutRow label="Application" value="GlowSnap" />
              <AboutRow label="Version" value={version || 'dev'} />
              <AboutRow label="Screenshots" value={config?.screenshot.saveDir ?? ''} />
              <AboutRow label="Recordings" value={config?.recording.saveDir ?? ''} />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-[11px] text-red-300 break-words">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
        <button
          onClick={handleReset}
          disabled={loading || picking !== null}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/70 hover:bg-white/10 disabled:opacity-40 transition-colors"
        >
          {picking ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
          <span>Reset to Defaults</span>
        </button>
        <span className="flex-1" />
        <span className="flex items-center gap-1 text-[11px] text-white/40">
          <Folder size={12} />
          {picking ? 'Choosing…' : 'Changes are saved automatically'}
        </span>
      </div>
    </motion.div>
  );
}


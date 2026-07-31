import { useState } from 'react';

export interface BackgroundSettings {
  enabled: boolean;
  type: 'linear' | 'radial';
  startColor: string;
  endColor: string;
  angle: number; 
  padding: number; 
}

export function useBackground() {
  const [background, setBackground] = useState<BackgroundSettings>({
    enabled: false,
    type: 'linear',
    startColor: '#1e1e2e',
    endColor: '#45475a',
    angle: 0,
    padding: 40,
  });

  const toggleBackground = () => setBackground(prev => ({ ...prev, enabled: !prev.enabled }));
  const setType = (type: 'linear' | 'radial') => setBackground(prev => ({ ...prev, type }));
  const setStartColor = (c: string) => setBackground(prev => ({ ...prev, startColor: c }));
  const setEndColor = (c: string) => setBackground(prev => ({ ...prev, endColor: c }));
  const setAngle = (a: number) => setBackground(prev => ({ ...prev, angle: a }));
  const setPadding = (p: number) => setBackground(prev => ({ ...prev, padding: p }));

  return { background, toggleBackground, setType, setStartColor, setEndColor, setAngle, setPadding };
}
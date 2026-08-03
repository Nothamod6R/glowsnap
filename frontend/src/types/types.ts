import Konva from 'konva';
import type { main } from '../../wailsjs/go/models';

export type Screenshot = main.ScreenshotInfo;


export interface PaletteProps {
  onTakeScreenshot: () => void;
  onTakeAreaScreenshot: () => void;
  onSwitchToStudio: () => void;
  onClose: () => void;
}


export interface StudioProps {
  onBackToPalette: () => void;
}

export interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export type WindowMode = 'palette' | 'studio' | 'closed' | 'recording';
export interface PaletteProps {
  onTakeScreenshot: () => void;
  onTakeAreaScreenshot: () => void;
  onSwitchToStudio: () => void;
  onClose: () => void;
  onStartRecording: () => void;
}

export interface StudioProps {
  onBackToPalette: () => void;
}

export interface RecordingBarProps {
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
}



export type Tool = 'select' | 'crop' | 'arrow' | 'text' | 'number' | 'pen' | 'rectangle' | 'circle';

export interface ShapeConfig {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'text' | 'number' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  text?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  fontSize?: number;
  fontFamily?: string;
  fontStyle?: string;
  direction?: 'ltr' | 'rtl';
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  textDecoration?: string;
  rotation?: number;
  fillEnabled?: boolean;
}

export interface EditorProps {
  imageUrl: string;
  onBack: () => void;
}
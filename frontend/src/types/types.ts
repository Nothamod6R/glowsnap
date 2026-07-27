
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
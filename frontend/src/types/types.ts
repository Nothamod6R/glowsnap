export type WindowMode = 'palette' | 'studio' | 'closed';

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

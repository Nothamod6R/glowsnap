import { Tool } from '@/types/types';

export type ShortcutCategory = 'editor' | 'tool' | 'palette' | 'app';

export interface ShortcutDef {
  id: string;
  label: string;
  keys: string;
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  category: ShortcutCategory;
}

export type EditorAction =
  | 'edit-text'
  | 'delete'
  | 'undo'
  | 'redo'
  | 'export'
  | 'copy'
  | 'paste'
  | 'duplicate'
  | 'deselect';

export interface EditorShortcut extends ShortcutDef {
  category: 'editor';
  action: EditorAction;
}

export const EDITOR_SHORTCUTS: EditorShortcut[] = [
  {
    id: 'editor-edit-text',
    action: 'edit-text',
    label: 'Edit selected text',
    keys: 'Enter',
    key: 'Enter',
    category: 'editor',
  },
  {
    id: 'editor-delete',
    action: 'delete',
    label: 'Delete selected shape',
    keys: 'Delete',
    key: 'Delete',
    category: 'editor',
  },
  {
    id: 'editor-delete-backspace',
    action: 'delete',
    label: 'Delete selected shape',
    keys: 'Backspace',
    key: 'Backspace',
    category: 'editor',
  },
  {
    id: 'editor-undo',
    action: 'undo',
    label: 'Undo',
    keys: 'Ctrl+Z',
    key: 'z',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-redo',
    action: 'redo',
    label: 'Redo',
    keys: 'Ctrl+Shift+Z',
    key: 'z',
    ctrl: true,
    shift: true,
    category: 'editor',
  },
  {
    id: 'editor-redo-alternate',
    action: 'redo',
    label: 'Redo (alternate)',
    keys: 'Ctrl+Y',
    key: 'y',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-export',
    action: 'export',
    label: 'Export image',
    keys: 'Ctrl+S',
    key: 's',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-copy',
    action: 'copy',
    label: 'Copy shape',
    keys: 'Ctrl+C',
    key: 'c',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-paste',
    action: 'paste',
    label: 'Paste shape',
    keys: 'Ctrl+V',
    key: 'v',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-duplicate',
    action: 'duplicate',
    label: 'Duplicate shape',
    keys: 'Ctrl+D',
    key: 'd',
    ctrl: true,
    category: 'editor',
  },
  {
    id: 'editor-deselect',
    action: 'deselect',
    label: 'Deselect all',
    keys: 'Escape',
    key: 'Escape',
    category: 'editor',
  },
];


export interface ToolShortcut extends ShortcutDef {
  category: 'tool';
  tool: Tool;
}

export const TOOL_SHORTCUT_KEYS: Record<string, Tool> = {
  v: 'select',
  c: 'crop',
  a: 'arrow',
  t: 'text',
  n: 'number',
  p: 'pen',
  r: 'rectangle',
  o: 'circle',
};

const TOOL_LABELS: Record<Tool, string> = {
  select: 'Select',
  crop: 'Crop',
  arrow: 'Arrow',
  text: 'Text',
  number: 'Number',
  pen: 'Pen',
  rectangle: 'Rectangle',
  circle: 'Circle',
};

export const TOOL_SHORTCUTS: ToolShortcut[] = (Object.keys(TOOL_SHORTCUT_KEYS) as string[]).map(
  (key) => {
    const tool = TOOL_SHORTCUT_KEYS[key];
    return {
      id: `tool-${tool}`,
      tool,
      label: `Select ${TOOL_LABELS[tool]} tool`,
      keys: key.toUpperCase(),
      key,
      category: 'tool' as const,
    };
  }
);

export type PaletteAction = 'full-screen' | 'select-area' | 'studio';

export interface PaletteShortcut extends ShortcutDef {
  category: 'palette';
  action: PaletteAction;
}

export const PALETTE_SHORTCUTS: PaletteShortcut[] = [
  {
    id: 'palette-full-screen',
    action: 'full-screen',
    label: 'Take full screen screenshot',
    keys: 'Alt+1',
    key: '1',
    alt: true,
    category: 'palette',
  },
  {
    id: 'palette-select-area',
    action: 'select-area',
    label: 'Take area screenshot',
    keys: 'Alt+2',
    key: '2',
    alt: true,
    category: 'palette',
  },
  {
    id: 'palette-studio',
    action: 'studio',
    label: 'Open Studio',
    keys: 'Alt+3',
    key: '3',
    alt: true,
    category: 'palette',
  },
];

export type AppAction = 'toggle-palette';

export interface AppShortcut extends ShortcutDef {
  category: 'app';
  action: AppAction;
}

export const APP_SHORTCUTS: AppShortcut[] = [
  {
    id: 'app-toggle-palette',
    action: 'toggle-palette',
    label: 'Return to palette',
    keys: 'Ctrl+Alt+S',
    key: 's',
    alt: true,
    ctrl: true,
    category: 'app',
  },
];


export const ALL_SHORTCUTS: ShortcutDef[] = [
  ...EDITOR_SHORTCUTS,
  ...TOOL_SHORTCUTS,
  ...PALETTE_SHORTCUTS,
  ...APP_SHORTCUTS,
];

export function findShortcut(id: string): ShortcutDef | undefined {
  return ALL_SHORTCUTS.find((s) => s.id === id);
}

export function getToolForShortcut(key: string): Tool | undefined {
  return TOOL_SHORTCUT_KEYS[key.toLowerCase()];
}

export function matchesShortcut(shortcut: ShortcutDef, e: KeyboardEvent): boolean {
  return (
    e.altKey === !!shortcut.alt &&
    e.ctrlKey === !!shortcut.ctrl &&
    e.shiftKey === !!shortcut.shift &&
    e.metaKey === !!shortcut.meta &&
    e.key.toLowerCase() === shortcut.key.toLowerCase()
  );
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}


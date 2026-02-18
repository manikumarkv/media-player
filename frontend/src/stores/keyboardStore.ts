import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Available shortcut actions for the media player
 */
export type ShortcutAction =
  | 'togglePlay'
  | 'nextTrack'
  | 'previousTrack'
  | 'seekForward'
  | 'seekBackward'
  | 'volumeUp'
  | 'volumeDown'
  | 'toggleMute';

/**
 * Category for grouping shortcuts in the settings UI
 */
export interface ShortcutCategory {
  name: string;
  actions: ShortcutAction[];
}

/**
 * Default keyboard shortcuts using react-hotkeys-hook format
 */
export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  togglePlay: 'space',
  nextTrack: 'shift+right',
  previousTrack: 'shift+left',
  seekForward: 'right',
  seekBackward: 'left',
  volumeUp: 'up',
  volumeDown: 'down',
  toggleMute: 'm',
};

/**
 * Human-readable labels for each shortcut action
 */
const ACTION_LABELS: Record<ShortcutAction, string> = {
  togglePlay: 'Play/Pause',
  nextTrack: 'Next Track',
  previousTrack: 'Previous Track',
  seekForward: 'Seek Forward 10s',
  seekBackward: 'Seek Backward 10s',
  volumeUp: 'Volume Up',
  volumeDown: 'Volume Down',
  toggleMute: 'Toggle Mute',
};

/**
 * Categories for grouping shortcuts in the UI
 */
const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    name: 'Playback',
    actions: ['togglePlay', 'nextTrack', 'previousTrack'],
  },
  {
    name: 'Seeking',
    actions: ['seekForward', 'seekBackward'],
  },
  {
    name: 'Volume',
    actions: ['volumeUp', 'volumeDown', 'toggleMute'],
  },
];

/**
 * Key display mappings for formatting shortcuts
 */
const KEY_DISPLAY_MAP: Record<string, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  space: 'Space',
  shift: 'Shift',
  ctrl: 'Ctrl',
  alt: 'Alt',
  meta: 'Cmd',
};

interface KeyboardState {
  shortcuts: Record<ShortcutAction, string>;
  setShortcut: (action: ShortcutAction, shortcut: string) => void;
  resetToDefaults: () => void;
  hasConflict: (action: ShortcutAction, shortcut: string) => ShortcutAction | null;
  getActionLabel: (action: ShortcutAction) => string;
  formatShortcut: (shortcut: string) => string;
  getShortcutsByCategory: () => ShortcutCategory[];
}

export const useKeyboardStore = create<KeyboardState>()(
  persist(
    (set, get) => ({
      shortcuts: { ...DEFAULT_SHORTCUTS },

      setShortcut: (action, shortcut) => {
        set((state) => ({
          shortcuts: {
            ...state.shortcuts,
            [action]: shortcut,
          },
        }));
      },

      resetToDefaults: () => {
        set({ shortcuts: { ...DEFAULT_SHORTCUTS } });
      },

      hasConflict: (action, shortcut) => {
        const { shortcuts } = get();
        const normalizedShortcut = shortcut.toLowerCase();

        for (const [existingAction, existingShortcut] of Object.entries(shortcuts)) {
          if (existingAction === action) {
            continue;
          }
          if (existingShortcut.toLowerCase() === normalizedShortcut) {
            return existingAction as ShortcutAction;
          }
        }

        return null;
      },

      getActionLabel: (action) => {
        return ACTION_LABELS[action];
      },

      formatShortcut: (shortcut) => {
        const parts = shortcut.toLowerCase().split('+');
        const formattedParts = parts.map((part) => {
          const trimmed = part.trim();
          // Check for key display mapping
          if (KEY_DISPLAY_MAP[trimmed]) {
            return KEY_DISPLAY_MAP[trimmed];
          }
          // Single letter keys - capitalize
          if (trimmed.length === 1) {
            return trimmed.toUpperCase();
          }
          // Capitalize first letter for other keys
          return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        });

        return formattedParts.join(' + ');
      },

      getShortcutsByCategory: () => {
        return SHORTCUT_CATEGORIES;
      },
    }),
    {
      name: 'keyboard-shortcuts',
      partialize: (state) => ({ shortcuts: state.shortcuts }),
    }
  )
);

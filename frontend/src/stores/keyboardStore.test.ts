import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKeyboardStore, DEFAULT_SHORTCUTS, type ShortcutAction } from './keyboardStore';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('keyboardStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    // Reset the store to default state
    useKeyboardStore.setState({ shortcuts: { ...DEFAULT_SHORTCUTS } });
  });

  describe('initial state', () => {
    it('should have default shortcuts loaded', () => {
      const state = useKeyboardStore.getState();

      expect(state.shortcuts).toEqual(DEFAULT_SHORTCUTS);
    });

    it('should have all required shortcut actions', () => {
      const state = useKeyboardStore.getState();
      const requiredActions: ShortcutAction[] = [
        'togglePlay',
        'nextTrack',
        'previousTrack',
        'seekForward',
        'seekBackward',
        'volumeUp',
        'volumeDown',
        'toggleMute',
      ];

      for (const action of requiredActions) {
        expect(state.shortcuts[action]).toBeDefined();
      }
    });

    it('should have correct default key bindings', () => {
      const state = useKeyboardStore.getState();

      expect(state.shortcuts.togglePlay).toBe('space');
      expect(state.shortcuts.nextTrack).toBe('shift+right');
      expect(state.shortcuts.previousTrack).toBe('shift+left');
      expect(state.shortcuts.seekForward).toBe('right');
      expect(state.shortcuts.seekBackward).toBe('left');
      expect(state.shortcuts.volumeUp).toBe('up');
      expect(state.shortcuts.volumeDown).toBe('down');
      expect(state.shortcuts.toggleMute).toBe('m');
    });
  });

  describe('setShortcut', () => {
    it('should update a shortcut binding', () => {
      const { setShortcut } = useKeyboardStore.getState();

      setShortcut('togglePlay', 'p');

      const state = useKeyboardStore.getState();
      expect(state.shortcuts.togglePlay).toBe('p');
    });

    it('should update a shortcut with modifier keys', () => {
      const { setShortcut } = useKeyboardStore.getState();

      setShortcut('nextTrack', 'ctrl+shift+n');

      const state = useKeyboardStore.getState();
      expect(state.shortcuts.nextTrack).toBe('ctrl+shift+n');
    });

    it('should preserve other shortcuts when updating one', () => {
      const { setShortcut } = useKeyboardStore.getState();
      const originalMuteBinding = useKeyboardStore.getState().shortcuts.toggleMute;

      setShortcut('togglePlay', 'p');

      const state = useKeyboardStore.getState();
      expect(state.shortcuts.toggleMute).toBe(originalMuteBinding);
    });

    it('should support alt modifier', () => {
      const { setShortcut } = useKeyboardStore.getState();

      setShortcut('toggleMute', 'alt+m');

      const state = useKeyboardStore.getState();
      expect(state.shortcuts.toggleMute).toBe('alt+m');
    });
  });

  describe('resetToDefaults', () => {
    it('should restore all shortcuts to defaults', () => {
      const { setShortcut, resetToDefaults } = useKeyboardStore.getState();

      // Modify some shortcuts
      setShortcut('togglePlay', 'p');
      setShortcut('toggleMute', 'n');

      // Reset to defaults
      resetToDefaults();

      const state = useKeyboardStore.getState();
      expect(state.shortcuts).toEqual(DEFAULT_SHORTCUTS);
    });

    it('should reset all modified shortcuts', () => {
      const { setShortcut, resetToDefaults } = useKeyboardStore.getState();

      // Modify all shortcuts
      setShortcut('togglePlay', 'a');
      setShortcut('nextTrack', 'b');
      setShortcut('previousTrack', 'c');
      setShortcut('seekForward', 'd');
      setShortcut('seekBackward', 'e');
      setShortcut('volumeUp', 'f');
      setShortcut('volumeDown', 'g');
      setShortcut('toggleMute', 'h');

      resetToDefaults();

      const state = useKeyboardStore.getState();
      expect(state.shortcuts.togglePlay).toBe(DEFAULT_SHORTCUTS.togglePlay);
      expect(state.shortcuts.nextTrack).toBe(DEFAULT_SHORTCUTS.nextTrack);
      expect(state.shortcuts.toggleMute).toBe(DEFAULT_SHORTCUTS.toggleMute);
    });
  });

  describe('hasConflict', () => {
    it('should detect conflicting key bindings', () => {
      const { hasConflict } = useKeyboardStore.getState();

      // space is already bound to togglePlay
      const conflict = hasConflict('toggleMute', 'space');

      expect(conflict).toBe('togglePlay');
    });

    it('should not report conflict for same action', () => {
      const { hasConflict } = useKeyboardStore.getState();

      // space is bound to togglePlay, checking togglePlay itself
      const conflict = hasConflict('togglePlay', 'space');

      expect(conflict).toBeNull();
    });

    it('should return null when no conflict exists', () => {
      const { hasConflict } = useKeyboardStore.getState();

      const conflict = hasConflict('toggleMute', 'z');

      expect(conflict).toBeNull();
    });

    it('should detect conflicts with modifier keys', () => {
      const { hasConflict } = useKeyboardStore.getState();

      // shift+right is bound to nextTrack
      const conflict = hasConflict('toggleMute', 'shift+right');

      expect(conflict).toBe('nextTrack');
    });
  });

  describe('getActionLabel', () => {
    it('should return human-readable labels for actions', () => {
      const { getActionLabel } = useKeyboardStore.getState();

      expect(getActionLabel('togglePlay')).toBe('Play/Pause');
      expect(getActionLabel('nextTrack')).toBe('Next Track');
      expect(getActionLabel('previousTrack')).toBe('Previous Track');
      expect(getActionLabel('seekForward')).toBe('Seek Forward 10s');
      expect(getActionLabel('seekBackward')).toBe('Seek Backward 10s');
      expect(getActionLabel('volumeUp')).toBe('Volume Up');
      expect(getActionLabel('volumeDown')).toBe('Volume Down');
      expect(getActionLabel('toggleMute')).toBe('Toggle Mute');
    });
  });

  describe('formatShortcut', () => {
    it('should format simple key', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('space')).toBe('Space');
    });

    it('should format arrow keys with symbols', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('up')).toBe('↑');
      expect(formatShortcut('down')).toBe('↓');
      expect(formatShortcut('left')).toBe('←');
      expect(formatShortcut('right')).toBe('→');
    });

    it('should format key with shift', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('shift+right')).toBe('Shift + →');
    });

    it('should format key with ctrl', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('ctrl+s')).toBe('Ctrl + S');
    });

    it('should format key with alt', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('alt+m')).toBe('Alt + M');
    });

    it('should format key with multiple modifiers', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('ctrl+shift+s')).toBe('Ctrl + Shift + S');
    });

    it('should capitalize single letter keys', () => {
      const { formatShortcut } = useKeyboardStore.getState();

      expect(formatShortcut('m')).toBe('M');
      expect(formatShortcut('a')).toBe('A');
    });
  });

  describe('getShortcutsByCategory', () => {
    it('should group shortcuts by category', () => {
      const { getShortcutsByCategory } = useKeyboardStore.getState();

      const categories = getShortcutsByCategory();

      expect(categories).toHaveLength(3);
      expect(categories[0].name).toBe('Playback');
      expect(categories[1].name).toBe('Seeking');
      expect(categories[2].name).toBe('Volume');
    });

    it('should include correct actions in Playback category', () => {
      const { getShortcutsByCategory } = useKeyboardStore.getState();

      const categories = getShortcutsByCategory();
      const playbackCategory = categories.find((c) => c.name === 'Playback');

      expect(playbackCategory?.actions).toContain('togglePlay');
      expect(playbackCategory?.actions).toContain('nextTrack');
      expect(playbackCategory?.actions).toContain('previousTrack');
    });

    it('should include correct actions in Volume category', () => {
      const { getShortcutsByCategory } = useKeyboardStore.getState();

      const categories = getShortcutsByCategory();
      const volumeCategory = categories.find((c) => c.name === 'Volume');

      expect(volumeCategory?.actions).toContain('volumeUp');
      expect(volumeCategory?.actions).toContain('volumeDown');
      expect(volumeCategory?.actions).toContain('toggleMute');
    });
  });

  describe('localStorage persistence', () => {
    it('should have persist configuration', () => {
      // Verify that the store uses zustand persist middleware
      // by checking that the store has a persist property
      const store = useKeyboardStore;

      // Zustand persist adds a persist property to the store
      expect(store.persist).toBeDefined();
      expect(store.persist.getOptions().name).toBe('keyboard-shortcuts');
    });

    it('should only persist shortcuts field', () => {
      const store = useKeyboardStore;
      const partialize = store.persist.getOptions().partialize;

      if (partialize) {
        const state = useKeyboardStore.getState();
        const persistedState = partialize(state);

        // Should only contain shortcuts
        expect(Object.keys(persistedState)).toEqual(['shortcuts']);
      }
    });
  });
});

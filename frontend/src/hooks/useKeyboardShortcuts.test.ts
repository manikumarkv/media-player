import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useKeyboardStore, DEFAULT_SHORTCUTS } from '../stores/keyboardStore';
import { usePlayerStore } from '../stores/playerStore';

// Type for hotkey callbacks stored on window
interface HotkeyCallbacks {
  __hotkeyCallbacks?: Record<string, () => void>;
}

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn((keys: string, callback: () => void) => {
    // Store the callback for testing
    const mockRef = { current: null };
    // Register the callback in a way we can trigger it
    const win = window as unknown as HotkeyCallbacks;
    win.__hotkeyCallbacks ??= {};
    win.__hotkeyCallbacks[keys] = callback;
    return mockRef;
  }),
}));

// Helper to trigger a hotkey callback
function triggerHotkey(keys: string) {
  const win = window as unknown as HotkeyCallbacks;
  const callbacks = win.__hotkeyCallbacks;
  const callback = callbacks?.[keys];
  callback?.();
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Reset stores
    useKeyboardStore.setState({ shortcuts: { ...DEFAULT_SHORTCUTS } });
    usePlayerStore.setState({
      isPlaying: false,
      currentTime: 0,
      volume: 0.5,
      isMuted: false,
      currentTrack: {
        id: '1',
        title: 'Test Track',
        duration: 100,
        filePath: '/test.mp3',
      },
      queue: [],
      queueIndex: -1,
    });

    // Reset hotkey callbacks
    (window as unknown as { __hotkeyCallbacks: Record<string, () => void> }).__hotkeyCallbacks = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('playback shortcuts', () => {
    it('should toggle play on space key', () => {
      renderHook(() => useKeyboardShortcuts());

      // Initial state
      expect(usePlayerStore.getState().isPlaying).toBe(false);

      // Trigger the space shortcut
      act(() => {
        triggerHotkey('space');
      });

      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('should call playNext on shift+right', () => {
      // Set up queue for playNext to work
      usePlayerStore.setState({
        queue: [
          { id: '1', title: 'Track 1', duration: 100, filePath: '/1.mp3' },
          { id: '2', title: 'Track 2', duration: 100, filePath: '/2.mp3' },
        ],
        queueIndex: 0,
      });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('shift+right');
      });

      expect(usePlayerStore.getState().queueIndex).toBe(1);
    });

    it('should call playPrevious on shift+left', () => {
      usePlayerStore.setState({
        queue: [
          { id: '1', title: 'Track 1', duration: 100, filePath: '/1.mp3' },
          { id: '2', title: 'Track 2', duration: 100, filePath: '/2.mp3' },
        ],
        queueIndex: 1,
        currentTime: 0, // Less than 3 seconds, so it will go to previous
      });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('shift+left');
      });

      expect(usePlayerStore.getState().queueIndex).toBe(0);
    });
  });

  describe('volume shortcuts', () => {
    it('should toggle mute on m key', () => {
      expect(usePlayerStore.getState().isMuted).toBe(false);

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('m');
      });

      expect(usePlayerStore.getState().isMuted).toBe(true);
    });

    it('should increase volume on up key', () => {
      usePlayerStore.setState({ volume: 0.5 });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('up');
      });

      expect(usePlayerStore.getState().volume).toBeCloseTo(0.6);
    });

    it('should decrease volume on down key', () => {
      usePlayerStore.setState({ volume: 0.5 });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('down');
      });

      expect(usePlayerStore.getState().volume).toBeCloseTo(0.4);
    });

    it('should not go above 1 for volume', () => {
      usePlayerStore.setState({ volume: 0.95 });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('up');
      });

      expect(usePlayerStore.getState().volume).toBe(1);
    });

    it('should not go below 0 for volume', () => {
      usePlayerStore.setState({ volume: 0.05 });

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('down');
      });

      expect(usePlayerStore.getState().volume).toBe(0);
    });
  });

  describe('custom shortcuts', () => {
    it('should use custom shortcut from store', () => {
      // Set custom shortcut
      useKeyboardStore.getState().setShortcut('togglePlay', 'p');

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('p');
      });

      expect(usePlayerStore.getState().isPlaying).toBe(true);
    });

    it('should use custom shortcut with modifiers', () => {
      // Set custom shortcut with modifier
      useKeyboardStore.getState().setShortcut('toggleMute', 'ctrl+m');

      renderHook(() => useKeyboardShortcuts());

      act(() => {
        triggerHotkey('ctrl+m');
      });

      expect(usePlayerStore.getState().isMuted).toBe(true);
    });
  });

  describe('seeking shortcuts', () => {
    it('should provide seek forward callback', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.seekForward).toBeDefined();
    });

    it('should provide seek backward callback', () => {
      const { result } = renderHook(() => useKeyboardShortcuts());

      expect(result.current.seekBackward).toBeDefined();
    });
  });

  describe('hook options', () => {
    it('should accept enabled option', () => {
      const { result } = renderHook(() => useKeyboardShortcuts({ enabled: false }));

      // Hook should return actions but they won't be bound
      expect(result.current).toBeDefined();
    });
  });
});

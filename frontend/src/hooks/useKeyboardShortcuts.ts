import { useEffect, useCallback } from 'react';
import { useKeyboardStore } from '../stores/keyboardStore';
import { usePlayerStore } from '../stores/playerStore';

interface UseKeyboardShortcutsOptions {
  /**
   * Whether keyboard shortcuts are enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * Check if a keyboard event matches a shortcut string
 * Shortcut format: "shift+right", "ctrl+m", "space", etc.
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  // Check modifiers
  const needsShift = modifiers.includes('shift');
  const needsCtrl = modifiers.includes('ctrl');
  const needsAlt = modifiers.includes('alt');
  const needsMeta = modifiers.includes('meta');

  if (event.shiftKey !== needsShift) {
    return false;
  }
  if (event.ctrlKey !== needsCtrl) {
    return false;
  }
  if (event.altKey !== needsAlt) {
    return false;
  }
  if (event.metaKey !== needsMeta) {
    return false;
  }

  // Check key
  const eventKey = event.key.toLowerCase();
  const eventCode = event.code.toLowerCase();

  // Handle special keys
  if (key === 'space') {
    return eventCode === 'space';
  }
  if (key === 'up') {
    return eventCode === 'arrowup';
  }
  if (key === 'down') {
    return eventCode === 'arrowdown';
  }
  if (key === 'left') {
    return eventCode === 'arrowleft';
  }
  if (key === 'right') {
    return eventCode === 'arrowright';
  }

  // Handle letter keys
  return eventKey === key || eventCode === `key${key}`;
}

/**
 * Hook that sets up keyboard shortcuts for the media player.
 * Reads shortcuts from keyboardStore for customization.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true } = options;
  const shortcuts = useKeyboardStore((state) => state.shortcuts);

  // Player actions
  const togglePlay = useCallback(() => {
    usePlayerStore.getState().togglePlay();
  }, []);

  const playNext = useCallback(() => {
    usePlayerStore.getState().playNext();
  }, []);

  const playPrevious = useCallback(() => {
    usePlayerStore.getState().playPrevious();
  }, []);

  const toggleMute = useCallback(() => {
    usePlayerStore.getState().toggleMute();
  }, []);

  const volumeUp = useCallback(() => {
    const { volume, setVolume } = usePlayerStore.getState();
    setVolume(Math.min(1, volume + 0.1));
  }, []);

  const volumeDown = useCallback(() => {
    const { volume, setVolume } = usePlayerStore.getState();
    setVolume(Math.max(0, volume - 0.1));
  }, []);

  const seekForward = useCallback(() => {
    const time = usePlayerStore.getState().currentTime;
    window.dispatchEvent(new CustomEvent('player:seek', { detail: { time: time + 10 } }));
  }, []);

  const seekBackward = useCallback(() => {
    const time = usePlayerStore.getState().currentTime;
    window.dispatchEvent(
      new CustomEvent('player:seek', { detail: { time: Math.max(0, time - 10) } })
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check each shortcut
      if (matchesShortcut(event, shortcuts.togglePlay)) {
        event.preventDefault();
        togglePlay();
      } else if (matchesShortcut(event, shortcuts.nextTrack)) {
        event.preventDefault();
        playNext();
      } else if (matchesShortcut(event, shortcuts.previousTrack)) {
        event.preventDefault();
        playPrevious();
      } else if (matchesShortcut(event, shortcuts.seekForward)) {
        event.preventDefault();
        seekForward();
      } else if (matchesShortcut(event, shortcuts.seekBackward)) {
        event.preventDefault();
        seekBackward();
      } else if (matchesShortcut(event, shortcuts.volumeUp)) {
        event.preventDefault();
        volumeUp();
      } else if (matchesShortcut(event, shortcuts.volumeDown)) {
        event.preventDefault();
        volumeDown();
      } else if (matchesShortcut(event, shortcuts.toggleMute)) {
        event.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    shortcuts,
    togglePlay,
    playNext,
    playPrevious,
    seekForward,
    seekBackward,
    volumeUp,
    volumeDown,
    toggleMute,
  ]);

  // Return actions for programmatic use
  return {
    togglePlay,
    playNext,
    playPrevious,
    toggleMute,
    volumeUp,
    volumeDown,
    seekForward,
    seekBackward,
  };
}

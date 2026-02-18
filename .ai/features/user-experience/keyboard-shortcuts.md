# Feature: Keyboard Shortcuts Config

## Status
- [ ] Not Started
- [ ] In Progress
- [x] Complete

## Priority
P2 (Important)

## Complexity
Low

## Overview
Customizable keyboard bindings for player controls and navigation. Allows power users to configure their preferred shortcuts and displays a help modal with all available shortcuts.

## User Stories
- As a power user, I want to use keyboard shortcuts so that I can control the player without using the mouse
- As a user, I want to see a list of available shortcuts so that I can learn them
- As a user, I want to customize keyboard bindings so that they match my preferences or other apps I use
- As a user, I want my custom shortcuts to persist so that I don't have to reconfigure them

## Acceptance Criteria
- [ ] Default shortcuts for all common actions (play/pause, next, prev, volume, seek)
- [ ] Keyboard shortcuts help modal (triggered by `?` key)
- [ ] Settings UI to view and customize bindings
- [ ] Conflict detection when assigning new shortcuts
- [ ] Reset to defaults option
- [ ] Shortcuts persist in localStorage
- [ ] Shortcuts work globally when app is focused
- [ ] Shortcuts disabled when typing in input fields
- [ ] Support for modifier keys (Ctrl, Alt, Shift, Meta)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/App.tsx` - Add global keyboard listener
  - `frontend/src/stores/` - Add shortcuts configuration store
- **New components:**
  - `frontend/src/components/Settings/KeyboardShortcuts.tsx` - Shortcuts config UI
  - `frontend/src/components/Modals/ShortcutsHelpModal.tsx` - Help modal
  - `frontend/src/components/Settings/ShortcutInput.tsx` - Key capture input
  - `frontend/src/hooks/useKeyboardShortcuts.ts` - Shortcut handling hook
- **State changes:**
  - Add shortcuts configuration to settings store

### Default Shortcuts
```typescript
const DEFAULT_SHORTCUTS: Record<string, ShortcutConfig> = {
  playPause: { key: 'Space', label: 'Play / Pause' },
  nextTrack: { key: 'ArrowRight', modifiers: ['Meta'], label: 'Next Track' },
  prevTrack: { key: 'ArrowLeft', modifiers: ['Meta'], label: 'Previous Track' },
  volumeUp: { key: 'ArrowUp', label: 'Volume Up' },
  volumeDown: { key: 'ArrowDown', label: 'Volume Down' },
  mute: { key: 'm', label: 'Mute / Unmute' },
  seekForward: { key: 'ArrowRight', label: 'Seek Forward 10s' },
  seekBackward: { key: 'ArrowLeft', label: 'Seek Backward 10s' },
  toggleShuffle: { key: 's', label: 'Toggle Shuffle' },
  toggleRepeat: { key: 'r', label: 'Toggle Repeat' },
  search: { key: 'k', modifiers: ['Meta'], label: 'Focus Search' },
  showShortcuts: { key: '?', label: 'Show Shortcuts' },
  escape: { key: 'Escape', label: 'Close Modal / Deselect' },
  fullscreen: { key: 'f', label: 'Toggle Fullscreen' },
};
```

### Keyboard Hook Implementation
```typescript
// useKeyboardShortcuts.ts
interface ShortcutConfig {
  key: string;
  modifiers?: ('Meta' | 'Ctrl' | 'Alt' | 'Shift')[];
  label: string;
}

export function useKeyboardShortcuts(
  shortcuts: Record<string, ShortcutConfig>,
  handlers: Record<string, () => void>
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      for (const [action, config] of Object.entries(shortcuts)) {
        const modifiers = config.modifiers || [];
        const modifiersMatch =
          modifiers.includes('Meta') === event.metaKey &&
          modifiers.includes('Ctrl') === event.ctrlKey &&
          modifiers.includes('Alt') === event.altKey &&
          modifiers.includes('Shift') === event.shiftKey;

        if (event.key === config.key && modifiersMatch) {
          event.preventDefault();
          handlers[action]?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, handlers]);
}
```

### Shortcut Input Component
```typescript
// ShortcutInput.tsx - Captures new key binding
function ShortcutInput({ value, onChange, onClear }) {
  const [capturing, setCapturing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (!capturing) return;

    const modifiers = [];
    if (e.metaKey) modifiers.push('Meta');
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.altKey) modifiers.push('Alt');
    if (e.shiftKey) modifiers.push('Shift');

    // Ignore standalone modifier keys
    if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;

    onChange({ key: e.key, modifiers });
    setCapturing(false);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onKeyDown={handleKeyDown}
        onClick={() => setCapturing(true)}
        className={`px-3 py-2 border rounded ${capturing ? 'ring-2' : ''}`}
      >
        {capturing ? 'Press keys...' : formatShortcut(value)}
      </button>
      <button onClick={onClear}>Reset</button>
    </div>
  );
}
```

### Backend Changes
- None required - shortcuts are purely client-side

### Database Changes
- None required for initial implementation
- Future: Store custom shortcuts in user preferences for cloud sync

## Dependencies
- **Requires:** Core player controls exist
- **Blocks:** None

## Shortcuts Help Modal Content
```
┌─────────────────────────────────────┐
│        Keyboard Shortcuts           │
├─────────────────────────────────────┤
│ PLAYBACK                            │
│ Space          Play / Pause         │
│ ⌘ →            Next Track           │
│ ⌘ ←            Previous Track       │
│ →              Seek Forward 10s     │
│ ←              Seek Backward 10s    │
│                                     │
│ VOLUME                              │
│ ↑              Volume Up            │
│ ↓              Volume Down          │
│ M              Mute / Unmute        │
│                                     │
│ CONTROLS                            │
│ S              Toggle Shuffle       │
│ R              Toggle Repeat        │
│ F              Toggle Fullscreen    │
│                                     │
│ NAVIGATION                          │
│ ⌘ K            Focus Search         │
│ ?              Show This Help       │
│ Esc            Close / Deselect     │
└─────────────────────────────────────┘
```

## Notes
- Consider platform-specific defaults (Cmd on Mac, Ctrl on Windows)
- Show `⌘` symbol on Mac, `Ctrl` on Windows/Linux
- Some shortcuts may conflict with browser defaults - document these
- Consider adding vim-style navigation (j/k for up/down) as optional preset
- May want to add media key support (play/pause hardware buttons)
- Could add shortcut cheatsheet that appears on first use

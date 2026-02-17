# Feature: Sleep Timer

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
Low

## Overview
Auto-stop playback after a set duration or number of tracks. Perfect for falling asleep to music without it playing all night, or for timed listening sessions.

## User Stories
- As a user, I want to set a sleep timer so that music stops automatically when I fall asleep
- As a user, I want to choose between time-based or track-based limits so that I have flexibility
- As a user, I want to see the remaining time so that I know when playback will stop
- As a user, I want music to fade out gradually so that it doesn't end abruptly

## Acceptance Criteria
- [ ] Timer options: 15, 30, 45, 60, 90 minutes, or custom
- [ ] Option to stop after X tracks instead of time
- [ ] Visual countdown showing remaining time/tracks
- [ ] Gradual volume fade-out in final minute
- [ ] Quick access from player controls
- [ ] Cancel timer option
- [ ] Notification when timer is about to end
- [ ] Timer persists if app is minimized

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add sleep timer state
  - `frontend/src/components/Player/PlayerControls.tsx` - Add timer button
- **New components:**
  - `frontend/src/components/Player/SleepTimer.tsx` - Timer UI and controls
  - `frontend/src/components/Player/SleepTimerPopover.tsx` - Timer settings popover
  - `frontend/src/hooks/useSleepTimer.ts` - Timer logic
- **State changes:**
  - Add `sleepTimer: SleepTimerState | null` to player store

### State Interface
```typescript
interface SleepTimerState {
  type: 'time' | 'tracks';
  // For time-based
  endTime?: number;        // Unix timestamp when timer ends
  // For track-based
  tracksRemaining?: number;
  // Common
  fadeOutDuration: number; // seconds (default 60)
  startedAt: number;       // Unix timestamp when started
}
```

### Sleep Timer Hook
```typescript
// useSleepTimer.ts
export function useSleepTimer() {
  const { sleepTimer, setSleepTimer, pause, setVolume, originalVolume } = usePlayerStore();

  useEffect(() => {
    if (!sleepTimer || sleepTimer.type !== 'time') return;

    const checkTimer = () => {
      const now = Date.now();
      const remaining = sleepTimer.endTime! - now;

      if (remaining <= 0) {
        // Timer ended
        pause();
        setSleepTimer(null);
        setVolume(originalVolume);
        return;
      }

      // Fade out in final minute
      if (remaining <= sleepTimer.fadeOutDuration * 1000) {
        const fadeProgress = remaining / (sleepTimer.fadeOutDuration * 1000);
        setVolume(originalVolume * fadeProgress);
      }
    };

    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [sleepTimer]);

  const startTimer = (minutes: number) => {
    setSleepTimer({
      type: 'time',
      endTime: Date.now() + minutes * 60 * 1000,
      fadeOutDuration: 60,
      startedAt: Date.now()
    });
  };

  const startTrackTimer = (tracks: number) => {
    setSleepTimer({
      type: 'tracks',
      tracksRemaining: tracks,
      fadeOutDuration: 60,
      startedAt: Date.now()
    });
  };

  const cancelTimer = () => {
    setVolume(originalVolume);
    setSleepTimer(null);
  };

  const getRemainingTime = (): number | null => {
    if (!sleepTimer || sleepTimer.type !== 'time') return null;
    return Math.max(0, sleepTimer.endTime! - Date.now());
  };

  return {
    isActive: sleepTimer !== null,
    sleepTimer,
    startTimer,
    startTrackTimer,
    cancelTimer,
    getRemainingTime
  };
}
```

### Track-Based Timer
```typescript
// Handle track changes for track-based timer
function useTrackBasedSleepTimer() {
  const { sleepTimer, setSleepTimer, pause } = usePlayerStore();

  // Listen for track changes
  useEffect(() => {
    if (!sleepTimer || sleepTimer.type !== 'tracks') return;

    const handleTrackEnd = () => {
      const remaining = sleepTimer.tracksRemaining! - 1;

      if (remaining <= 0) {
        // Last track finished
        pause();
        setSleepTimer(null);
      } else {
        setSleepTimer({
          ...sleepTimer,
          tracksRemaining: remaining
        });
      }
    };

    // Subscribe to track end event
    playerEvents.on('trackEnd', handleTrackEnd);
    return () => playerEvents.off('trackEnd', handleTrackEnd);
  }, [sleepTimer]);
}
```

### Timer UI Component
```typescript
// SleepTimerPopover.tsx
function SleepTimerPopover() {
  const { startTimer, startTrackTimer, cancelTimer, isActive, getRemainingTime } = useSleepTimer();

  const presets = [15, 30, 45, 60, 90];
  const trackPresets = [1, 3, 5, 10];

  if (isActive) {
    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <Moon className="w-8 h-8 mx-auto mb-2 text-accent" />
          <p className="text-lg font-medium">
            {formatTime(getRemainingTime()!)}
          </p>
          <p className="text-sm text-text-secondary">remaining</p>
        </div>
        <Button onClick={cancelTimer} variant="secondary" fullWidth>
          Cancel Timer
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-medium mb-3">Sleep Timer</h3>

      <div className="mb-4">
        <p className="text-sm text-text-secondary mb-2">Stop after time</p>
        <div className="grid grid-cols-3 gap-2">
          {presets.map(mins => (
            <Button key={mins} onClick={() => startTimer(mins)} variant="secondary">
              {mins}m
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-text-secondary mb-2">Stop after tracks</p>
        <div className="grid grid-cols-4 gap-2">
          {trackPresets.map(tracks => (
            <Button key={tracks} onClick={() => startTrackTimer(tracks)} variant="secondary">
              {tracks}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Backend Changes
- None required - sleep timer is purely client-side

### Database Changes
- None required

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** None

## UI Design

### Timer Button States
```
Inactive:  [🌙]        (Moon icon, muted)
Active:    [🌙 23:45]  (Moon icon + countdown, accent color)
```

### Popover Layout
```
┌─────────────────────────────┐
│      Sleep Timer            │
├─────────────────────────────┤
│ Stop after time             │
│ [15m] [30m] [45m]          │
│ [60m] [90m] [Custom]       │
│                             │
│ Stop after tracks           │
│ [1] [3] [5] [10]           │
└─────────────────────────────┘
```

### Active Timer Display
```
┌─────────────────────────────┐
│           🌙                │
│         23:45               │
│        remaining            │
│                             │
│    [Cancel Timer]           │
└─────────────────────────────┘
```

## Notes
- Consider system sleep integration on desktop (prevent sleep while playing, sleep when timer ends)
- Could add "finish current track" option
- May want to persist timer across page refreshes using localStorage
- Consider adding alarm/wake feature in the future
- Could show progress arc around moon icon
- Mobile: may need to handle background playback differently

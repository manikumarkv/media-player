# Feature: Crossfade

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Smooth audio transitions between tracks by fading out the ending track while simultaneously fading in the next track. Creates a DJ-like continuous listening experience without abrupt stops between songs.

## User Stories
- As a user, I want songs to blend smoothly so that there are no jarring silences between tracks
- As a user, I want to adjust crossfade duration so that I can control how long the transition takes
- As a user, I want to disable crossfade for certain situations so that I can hear songs as intended (classical, podcasts)
- As a user, I want crossfade to work with shuffle and queue so that all playback modes have smooth transitions

## Acceptance Criteria
- [ ] Configurable crossfade duration (0-12 seconds)
- [ ] Toggle to enable/disable crossfade
- [ ] Crossfade works with all playback modes (normal, shuffle, repeat)
- [ ] Next track begins before current track ends
- [ ] Volume curves create natural-sounding blend
- [ ] Visual indicator showing crossfade is active
- [ ] Settings persist across sessions
- [ ] No audio glitches during transition
- [ ] Works with queue and auto-play

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add crossfade state and logic
  - `frontend/src/components/Player/PlayerControls.tsx` - Handle track transitions
  - `frontend/src/components/Settings/` - Add crossfade settings
- **New components:**
  - `frontend/src/components/Settings/CrossfadeSettings.tsx` - Crossfade duration slider
  - `frontend/src/hooks/useCrossfade.ts` - Crossfade logic hook
- **State changes:**
  - Add `crossfadeEnabled: boolean`
  - Add `crossfadeDuration: number` (seconds)
  - Add `crossfadeState: 'idle' | 'fading'`

### Audio Implementation
```typescript
// Two audio elements for crossfade
interface CrossfadePlayer {
  primary: HTMLAudioElement;
  secondary: HTMLAudioElement;
  activePlayers: 'primary' | 'secondary';
}

class CrossfadeManager {
  private primaryAudio: HTMLAudioElement;
  private secondaryAudio: HTMLAudioElement;
  private audioContext: AudioContext;
  private primaryGain: GainNode;
  private secondaryGain: GainNode;
  private crossfadeDuration: number = 5; // seconds

  constructor() {
    this.audioContext = new AudioContext();

    // Create gain nodes for volume control
    this.primaryGain = this.audioContext.createGain();
    this.secondaryGain = this.audioContext.createGain();

    // Connect to destination
    this.primaryGain.connect(this.audioContext.destination);
    this.secondaryGain.connect(this.audioContext.destination);

    // Connect audio elements to gain nodes
    const primarySource = this.audioContext.createMediaElementSource(this.primaryAudio);
    const secondarySource = this.audioContext.createMediaElementSource(this.secondaryAudio);
    primarySource.connect(this.primaryGain);
    secondarySource.connect(this.secondaryGain);

    // Initialize volumes
    this.primaryGain.gain.value = 1;
    this.secondaryGain.gain.value = 0;
  }

  startCrossfade(nextTrackUrl: string) {
    const startTime = this.audioContext.currentTime;
    const endTime = startTime + this.crossfadeDuration;

    // Load next track on secondary player
    this.secondaryAudio.src = nextTrackUrl;
    this.secondaryAudio.play();

    // Fade out primary (linear or equal-power curve)
    this.primaryGain.gain.setValueAtTime(1, startTime);
    this.primaryGain.gain.linearRampToValueAtTime(0, endTime);

    // Fade in secondary
    this.secondaryGain.gain.setValueAtTime(0, startTime);
    this.secondaryGain.gain.linearRampToValueAtTime(1, endTime);

    // Swap roles after crossfade completes
    setTimeout(() => {
      this.swapPlayers();
    }, this.crossfadeDuration * 1000);
  }

  private swapPlayers() {
    // Swap primary and secondary references
    [this.primaryAudio, this.secondaryAudio] = [this.secondaryAudio, this.primaryAudio];
    [this.primaryGain, this.secondaryGain] = [this.secondaryGain, this.primaryGain];

    // Reset old primary (now secondary)
    this.secondaryAudio.pause();
    this.secondaryAudio.src = '';
    this.secondaryGain.gain.value = 0;
  }
}
```

### Crossfade Trigger
```typescript
// Monitor track progress and trigger crossfade
function useCrossfade(playerStore: PlayerStore) {
  const { currentTime, duration, crossfadeEnabled, crossfadeDuration } = playerStore;

  useEffect(() => {
    if (!crossfadeEnabled || !duration) return;

    const fadeStartTime = duration - crossfadeDuration;

    if (currentTime >= fadeStartTime && currentTime < duration) {
      // Start crossfade to next track
      const nextTrack = playerStore.getNextTrack();
      if (nextTrack) {
        crossfadeManager.startCrossfade(nextTrack.url);
      }
    }
  }, [currentTime, duration, crossfadeEnabled, crossfadeDuration]);
}
```

### Equal-Power Crossfade Curve
```typescript
// More natural sounding than linear fade
function equalPowerCrossfade(
  primaryGain: GainNode,
  secondaryGain: GainNode,
  duration: number,
  audioContext: AudioContext
) {
  const startTime = audioContext.currentTime;
  const steps = 50;
  const stepDuration = duration / steps;

  for (let i = 0; i <= steps; i++) {
    const time = startTime + (i * stepDuration);
    const position = i / steps;

    // Equal-power curve: sqrt(1-x) for fade out, sqrt(x) for fade in
    const fadeOutValue = Math.sqrt(1 - position);
    const fadeInValue = Math.sqrt(position);

    primaryGain.gain.setValueAtTime(fadeOutValue, time);
    secondaryGain.gain.setValueAtTime(fadeInValue, time);
  }
}
```

### Backend Changes
- None required - crossfade is purely client-side

### Database Changes
- None required

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** Gapless Playback (similar preloading infrastructure)

## Settings UI

```
┌─────────────────────────────────────┐
│ Crossfade                           │
├─────────────────────────────────────┤
│ Enable crossfade        [Toggle: ON]│
│                                     │
│ Duration                            │
│ ○────────●──────────○  5 seconds    │
│ 0s                12s               │
│                                     │
│ [Preview crossfade]                 │
└─────────────────────────────────────┘
```

## Edge Cases
- **Short tracks:** If track is shorter than crossfade duration, reduce crossfade time
- **Manual skip:** Trigger immediate crossfade on next button press
- **Seek to end:** Handle seeking near track end gracefully
- **Pause during crossfade:** Pause both audio elements
- **Last track:** No crossfade if no next track exists

## Notes
- Consider smart crossfade that detects quiet endings and adjusts timing
- May conflict with gapless playback - should be mutually exclusive options
- Could add different fade curves (linear, exponential, S-curve)
- Consider detecting songs with existing fade-outs to avoid double-fade
- May need to preload next track early to avoid loading delay

# Feature: Smooth Volume

## Status
- [ ] Not Started
- [ ] In Progress
- [x] Complete

## Priority
P1 (Critical)

## Complexity
Low

## Overview
Fade volume changes instead of abrupt jumps. When adjusting volume via slider, keyboard, or mute toggle, the volume transitions smoothly over a short duration, preventing jarring audio changes.

## User Stories
- As a user, I want volume changes to be smooth so that adjustments don't startle me
- As a user, I want mute/unmute to fade so that it's not jarring
- As a user, I want the fade to be quick enough that it feels responsive

## Acceptance Criteria
- [ ] Volume slider changes fade over 100-200ms
- [ ] Mute/unmute fades over 200-300ms
- [ ] Keyboard volume shortcuts fade smoothly
- [ ] No audio artifacts during fading
- [ ] Fade feels responsive, not sluggish
- [ ] Option to disable smooth volume if user prefers instant changes
- [ ] Works with all volume controls (slider, keys, media keys)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add smooth volume logic
  - `frontend/src/components/Player/VolumeControl.tsx` - Update slider handling
- **New files:**
  - `frontend/src/hooks/useSmoothVolume.ts` - Volume fading logic
- **State changes:**
  - Add `smoothVolumeEnabled: boolean` to settings
  - Add `volumeFadeDuration: number` (ms)

### Web Audio API Implementation
```typescript
// Using Web Audio API GainNode for smooth fading
class SmoothVolumeController {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private fadeDuration: number = 0.15; // 150ms

  constructor(audioElement: HTMLAudioElement) {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();

    const source = this.audioContext.createMediaElementSource(audioElement);
    source.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  setVolume(value: number): void {
    // value is 0-1
    const currentTime = this.audioContext.currentTime;

    // Cancel any ongoing transitions
    this.gainNode.gain.cancelScheduledValues(currentTime);

    // Set current value and ramp to new value
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(value, currentTime + this.fadeDuration);
  }

  mute(): void {
    this.setVolume(0);
  }

  unmute(targetVolume: number): void {
    this.setVolume(targetVolume);
  }

  setFadeDuration(ms: number): void {
    this.fadeDuration = ms / 1000;
  }
}
```

### Alternative: CSS-like Easing Without Web Audio
```typescript
// If not using Web Audio API, use requestAnimationFrame
class SmoothVolumeFallback {
  private audio: HTMLAudioElement;
  private targetVolume: number;
  private animationId: number | null = null;
  private fadeDuration: number = 150; // ms

  constructor(audio: HTMLAudioElement) {
    this.audio = audio;
    this.targetVolume = audio.volume;
  }

  setVolume(target: number): void {
    this.targetVolume = target;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    const startVolume = this.audio.volume;
    const startTime = performance.now();
    const diff = target - startVolume;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.fadeDuration, 1);

      // Ease-out curve for natural feel
      const easedProgress = 1 - Math.pow(1 - progress, 2);

      this.audio.volume = startVolume + diff * easedProgress;

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }
}
```

### Integration with Player Store
```typescript
// playerStore.ts
interface PlayerState {
  volume: number;
  previousVolume: number; // For unmute
  isMuted: boolean;
  smoothVolumeEnabled: boolean;
}

const usePlayerStore = create<PlayerState>((set, get) => ({
  volume: 1,
  previousVolume: 1,
  isMuted: false,
  smoothVolumeEnabled: true,

  setVolume: (volume: number) => {
    const { smoothVolumeEnabled } = get();

    if (smoothVolumeEnabled) {
      smoothVolumeController.setVolume(volume);
    } else {
      audioElement.volume = volume;
    }

    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume, previousVolume, smoothVolumeEnabled } = get();

    if (isMuted) {
      // Unmute: restore previous volume
      const targetVolume = previousVolume || 0.5;
      if (smoothVolumeEnabled) {
        smoothVolumeController.setVolume(targetVolume);
      } else {
        audioElement.volume = targetVolume;
      }
      set({ volume: targetVolume, isMuted: false });
    } else {
      // Mute: save current volume and fade to 0
      set({ previousVolume: volume });
      if (smoothVolumeEnabled) {
        smoothVolumeController.setVolume(0);
      } else {
        audioElement.volume = 0;
      }
      set({ volume: 0, isMuted: true });
    }
  }
}));
```

### Volume Slider Component Update
```typescript
// VolumeControl.tsx
function VolumeControl() {
  const { volume, setVolume, toggleMute, isMuted } = usePlayerStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="volume-control flex items-center gap-2">
      <button onClick={toggleMute}>
        {isMuted ? <VolumeX /> : volume > 0.5 ? <Volume2 /> : <Volume1 />}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleChange}
        className="volume-slider"
      />
    </div>
  );
}
```

### Backend Changes
- None required - smooth volume is purely client-side

### Database Changes
- None required

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** None

## Testing
- [ ] Volume slider changes are smooth
- [ ] Mute button fades out audio
- [ ] Unmute button fades in audio
- [ ] Keyboard volume up/down fades
- [ ] No clicks or pops during fade
- [ ] Rapid volume changes handled gracefully
- [ ] Works when seeking while volume is fading

## Notes
- Web Audio API provides the smoothest fading
- Fallback implementation for browsers without full Web Audio support
- Consider exponential curves for more natural volume perception
- May need to coordinate with other audio features (EQ, crossfade)
- Fade duration should be configurable in settings
- Very quick fades (50-100ms) for slider, longer (200-300ms) for mute toggle

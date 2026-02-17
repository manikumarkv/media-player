# Feature: Smooth Seeking

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P1 (Critical)

## Complexity
Low

## Overview
Fade out audio before seeking and fade back in after seeking to a new position. This prevents the jarring audio "pop" or glitch that occurs when jumping to a different part of a track.

## User Stories
- As a user, I want seeking to be smooth so that I don't hear jarring audio pops
- As a user, I want the fade to be quick so that seeking feels responsive
- As a user, I want to preview audio while scrubbing the progress bar

## Acceptance Criteria
- [ ] Audio fades out before seek begins (~50ms)
- [ ] Audio fades in after seek completes (~50ms)
- [ ] Total seek feels responsive (< 200ms perceived delay)
- [ ] No audio pops, clicks, or glitches during seek
- [ ] Works with both progress bar dragging and keyboard seeking
- [ ] Optional: Audio preview while scrubbing (hear audio at scrub position)
- [ ] Option to disable smooth seeking if user prefers instant

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add smooth seek logic
  - `frontend/src/components/Player/ProgressBar.tsx` - Update seek handling
- **New files:**
  - `frontend/src/hooks/useSmoothSeek.ts` - Seek fading logic
- **State changes:**
  - Add `smoothSeekEnabled: boolean` to settings
  - Add `isSeeking: boolean` to track seek state

### Web Audio API Implementation
```typescript
// Using GainNode for smooth fade during seek
class SmoothSeekController {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private audioElement: HTMLAudioElement;
  private originalVolume: number = 1;
  private fadeDuration: number = 0.05; // 50ms

  constructor(audioElement: HTMLAudioElement, gainNode: GainNode, audioContext: AudioContext) {
    this.audioElement = audioElement;
    this.gainNode = gainNode;
    this.audioContext = audioContext;
  }

  async seekTo(time: number): Promise<void> {
    const currentTime = this.audioContext.currentTime;

    // Store current volume
    this.originalVolume = this.gainNode.gain.value;

    // Fade out
    this.gainNode.gain.setValueAtTime(this.originalVolume, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, currentTime + this.fadeDuration);

    // Wait for fade out
    await this.delay(this.fadeDuration * 1000);

    // Perform seek
    this.audioElement.currentTime = time;

    // Wait for audio to be ready at new position
    await this.waitForCanPlay();

    // Fade in
    const newTime = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0, newTime);
    this.gainNode.gain.linearRampToValueAtTime(this.originalVolume, newTime + this.fadeDuration);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private waitForCanPlay(): Promise<void> {
    return new Promise(resolve => {
      if (this.audioElement.readyState >= 3) {
        resolve();
        return;
      }

      const handler = () => {
        this.audioElement.removeEventListener('canplay', handler);
        resolve();
      };
      this.audioElement.addEventListener('canplay', handler);

      // Timeout fallback
      setTimeout(resolve, 100);
    });
  }
}
```

### Fallback Implementation (No Web Audio)
```typescript
// Using volume property directly
class SmoothSeekFallback {
  private audio: HTMLAudioElement;
  private fadeDuration: number = 50; // ms

  constructor(audio: HTMLAudioElement) {
    this.audio = audio;
  }

  async seekTo(time: number): Promise<void> {
    const originalVolume = this.audio.volume;

    // Quick fade out
    await this.fadeVolume(originalVolume, 0, this.fadeDuration);

    // Seek
    this.audio.currentTime = time;

    // Quick fade in
    await this.fadeVolume(0, originalVolume, this.fadeDuration);
  }

  private fadeVolume(from: number, to: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = performance.now();
      const diff = to - from;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        this.audio.volume = from + diff * progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
```

### Integration with Progress Bar
```typescript
// ProgressBar.tsx
function ProgressBar() {
  const { currentTime, duration, seekTo, smoothSeekEnabled } = usePlayerStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const handleSeekStart = () => {
    setIsDragging(true);
    setDragValue(currentTime);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setDragValue(time);
  };

  const handleSeekEnd = async () => {
    setIsDragging(false);

    if (smoothSeekEnabled) {
      await smoothSeekController.seekTo(dragValue);
    } else {
      seekTo(dragValue);
    }
  };

  const displayTime = isDragging ? dragValue : currentTime;
  const progress = duration ? (displayTime / duration) * 100 : 0;

  return (
    <div className="progress-bar">
      <span>{formatTime(displayTime)}</span>
      <input
        type="range"
        min="0"
        max={duration || 0}
        step="0.1"
        value={displayTime}
        onMouseDown={handleSeekStart}
        onTouchStart={handleSeekStart}
        onChange={handleSeekChange}
        onMouseUp={handleSeekEnd}
        onTouchEnd={handleSeekEnd}
      />
      <span>{formatTime(duration)}</span>
    </div>
  );
}
```

### Keyboard Seek Integration
```typescript
// In keyboard shortcuts handler
const handleSeekShortcut = async (direction: 'forward' | 'backward', seconds: number = 10) => {
  const { currentTime, duration, smoothSeekEnabled } = usePlayerStore.getState();

  const newTime = direction === 'forward'
    ? Math.min(currentTime + seconds, duration)
    : Math.max(currentTime - seconds, 0);

  if (smoothSeekEnabled) {
    await smoothSeekController.seekTo(newTime);
  } else {
    audioElement.currentTime = newTime;
  }
};
```

### Backend Changes
- None required - smooth seeking is purely client-side

### Database Changes
- None required

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** None
- **Related:** Smooth Volume (shares gain node infrastructure)

## Implementation Notes

### Combining with Smooth Volume
If both features use Web Audio API, share the same GainNode:

```typescript
class AudioController {
  private gainNode: GainNode;
  private smoothVolume: SmoothVolumeController;
  private smoothSeek: SmoothSeekController;

  constructor(audioElement: HTMLAudioElement) {
    const audioContext = new AudioContext();
    this.gainNode = audioContext.createGain();

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(this.gainNode);
    this.gainNode.connect(audioContext.destination);

    // Share gain node between controllers
    this.smoothVolume = new SmoothVolumeController(this.gainNode, audioContext);
    this.smoothSeek = new SmoothSeekController(audioElement, this.gainNode, audioContext);
  }
}
```

## Testing
- [ ] Click-seeking fades smoothly
- [ ] Drag-seeking fades smoothly
- [ ] Keyboard seek (arrow keys) fades smoothly
- [ ] No audio pops during seek
- [ ] Rapid seeks handled gracefully
- [ ] Works while audio is paused
- [ ] Seeking near end of track works correctly

## Notes
- 50ms fades are a good balance between smoothness and responsiveness
- May want longer fades for large seeks (e.g., jumping more than 30 seconds)
- Consider audio preview while dragging progress bar (play audio at drag position)
- Coordinate with Smooth Volume to avoid conflicts on the gain node
- Mobile browsers may have different seeking behavior

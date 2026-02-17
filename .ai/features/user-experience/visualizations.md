# Feature: Visualizations

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
Medium

## Overview
Audio visualizer displaying real-time frequency spectrum, waveform, or other visual representations of the currently playing audio. Adds visual interest and feedback during playback.

## User Stories
- As a user, I want to see audio visualizations so that I have engaging visual feedback while listening
- As a user, I want to choose between different visualization styles so that I can pick one I like
- As a user, I want to toggle visualizations on/off so that I can save resources when not needed
- As a user, I want visualizations to respond to the music in real-time so that they feel connected to the audio

## Acceptance Criteria
- [ ] At least 3 visualization modes: Spectrum Bars, Waveform, Circular
- [ ] Real-time audio analysis synced to playback
- [ ] Smooth 60fps animation performance
- [ ] Visualization toggle (on/off)
- [ ] Visualization mode selector
- [ ] Responds to audio volume and frequency content
- [ ] Color scheme matches current theme
- [ ] Minimal CPU/GPU impact when enabled
- [ ] Graceful fallback if Web Audio API unavailable

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add visualization state
  - `frontend/src/components/Player/` - Integrate visualizer
- **New components:**
  - `frontend/src/components/Player/Visualizer/Visualizer.tsx` - Main container
  - `frontend/src/components/Player/Visualizer/SpectrumBars.tsx` - Bar graph visualization
  - `frontend/src/components/Player/Visualizer/Waveform.tsx` - Oscilloscope-style waveform
  - `frontend/src/components/Player/Visualizer/Circular.tsx` - Circular spectrum
  - `frontend/src/components/Player/Visualizer/VisualizerControls.tsx` - Mode selector
- **State changes:**
  - Add `visualizerEnabled: boolean`
  - Add `visualizerMode: 'spectrum' | 'waveform' | 'circular'`

### Audio Analysis Implementation
```typescript
// Create analyser node for visualization
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256; // 128 frequency bins
analyser.smoothingTimeConstant = 0.8;

const source = audioContext.createMediaElementSource(audioElement);
source.connect(analyser);
analyser.connect(audioContext.destination);

// Get frequency data for spectrum
const frequencyData = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(frequencyData);

// Get time domain data for waveform
const waveformData = new Uint8Array(analyser.fftSize);
analyser.getByteTimeDomainData(waveformData);
```

### Canvas Rendering (Spectrum Bars)
```typescript
function drawSpectrum(ctx: CanvasRenderingContext2D, data: Uint8Array) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const barCount = 64;
  const barWidth = width / barCount;
  const step = Math.floor(data.length / barCount);

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < barCount; i++) {
    const value = data[i * step];
    const barHeight = (value / 255) * height;
    const x = i * barWidth;
    const y = height - barHeight;

    // Gradient from accent color to secondary
    const gradient = ctx.createLinearGradient(x, y, x, height);
    gradient.addColorStop(0, 'var(--color-accent)');
    gradient.addColorStop(1, 'var(--color-accent-hover)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth - 2, barHeight);
  }
}
```

### Animation Loop
```typescript
function useVisualizerAnimation(
  canvasRef: RefObject<HTMLCanvasElement>,
  analyser: AnalyserNode | null,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const draw = () => {
      analyser.getByteFrequencyData(data);
      drawSpectrum(ctx, data);
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [enabled, analyser]);
}
```

### Backend Changes
- None required - visualization is purely client-side

### Database Changes
- None required

## Dependencies
- **Requires:** Core player with Web Audio API integration (shared with Equalizer)
- **Blocks:** None

## Visualization Modes

### 1. Spectrum Bars
- Classic frequency bar graph
- 64 bars representing frequency bands
- Vertical bars with gradient colors
- Smooth rise/fall animation

### 2. Waveform
- Oscilloscope-style time domain display
- Line graph showing audio amplitude over time
- Green/accent colored line on dark background
- Continuous horizontal scroll

### 3. Circular
- Radial frequency spectrum
- Bars extend outward from center
- Creates a "starburst" or "sun" effect
- Good for fullscreen/ambient mode

## Performance Considerations
- Use `requestAnimationFrame` for smooth 60fps
- Reduce `fftSize` for better performance (256 is good balance)
- Use `smoothingTimeConstant` to reduce jitter
- Consider using WebGL for complex visualizations
- Pause animation when tab is not visible
- Lower quality on battery/low-power mode

## Notes
- Share AudioContext with Equalizer feature to avoid conflicts
- Consider adding fullscreen visualization mode
- Could add album art integration in center of circular mode
- May add custom color schemes in future
- Consider accessibility - provide way to disable motion

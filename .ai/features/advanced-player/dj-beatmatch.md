# Feature: DJ/Beatmatch Mode

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Automatic beat-matching transitions between tracks for seamless DJ-style mixing. Analyzes BPM of tracks, time-stretches to match tempos, and crossfades on beat boundaries for professional-sounding transitions without manual DJing.

## User Stories
- As a user, I want automatic beatmatched transitions so that I can have a continuous party mix
- As a user, I want songs to blend on the beat so that transitions sound professional
- As a user, I want to adjust how aggressive the tempo matching is so that songs don't sound too distorted
- As a user, I want DJ mode to work with my existing playlists so that I don't have to create special DJ playlists

## Acceptance Criteria
- [ ] Automatic BPM detection for all tracks
- [ ] Time-stretch tracks to match BPM (within tolerance, e.g., ±6%)
- [ ] Crossfade starts on beat boundaries
- [ ] Visual BPM display for each track
- [ ] Configurable tempo match tolerance
- [ ] Configurable crossfade duration (4, 8, 16 beats)
- [ ] Works with shuffle and queue
- [ ] Option to skip tracks that are too different in BPM
- [ ] Manual override to skip automatic transition

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add DJ mode state
  - `frontend/src/components/Player/` - Add DJ mode controls
- **New components:**
  - `frontend/src/components/Player/DJMode/DJModePanel.tsx` - DJ mode controls
  - `frontend/src/components/Player/DJMode/BPMDisplay.tsx` - Show track BPM
  - `frontend/src/components/Player/DJMode/TempoSlider.tsx` - Tempo adjustment
  - `frontend/src/services/beatDetection.ts` - BPM analysis
  - `frontend/src/services/timeStretch.ts` - Time stretching
- **State changes:**
  - Add `djModeEnabled: boolean`
  - Add `targetBPM: number | null` (current tempo)
  - Add `beatMatchTolerance: number` (max % tempo change)
  - Add `crossfadeBeats: 4 | 8 | 16`

### BPM Detection
```typescript
// Using Web Audio API for beat detection
async function detectBPM(audioBuffer: AudioBuffer): Promise<number> {
  // Get audio data
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  // Filter for kick drum frequencies (80-160Hz)
  const filteredData = bandpassFilter(channelData, sampleRate, 80, 160);

  // Detect peaks (beats)
  const peaks = findPeaks(filteredData, sampleRate);

  // Calculate intervals between peaks
  const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);

  // Find most common interval
  const avgInterval = findMostCommonInterval(intervals);

  // Convert to BPM
  const bpm = (60 * sampleRate) / avgInterval;

  // Round to nearest whole BPM
  return Math.round(bpm);
}

// Alternative: Use ML-based BPM detection
import { getBPM } from 'web-audio-beat-detector';

async function detectBPMWithML(audioBuffer: AudioBuffer): Promise<number> {
  const { bpm } = await getBPM(audioBuffer);
  return Math.round(bpm);
}
```

### Time Stretching
```typescript
// Using SoundTouchJS for time stretching without pitch change
import { SoundTouch, SimpleFilter, WebAudioBufferSource } from 'soundtouchjs';

class TimeStretchPlayer {
  private soundTouch: SoundTouch;
  private audioContext: AudioContext;
  private scriptProcessor: ScriptProcessorNode;

  constructor() {
    this.audioContext = new AudioContext();
    this.soundTouch = new SoundTouch();
  }

  setTempo(originalBPM: number, targetBPM: number): void {
    // Calculate tempo ratio
    const tempoRatio = targetBPM / originalBPM;

    // SoundTouch uses tempo change as percentage
    // tempo = 1.0 means no change, 1.1 means 10% faster
    this.soundTouch.tempo = tempoRatio;

    // Optionally adjust pitch to maintain original pitch
    // pitch = 1.0 / tempo would maintain original pitch
    this.soundTouch.pitch = 1.0; // Keep original pitch
  }

  async play(audioBuffer: AudioBuffer, startTime: number = 0): Promise<void> {
    const source = new WebAudioBufferSource(audioBuffer);
    const filter = new SimpleFilter(source, this.soundTouch);

    // Create script processor for real-time processing
    const bufferSize = 4096;
    this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 2, 2);

    this.scriptProcessor.onaudioprocess = (e) => {
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      const samples = filter.extract(outL, bufferSize);

      if (samples === 0) {
        // End of track
        this.scriptProcessor.disconnect();
      }
    };

    this.scriptProcessor.connect(this.audioContext.destination);
  }
}
```

### Beat-Synced Crossfade
```typescript
interface TrackBeatInfo {
  bpm: number;
  beatInterval: number; // seconds per beat
  firstBeatTime: number; // time of first beat in track
}

class DJModeTransition {
  calculateCrossfadeStart(
    currentTrack: TrackBeatInfo,
    currentTime: number,
    duration: number,
    crossfadeBeats: number
  ): number {
    // Calculate crossfade duration in seconds
    const crossfadeDuration = crossfadeBeats * currentTrack.beatInterval;

    // Calculate when crossfade should start
    const crossfadeStart = duration - crossfadeDuration;

    // Find nearest beat boundary before crossfade start
    const beatsSinceStart = Math.floor(
      (crossfadeStart - currentTrack.firstBeatTime) / currentTrack.beatInterval
    );
    const nearestBeatTime =
      currentTrack.firstBeatTime + beatsSinceStart * currentTrack.beatInterval;

    return nearestBeatTime;
  }

  calculateNextTrackStartPosition(
    currentTrack: TrackBeatInfo,
    nextTrack: TrackBeatInfo,
    crossfadeBeats: number
  ): number {
    // Start next track at a beat boundary
    // Usually at the intro, which might be 8 or 16 beats before vocals
    return nextTrack.firstBeatTime;
  }
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Store BPM data
- **New services:**
  - `backend/src/services/bpm-analysis.service.ts` - Server-side BPM detection
- **New endpoints:**
  - `GET /api/media/:id/bpm` - Get BPM for a track
  - `POST /api/media/:id/analyze-bpm` - Trigger BPM analysis

### Database Changes
```prisma
model Media {
  // ... existing fields

  // DJ mode metadata
  bpm           Float?    // Beats per minute
  firstBeatMs   Int?      // Milliseconds to first beat
  analyzedAt    DateTime? // When BPM was analyzed
}
```

## Dependencies
- **Requires:**
  - Similar Songs (audio analysis infrastructure)
  - Crossfade (basic crossfade implementation)
- **Blocks:** None

## Libraries

| Library | Purpose | Size |
|---------|---------|------|
| soundtouchjs | Time stretching | ~50KB |
| web-audio-beat-detector | BPM detection | ~20KB |
| essentia.js | Advanced beat analysis | ~2MB |

## Algorithm Flow

```
1. Detect BPM of current track (on import or first play)
2. When approaching end of track:
   a. Get next track's BPM
   b. Calculate tempo difference
   c. If within tolerance: time-stretch next track to match
   d. If outside tolerance: skip to next track or use normal crossfade
3. Calculate beat-aligned crossfade start time
4. Start next track at beat boundary
5. Crossfade for specified number of beats
6. Transition target BPM to new track's tempo
```

## UI Design

### DJ Mode Panel
```
┌─────────────────────────────────────┐
│ DJ Mode                    [ON/OFF] │
├─────────────────────────────────────┤
│ Current: "Song Name"                │
│          128 BPM                    │
│                                     │
│ Next: "Next Song"                   │
│       126 BPM → 128 BPM (+1.6%)    │
│                                     │
│ Transition in: 32 beats             │
│                                     │
│ Crossfade: [4] [8] [16] beats      │
│ Tolerance: ○────●────○  6%         │
└─────────────────────────────────────┘
```

## Notes
- BPM detection should happen during import (background job)
- Consider doubling/halving BPM for compatibility (64 BPM ≈ 128 BPM)
- Time stretching beyond 10% starts to sound unnatural
- May want to analyze track structure (intro, drop, outro) for better transitions
- Consider energy matching in addition to BPM matching
- Could add manual BPM tap-to-set for tracks with wrong detection
- May conflict with gapless playback mode

# Feature: Gapless Playback

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Seamless album playback without any audible gaps or clicks between tracks. Essential for live albums, classical music, concept albums, and DJ mixes where tracks flow continuously into each other.

## User Stories
- As a user listening to live albums, I want tracks to play seamlessly so that the concert experience isn't interrupted
- As a user listening to classical music, I want no gaps between movements so that the musical flow is preserved
- As a user listening to mix albums, I want gapless playback so that DJ mixes sound continuous
- As a user, I want gapless playback to work automatically without configuration

## Acceptance Criteria
- [ ] Zero audible gap between consecutive tracks
- [ ] No audio glitches, clicks, or pops at track boundaries
- [ ] Works with common audio formats (MP3, AAC, FLAC, WAV)
- [ ] Automatic for sequential album playback
- [ ] Works with queue and playlist playback
- [ ] Handles MP3 encoder delay/padding automatically
- [ ] Preloads next track in advance
- [ ] Falls back gracefully if gapless isn't possible

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add preloading and gapless logic
  - `frontend/src/components/Player/` - Update player for gapless support
- **New components:**
  - `frontend/src/hooks/useGaplessPlayback.ts` - Gapless playback logic
  - `frontend/src/services/audioBuffer.ts` - Audio buffer management
- **State changes:**
  - Add `nextTrackPreloaded: boolean`
  - Add `gaplessEnabled: boolean`

### Understanding MP3 Gaps
```
MP3 files have encoder delay and padding that cause gaps:

Original Audio:  [====AUDIO CONTENT====]
MP3 Encoded:     [PAD][====AUDIO====][PAD]
                  ^                    ^
                  Encoder delay        Padding

To achieve gapless:
1. Read LAME/iTunes gapless metadata
2. Calculate exact sample positions
3. Trim padding when decoding
```

### Web Audio API Implementation
```typescript
class GaplessPlayer {
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextBuffer: AudioBuffer | null = null;
  private nextStartTime: number = 0;

  constructor() {
    this.audioContext = new AudioContext();
  }

  async playTrack(url: string, startImmediately = true): Promise<void> {
    const buffer = await this.loadAudioBuffer(url);

    // Trim encoder padding if present
    const trimmedBuffer = this.trimEncoderPadding(buffer, url);

    const source = this.audioContext.createBufferSource();
    source.buffer = trimmedBuffer;
    source.connect(this.audioContext.destination);

    if (startImmediately) {
      source.start(0);
      this.currentSource = source;
    }

    return trimmedBuffer;
  }

  async preloadNext(url: string): Promise<void> {
    const buffer = await this.loadAudioBuffer(url);
    this.nextBuffer = this.trimEncoderPadding(buffer, url);
  }

  scheduleNext(): void {
    if (!this.nextBuffer || !this.currentSource) return;

    // Calculate when current track ends
    const currentEndTime =
      this.audioContext.currentTime +
      (this.currentSource.buffer!.duration - this.currentSource.context.currentTime);

    // Schedule next track to start exactly when current ends
    const nextSource = this.audioContext.createBufferSource();
    nextSource.buffer = this.nextBuffer;
    nextSource.connect(this.audioContext.destination);
    nextSource.start(currentEndTime);

    this.currentSource.onended = () => {
      this.currentSource = nextSource;
    };
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private trimEncoderPadding(buffer: AudioBuffer, url: string): AudioBuffer {
    // Read gapless metadata from file
    const metadata = this.getGaplessMetadata(url);
    if (!metadata) return buffer;

    const { encoderDelay, encoderPadding } = metadata;
    const sampleRate = buffer.sampleRate;

    // Calculate sample positions
    const startSample = encoderDelay;
    const endSample = buffer.length - encoderPadding;
    const newLength = endSample - startSample;

    // Create new buffer with trimmed content
    const trimmedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const originalData = buffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      for (let i = 0; i < newLength; i++) {
        trimmedData[i] = originalData[startSample + i];
      }
    }

    return trimmedBuffer;
  }

  private getGaplessMetadata(url: string): GaplessMetadata | null {
    // Would need to read from:
    // - MP3: LAME header or iTunes gapless atoms
    // - AAC: iTunSMPB atom
    // - FLAC: No padding issues
    return null; // Implement based on format
  }
}
```

### Alternative: Media Source Extensions
```typescript
// Using MSE for more control over playback
class MSEGaplessPlayer {
  private mediaSource: MediaSource;
  private sourceBuffer: SourceBuffer;
  private audio: HTMLAudioElement;

  constructor() {
    this.audio = document.createElement('audio');
    this.mediaSource = new MediaSource();
    this.audio.src = URL.createObjectURL(this.mediaSource);

    this.mediaSource.addEventListener('sourceopen', () => {
      this.sourceBuffer = this.mediaSource.addSourceBuffer('audio/mpeg');
    });
  }

  async appendTrack(url: string): Promise<void> {
    const response = await fetch(url);
    const data = await response.arrayBuffer();

    // Remove encoder padding from data
    const trimmedData = this.trimPadding(data);

    // Append to source buffer
    this.sourceBuffer.appendBuffer(trimmedData);
  }

  async queueNext(url: string): Promise<void> {
    await new Promise(resolve =>
      this.sourceBuffer.addEventListener('updateend', resolve, { once: true })
    );
    await this.appendTrack(url);
  }
}
```

### Backend Changes
- **New endpoints:**
  - `GET /api/media/:id/gapless-info` - Return encoder delay/padding info
- **New services:**
  - `backend/src/services/audio-metadata.service.ts` - Extract gapless metadata

### Database Changes
```prisma
model Media {
  // ... existing fields

  // Gapless playback metadata
  encoderDelay    Int?      // Samples of encoder delay
  encoderPadding  Int?      // Samples of encoder padding
  sampleRate      Int?      // Audio sample rate
  totalSamples    BigInt?   // Total samples in file
}
```

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** None
- **Conflicts with:** Crossfade (mutually exclusive)

## Format Support

| Format | Gapless Support | Metadata Location |
|--------|-----------------|-------------------|
| MP3 | Requires metadata | LAME header, iTunSMPB |
| AAC | Requires metadata | iTunSMPB atom |
| FLAC | Native | No padding issues |
| WAV | Native | No padding issues |
| OGG | Requires metadata | Vorbis comment |

## Challenges
1. **MP3 frame padding:** Every MP3 has encoder delay and padding
2. **Buffering:** Must preload without impacting performance
3. **Seeking:** Need to handle seeks near track boundaries
4. **Memory:** Full audio buffers consume significant RAM
5. **Browser support:** Web Audio API varies across browsers

## Notes
- FLAC and WAV don't have encoder padding, making them naturally gapless
- Consider hybrid approach: Web Audio for gapless-critical, HTML5 audio for others
- May need server-side processing to extract/inject gapless metadata
- Could add visual indicator for gapless-capable track sequences
- Should disable gapless when crossfade is enabled

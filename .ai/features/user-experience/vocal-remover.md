# Feature: Vocal Remover

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
AI-powered karaoke mode that removes or isolates vocals from songs in real-time. Uses local ML models (like Demucs or Spleeter) to separate vocals from instrumental tracks, enabling sing-along experiences.

## User Stories
- As a user, I want to remove vocals from songs so that I can sing along karaoke-style
- As a user, I want to isolate just the vocals so that I can hear the singing more clearly
- As a user, I want vocal removal to work in real-time so that I don't have to wait for processing
- As a user, I want to adjust the vocal/instrumental balance so that I can have some vocal guidance

## Acceptance Criteria
- [ ] "Karaoke Mode" toggle that removes vocals in real-time
- [ ] Slider to blend between full vocals and instrumental only
- [ ] "Isolate Vocals" option to hear only vocals
- [ ] Processing happens locally without internet
- [ ] Acceptable audio quality (minimal artifacts)
- [ ] Works with any song in library
- [ ] Option to save separated tracks as new files
- [ ] Visual indicator when karaoke mode is active

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add karaoke mode state
  - `frontend/src/components/Player/` - Add karaoke controls
- **New components:**
  - `frontend/src/components/Player/KaraokeMode.tsx` - Karaoke toggle and controls
  - `frontend/src/components/Player/VocalSlider.tsx` - Vocal/instrumental blend slider
  - `frontend/src/workers/sourceSeperationWorker.ts` - Web Worker for ML inference
- **State changes:**
  - Add `karaokeMode: 'off' | 'instrumental' | 'vocals'`
  - Add `vocalBalance: number` (0 = instrumental only, 1 = full mix)

### Source Separation Models

#### Option 1: Demucs (Recommended)
```typescript
// Using demucs compiled to WebAssembly
// Model size: ~80MB for lightweight version

import { Demucs } from 'demucs-wasm';

const demucs = await Demucs.create({
  model: 'htdemucs_ft', // Fine-tuned hybrid model
  workers: 4
});

// Separate audio into stems
const stems = await demucs.separate(audioBuffer);
// stems = { vocals, drums, bass, other }

// For karaoke: play everything except vocals
const instrumental = mixStems([stems.drums, stems.bass, stems.other]);
```

#### Option 2: Spleeter
```typescript
// Using spleeter via ONNX runtime
// Lighter weight but lower quality

import * as ort from 'onnxruntime-web';

const session = await ort.InferenceSession.create('spleeter-2stems.onnx');
const result = await session.run({ audio: audioTensor });
const vocals = result.vocals;
const accompaniment = result.accompaniment;
```

### Real-Time Processing Pipeline
```typescript
// Process audio in chunks for real-time playback
class VocalRemover {
  private audioContext: AudioContext;
  private sourceNode: MediaElementAudioSourceNode;
  private workletNode: AudioWorkletNode;

  async setup(audioElement: HTMLAudioElement) {
    this.audioContext = new AudioContext();
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

    // Load audio worklet for real-time processing
    await this.audioContext.audioWorklet.addModule('vocal-remover-processor.js');
    this.workletNode = new AudioWorkletNode(
      this.audioContext,
      'vocal-remover-processor'
    );

    // Connect: source -> processor -> destination
    this.sourceNode.connect(this.workletNode);
    this.workletNode.connect(this.audioContext.destination);
  }

  setMode(mode: 'off' | 'instrumental' | 'vocals') {
    this.workletNode.port.postMessage({ mode });
  }

  setVocalBalance(balance: number) {
    this.workletNode.port.postMessage({ vocalBalance: balance });
  }
}
```

### Pre-Processing Approach (Alternative)
```typescript
// For better quality: pre-process entire song before playback
async function preprocessForKaraoke(mediaId: string): Promise<void> {
  const audioUrl = `/api/media/${mediaId}/stream`;
  const response = await fetch(audioUrl);
  const audioBuffer = await response.arrayBuffer();

  // Run separation in Web Worker
  const worker = new Worker('sourceSeperationWorker.ts');
  worker.postMessage({ audioBuffer });

  const { vocals, instrumental } = await new Promise(resolve => {
    worker.onmessage = (e) => resolve(e.data);
  });

  // Cache separated stems
  await cacheAudioStem(mediaId, 'vocals', vocals);
  await cacheAudioStem(mediaId, 'instrumental', instrumental);
}
```

### Backend Changes
- **New endpoints:**
  - `POST /api/media/:id/separate` - Trigger server-side separation
  - `GET /api/media/:id/stems/:stem` - Get separated stem (vocals/instrumental)
- **New services:**
  - `backend/src/services/source-separation.service.ts` - Run Demucs/Spleeter

### Database Changes
```prisma
model MediaStem {
  id          String   @id @default(cuid())
  mediaId     String
  media       Media    @relation(fields: [mediaId], references: [id])
  stemType    String   // 'vocals', 'instrumental', 'drums', 'bass', 'other'
  filePath    String   // Path to separated audio file
  createdAt   DateTime @default(now())

  @@unique([mediaId, stemType])
}
```

## Dependencies
- **Requires:**
  - Core player with Web Audio API integration
  - Sufficient client-side compute (CPU/GPU)
- **Blocks:** None

## Quality vs Performance Trade-offs

| Approach | Quality | Latency | CPU Usage |
|----------|---------|---------|-----------|
| Real-time (simple) | Low | None | Medium |
| Real-time (ML) | Medium | 100-500ms | High |
| Pre-processed | High | Initial wait | Low during playback |

## Recommended Implementation

### Phase 1: Pre-processed Separation
1. Server-side Demucs processing
2. Store separated stems as files
3. Frontend switches between original and stems

### Phase 2: Real-time Light
1. Simple spectral-based vocal reduction (not ML)
2. Lower quality but instant
3. Good for preview/testing

### Phase 3: Real-time ML (Future)
1. Optimized WebAssembly model
2. GPU acceleration via WebGL/WebGPU
3. Chunked processing for streaming

## Notes
- Demucs v4 produces excellent quality but is computationally expensive
- Consider offering quality presets (Fast/Balanced/Quality)
- Could extend to full stem separation (drums, bass, other)
- Separated stems could be used for remixing features
- May need to handle songs that are already instrumental
- Consider GPU acceleration for faster processing
- Privacy advantage: no audio sent to external services

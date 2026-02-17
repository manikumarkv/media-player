# Feature: Local AI Search

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Local AI-powered search using on-device models for voice search (Whisper) and semantic search (embeddings). No cloud LLM APIs required - all processing happens locally for privacy and offline capability.

## User Stories
- As a user, I want to search by voice so that I can find songs hands-free
- As a user, I want to search by description so that I can find songs when I don't remember the exact title ("that upbeat song from the 80s")
- As a user, I want all AI features to work offline so that my music search doesn't depend on internet
- As a user, I want my search data to stay private so that my listening habits aren't sent to external services

## Acceptance Criteria
- [ ] Voice-to-text search using local Whisper model
- [ ] Semantic search using local embeddings model
- [ ] Works completely offline after initial model download
- [ ] Voice search triggered by microphone button or hotkey
- [ ] Search results ranked by semantic similarity
- [ ] Reasonable performance on consumer hardware (< 2s response)
- [ ] Clear indication when AI models are processing
- [ ] Fallback to text search if AI unavailable
- [ ] Model download progress indicator

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Search/` - Add AI search capabilities
  - `frontend/src/stores/` - Add AI/ML state management
- **New components:**
  - `frontend/src/components/Search/VoiceSearchButton.tsx` - Mic button for voice input
  - `frontend/src/components/Search/SemanticSearchInput.tsx` - Enhanced search with AI
  - `frontend/src/components/Settings/AIModelsSettings.tsx` - Model management UI
  - `frontend/src/workers/whisperWorker.ts` - Web Worker for Whisper inference
  - `frontend/src/workers/embeddingWorker.ts` - Web Worker for embeddings
- **State changes:**
  - Add `aiModelsLoaded: boolean`
  - Add `isTranscribing: boolean`
  - Add `isEmbedding: boolean`

### AI Models

#### Voice Search (Whisper)
```typescript
// Using whisper.cpp compiled to WebAssembly or transformers.js
import { pipeline } from '@xenova/transformers';

// Load Whisper tiny model (~40MB)
const transcriber = await pipeline(
  'automatic-speech-recognition',
  'Xenova/whisper-tiny'
);

// Transcribe audio
const result = await transcriber(audioBlob);
const searchQuery = result.text;
```

#### Semantic Embeddings
```typescript
// Using sentence-transformers via transformers.js
import { pipeline } from '@xenova/transformers';

// Load embedding model (~30MB)
const embedder = await pipeline(
  'feature-extraction',
  'Xenova/all-MiniLM-L6-v2'
);

// Generate embedding for search query
const queryEmbedding = await embedder(searchQuery, {
  pooling: 'mean',
  normalize: true
});

// Compare with pre-computed song embeddings using cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Add embedding generation on import
- **New services:**
  - `backend/src/services/embedding.service.ts` - Generate and store song embeddings
- **New endpoints:**
  - `GET /api/search/semantic?q=query` - Semantic search endpoint
  - `POST /api/media/:id/embed` - Generate embedding for a song

### Database Changes
```prisma
model Media {
  // ... existing fields
  embedding     Float[]?  // 384-dim embedding vector
  embeddingText String?   // Text used to generate embedding (title + artist + album)
}
```

### Embedding Pipeline
```typescript
// On media import, generate embedding from metadata
async function generateMediaEmbedding(media: Media): Promise<number[]> {
  const text = `${media.title} ${media.artist} ${media.album}`.trim();

  // Use transformers.js or call to local Python service
  const embedding = await embedder(text, {
    pooling: 'mean',
    normalize: true
  });

  return Array.from(embedding.data);
}
```

### Voice Recording
```typescript
// VoiceSearchButton.tsx
async function startVoiceSearch() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = async () => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
    const text = await transcriber(audioBlob);
    setSearchQuery(text);
    performSearch(text);
  };

  recorder.start();
  // Stop after 5 seconds or on button release
  setTimeout(() => recorder.stop(), 5000);
}
```

## Dependencies
- **Requires:**
  - Basic search functionality exists
  - transformers.js library
- **Blocks:** Similar Songs feature (uses same embedding infrastructure)

## Model Sizes & Performance

| Model | Size | Load Time | Inference Time |
|-------|------|-----------|----------------|
| Whisper Tiny | ~40MB | ~2s | ~1s per 10s audio |
| all-MiniLM-L6-v2 | ~30MB | ~1s | ~50ms per query |

## Implementation Phases

### Phase 1: Embedding Infrastructure
1. Add embedding column to database
2. Create embedding service on backend
3. Generate embeddings on media import
4. Basic semantic search endpoint

### Phase 2: Frontend Integration
1. Enhanced search UI with semantic option
2. Display semantic search results
3. Settings for AI features

### Phase 3: Voice Search
1. Voice recording component
2. Whisper integration
3. Voice-to-search pipeline

## Notes
- transformers.js runs models in WebAssembly, works offline after download
- Models are cached in IndexedDB after first download
- Consider running inference in Web Workers to avoid UI blocking
- May need to batch embedding generation for large libraries
- Could extend to search within lyrics if lyrics feature is implemented
- Consider adding "feeling lucky" mode that plays most similar song
- Privacy advantage: no data leaves the device

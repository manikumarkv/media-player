# Feature: Similar Songs

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Local ML-powered feature that finds similar tracks in your library based on audio features and embeddings. Creates personalized "radio" stations and "more like this" recommendations without requiring internet or external APIs.

## User Stories
- As a user, I want to find songs similar to one I'm enjoying so that I can discover more music I'll like in my library
- As a user, I want to start a radio station from any song so that I get a continuous playlist of similar music
- As a user, I want the similar songs feature to work offline so that recommendations don't require internet
- As a user, I want to understand why songs are considered similar so that I can trust the recommendations

## Acceptance Criteria
- [ ] "Find Similar" button/option on any song
- [ ] Display top 10-20 similar songs with similarity score
- [ ] "Start Radio" mode that auto-queues similar songs
- [ ] Works completely offline using local analysis
- [ ] Similarity based on multiple factors (audio features, metadata, embeddings)
- [ ] Explanations for why songs match ("Similar tempo", "Same genre")
- [ ] Results appear within 1 second
- [ ] Option to exclude songs already in queue

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/SongContextMenu.tsx` - Add "Find Similar" option
  - `frontend/src/components/Player/` - Add "Start Radio" option
- **New components:**
  - `frontend/src/components/Library/SimilarSongs.tsx` - Similar songs panel/modal
  - `frontend/src/components/Player/RadioMode.tsx` - Radio mode indicator and controls
  - `frontend/src/components/Library/SimilarityBadge.tsx` - Shows why songs match
- **State changes:**
  - Add `radioMode: { enabled: boolean, seedSongId: string | null }` to player store
  - Add `similarSongsCache: Map<string, SimilarSong[]>` for caching results

### Audio Feature Extraction
```typescript
// Features extracted from audio for similarity matching
interface AudioFeatures {
  tempo: number;           // BPM
  energy: number;          // 0-1, loudness/intensity
  danceability: number;    // 0-1, rhythm stability
  valence: number;         // 0-1, musical positivity
  acousticness: number;    // 0-1, acoustic vs electronic
  speechiness: number;     // 0-1, presence of vocals/speech
  key: number;             // 0-11, musical key
  mode: number;            // 0 (minor) or 1 (major)
  duration: number;        // seconds
}

// Extract features using Web Audio API
async function extractAudioFeatures(audioUrl: string): Promise<AudioFeatures> {
  const audioContext = new AudioContext();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Analyze tempo using autocorrelation
  const tempo = await detectTempo(audioBuffer);

  // Analyze energy using RMS
  const energy = calculateRMS(audioBuffer);

  // ... more feature extraction

  return { tempo, energy, /* ... */ };
}
```

### Similarity Calculation
```typescript
interface SimilarSong {
  mediaId: string;
  score: number;           // 0-1 overall similarity
  reasons: SimilarityReason[];
}

interface SimilarityReason {
  factor: string;          // "tempo", "genre", "artist", "embedding"
  contribution: number;    // How much this factor contributed
  detail: string;          // "Both ~120 BPM"
}

function calculateSimilarity(
  source: MediaWithFeatures,
  candidate: MediaWithFeatures
): SimilarSong {
  const reasons: SimilarityReason[] = [];
  let totalScore = 0;
  let weights = 0;

  // Embedding similarity (highest weight)
  if (source.embedding && candidate.embedding) {
    const embeddingSim = cosineSimilarity(source.embedding, candidate.embedding);
    totalScore += embeddingSim * 0.4;
    weights += 0.4;
    reasons.push({
      factor: 'embedding',
      contribution: embeddingSim,
      detail: 'Similar overall sound'
    });
  }

  // Tempo similarity
  const tempoDiff = Math.abs(source.features.tempo - candidate.features.tempo);
  const tempoSim = Math.max(0, 1 - tempoDiff / 30); // 30 BPM tolerance
  totalScore += tempoSim * 0.2;
  weights += 0.2;
  if (tempoSim > 0.7) {
    reasons.push({
      factor: 'tempo',
      contribution: tempoSim,
      detail: `Both ~${Math.round(candidate.features.tempo)} BPM`
    });
  }

  // Same artist bonus
  if (source.artist === candidate.artist) {
    totalScore += 0.15;
    weights += 0.15;
    reasons.push({
      factor: 'artist',
      contribution: 1,
      detail: `Same artist: ${source.artist}`
    });
  }

  // Energy similarity
  const energyDiff = Math.abs(source.features.energy - candidate.features.energy);
  const energySim = 1 - energyDiff;
  totalScore += energySim * 0.15;
  weights += 0.15;

  // Key compatibility
  const keyCompat = getKeyCompatibility(source.features.key, candidate.features.key);
  totalScore += keyCompat * 0.1;
  weights += 0.1;

  return {
    mediaId: candidate.id,
    score: totalScore / weights,
    reasons: reasons.filter(r => r.contribution > 0.6).slice(0, 3)
  };
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Add feature storage
- **New services:**
  - `backend/src/services/similarity.service.ts` - Similarity calculations
  - `backend/src/services/audio-analysis.service.ts` - Extract audio features
- **New endpoints:**
  - `GET /api/media/:id/similar` - Get similar songs
  - `POST /api/media/:id/analyze` - Trigger audio analysis

### Database Changes
```prisma
model Media {
  // ... existing fields
  embedding       Float[]?        // From Local AI Search feature

  // Audio features
  tempo           Float?
  energy          Float?
  danceability    Float?
  valence         Float?
  acousticness    Float?
  speechiness     Float?
  musicalKey      Int?
  mode            Int?

  analyzedAt      DateTime?       // When analysis was performed
}
```

### Radio Mode Logic
```typescript
// Auto-queue similar songs when current track ends
function radioModeNextTrack(currentSong: Media, library: Media[]): Media {
  const similarSongs = findSimilarSongs(currentSong, library, {
    limit: 20,
    excludeIds: getRecentlyPlayedIds(10),
    minScore: 0.5
  });

  // Pick randomly from top 5 to add variety
  const topCandidates = similarSongs.slice(0, 5);
  const nextSong = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  return nextSong;
}
```

## Dependencies
- **Requires:** Local AI Search (for embedding infrastructure)
- **Blocks:** None

## Feature Extraction Library Options
1. **Meyda** - JavaScript audio feature extraction library
2. **Essentia.js** - WASM port of Essentia audio analysis
3. **Custom Web Audio API** - DIY feature extraction

## Performance Considerations
- Pre-compute features on media import (background job)
- Cache similarity results for frequently accessed songs
- Use approximate nearest neighbor search for large libraries
- Index embeddings for fast vector search

## Notes
- Consider adding "Why this song?" tooltip on hover
- Could learn from user skips to improve recommendations
- May integrate with Smart Playlists feature
- Consider showing similarity as percentage or stars
- Radio mode should avoid repeating songs too soon
- Could add "mood" seeds in addition to song seeds

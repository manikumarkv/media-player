# Feature: Multi-Source Download

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Download audio from multiple sources beyond YouTube, including Spotify (via YouTube search), SoundCloud, Bandcamp, and other platforms supported by yt-dlp. Provides a unified download experience across platforms.

## User Stories
- As a user, I want to download from SoundCloud so that I can get tracks not on YouTube
- As a user, I want to paste any music URL and have it work so that I don't have to think about which service
- As a user, I want to download Bandcamp purchases so that I can have offline copies of music I bought
- As a user, I want to search Spotify and download matching tracks so that I can build my library from Spotify discoveries

## Acceptance Criteria
- [ ] Auto-detect source from URL
- [ ] Support: YouTube, SoundCloud, Bandcamp, Vimeo, Twitter/X
- [ ] Spotify URL → search and download from YouTube
- [ ] Show source icon/badge on downloads
- [ ] Quality options per source (where applicable)
- [ ] Handle authentication for SoundCloud Go+, Bandcamp purchases
- [ ] Error handling for unsupported sources
- [ ] Unified progress tracking

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Download/DownloadDialog.tsx` - Update for multi-source
- **New components:**
  - `frontend/src/components/Download/SourceDetector.tsx` - Show detected source
  - `frontend/src/components/Download/SourceBadge.tsx` - Source icon/badge
  - `frontend/src/components/Download/SpotifySearch.tsx` - Spotify link handler
- **State changes:**
  - Add `source` to download items

### Source Detection
```typescript
// sourceDetector.ts
type Source =
  | 'youtube'
  | 'soundcloud'
  | 'bandcamp'
  | 'spotify'
  | 'vimeo'
  | 'twitter'
  | 'unknown';

interface DetectedSource {
  source: Source;
  icon: string;
  name: string;
  directDownload: boolean;  // false for Spotify
  requiresAuth: boolean;
}

function detectSource(url: string): DetectedSource {
  const patterns: Record<Source, RegExp> = {
    youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//,
    soundcloud: /^(https?:\/\/)?(www\.)?soundcloud\.com\//,
    bandcamp: /^(https?:\/\/)?[\w-]+\.bandcamp\.com\//,
    spotify: /^(https?:\/\/)?(open\.)?spotify\.com\//,
    vimeo: /^(https?:\/\/)?(www\.)?vimeo\.com\//,
    twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\//,
    unknown: /.*/
  };

  for (const [source, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return getSourceInfo(source as Source);
    }
  }

  return getSourceInfo('unknown');
}

function getSourceInfo(source: Source): DetectedSource {
  const info: Record<Source, DetectedSource> = {
    youtube: {
      source: 'youtube',
      icon: '📺',
      name: 'YouTube',
      directDownload: true,
      requiresAuth: false
    },
    soundcloud: {
      source: 'soundcloud',
      icon: '🔶',
      name: 'SoundCloud',
      directDownload: true,
      requiresAuth: false  // true for Go+ tracks
    },
    bandcamp: {
      source: 'bandcamp',
      icon: '🎵',
      name: 'Bandcamp',
      directDownload: true,
      requiresAuth: true  // for purchased content
    },
    spotify: {
      source: 'spotify',
      icon: '🟢',
      name: 'Spotify',
      directDownload: false,  // will search YouTube
      requiresAuth: false
    },
    vimeo: {
      source: 'vimeo',
      icon: '▶️',
      name: 'Vimeo',
      directDownload: true,
      requiresAuth: false
    },
    twitter: {
      source: 'twitter',
      icon: '🐦',
      name: 'Twitter/X',
      directDownload: true,
      requiresAuth: false
    },
    unknown: {
      source: 'unknown',
      icon: '🔗',
      name: 'Unknown',
      directDownload: true,  // let yt-dlp try
      requiresAuth: false
    }
  };

  return info[source];
}
```

### Spotify to YouTube Search
```typescript
// SpotifySearch.tsx
async function handleSpotifyUrl(url: string): Promise<DownloadResult> {
  // Extract track info from Spotify
  const spotifyInfo = await api.post('/api/download/spotify/info', { url });

  const { title, artist, album, duration } = spotifyInfo.data;

  // Search YouTube for matching track
  const searchQuery = `${artist} ${title} official audio`;
  const searchResults = await api.get('/api/search/youtube', {
    params: { q: searchQuery }
  });

  // Find best match based on title similarity and duration
  const bestMatch = findBestMatch(searchResults.data, {
    title,
    artist,
    duration
  });

  if (!bestMatch) {
    throw new Error('Could not find matching track on YouTube');
  }

  // Download from YouTube
  return api.post('/api/download', {
    url: `https://youtube.com/watch?v=${bestMatch.videoId}`,
    metadata: {
      title,
      artist,
      album,
      source: 'spotify'
    }
  });
}

function findBestMatch(
  results: YouTubeSearchResult[],
  target: { title: string; artist: string; duration: number }
): YouTubeSearchResult | null {
  let bestScore = 0;
  let bestMatch: YouTubeSearchResult | null = null;

  for (const result of results) {
    let score = 0;

    // Title similarity
    score += stringSimilarity(
      normalize(result.title),
      normalize(`${target.artist} ${target.title}`)
    ) * 50;

    // Duration match (within 10 seconds)
    const durationDiff = Math.abs(result.duration - target.duration);
    if (durationDiff < 10) {
      score += (1 - durationDiff / 10) * 30;
    }

    // Bonus for official channels, "official audio" in title
    if (result.title.toLowerCase().includes('official')) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = result;
    }
  }

  // Require minimum confidence
  return bestScore > 60 ? bestMatch : null;
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/download.service.ts` - Add multi-source support
- **New services:**
  - `backend/src/services/source-handlers/` - Source-specific handlers
- **New endpoints:**
  - `POST /api/download/spotify/info` - Get Spotify track info
  - `GET /api/search/youtube` - Search YouTube for track

### Multi-Source Download Service
```typescript
// download.service.ts
class DownloadService {
  async download(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    const source = detectSource(url);

    switch (source.source) {
      case 'spotify':
        return this.handleSpotifyUrl(url, options);
      case 'soundcloud':
        return this.handleSoundCloudUrl(url, options);
      case 'bandcamp':
        return this.handleBandcampUrl(url, options);
      default:
        return this.handleYtDlpUrl(url, options);
    }
  }

  private async handleSpotifyUrl(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    // Get track info from Spotify API (or web scraping)
    const trackInfo = await this.getSpotifyTrackInfo(url);

    // Search YouTube
    const searchQuery = `${trackInfo.artist} ${trackInfo.title}`;
    const ytResults = await this.searchYouTube(searchQuery);

    // Find best match
    const match = this.findBestYouTubeMatch(ytResults, trackInfo);
    if (!match) {
      throw new DownloadError('NO_MATCH', 'Could not find matching track on YouTube');
    }

    // Download from YouTube with Spotify metadata
    return this.downloadWithYtDlp(
      `https://youtube.com/watch?v=${match.id}`,
      {
        ...options,
        metadata: {
          title: trackInfo.title,
          artist: trackInfo.artist,
          album: trackInfo.album,
          albumArt: trackInfo.albumArt,
          source: 'spotify'
        }
      }
    );
  }

  private async handleSoundCloudUrl(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    // yt-dlp supports SoundCloud directly
    return this.downloadWithYtDlp(url, {
      ...options,
      source: 'soundcloud',
      // SoundCloud-specific options
      extractorArgs: {
        soundcloud: {
          // Use OAuth token if available for Go+ tracks
          oauth_token: options?.soundcloudToken
        }
      }
    });
  }

  private async handleBandcampUrl(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    // Bandcamp may require cookies for purchased content
    return this.downloadWithYtDlp(url, {
      ...options,
      source: 'bandcamp',
      cookies: options?.bandcampCookies
    });
  }

  private async downloadWithYtDlp(url: string, options?: DownloadOptions): Promise<DownloadResult> {
    const outputPath = this.generateOutputPath();

    const args = [
      '-x',
      '--audio-format', options?.format || 'mp3',
      '--audio-quality', '0',
      '-o', outputPath,
      '--embed-thumbnail',
      '--add-metadata'
    ];

    if (options?.cookies) {
      args.push('--cookies', options.cookies);
    }

    args.push(url);

    await this.runYtDlp(args);

    // Apply custom metadata if provided
    if (options?.metadata) {
      await this.applyMetadata(outputPath, options.metadata);
    }

    return {
      path: outputPath,
      source: options?.source || 'unknown'
    };
  }
}
```

### Database Changes
```prisma
model Media {
  // ... existing fields
  source        String    @default("youtube")  // youtube, soundcloud, bandcamp, spotify
  sourceUrl     String?   // Original URL
}
```

## Dependencies
- **Requires:** yt-dlp (with all extractors)
- **Blocks:** Spotify Sync, SoundCloud Sync

## Supported Sources (via yt-dlp)

| Source | Direct Download | Notes |
|--------|-----------------|-------|
| YouTube | ✅ | Primary source |
| SoundCloud | ✅ | Some tracks may require Go+ |
| Bandcamp | ✅ | May need cookies for purchases |
| Vimeo | ✅ | Audio extraction |
| Twitter/X | ✅ | Video posts with audio |
| Spotify | ❌ | Search YouTube for match |
| Apple Music | ❌ | Would need similar search approach |

## Notes
- yt-dlp supports 1000+ sites, but we explicitly handle common music sources
- Consider caching Spotify→YouTube matches for reliability
- May want to show multiple YouTube matches for user selection
- Consider quality comparison between sources
- Handle region-restricted content gracefully
- May need to update yt-dlp periodically for extractor fixes

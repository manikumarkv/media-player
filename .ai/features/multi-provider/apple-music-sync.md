# Feature: Apple Music Sync

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Import playlists from Apple Music account. Since Apple Music doesn't allow direct downloads, finds and downloads matching tracks from YouTube. Enables users to migrate or sync their Apple Music library.

## User Stories
- As an Apple Music user, I want to import my playlists so that I can have offline copies not dependent on subscription
- As a user, I want to see my Apple Music library in the app so that I can choose what to download
- As a user switching from Apple Music, I want to migrate my playlists so that I don't lose my curation

## Acceptance Criteria
- [ ] MusicKit JS authentication
- [ ] View Apple Music playlists
- [ ] View recently played / heavy rotation
- [ ] Download tracks via YouTube matching
- [ ] Show match quality for verification
- [ ] Create local playlists from Apple Music playlists
- [ ] Handle Apple Music exclusive content

## Technical Approach

### Frontend Changes
- **New components:**
  - `frontend/src/components/Import/AppleMusicImport.tsx` - Main interface
  - `frontend/src/components/Import/AppleMusicPlaylists.tsx` - Playlists view
  - `frontend/src/components/Import/AppleMusicLibrary.tsx` - Library browser
- **State changes:**
  - Add Apple Music import state

### MusicKit JS Integration
```typescript
// appleMusicAuth.ts
// Note: Requires Apple Developer account and MusicKit credentials

declare const MusicKit: any;

async function initializeMusicKit(): Promise<void> {
  await MusicKit.configure({
    developerToken: process.env.APPLE_MUSIC_DEVELOPER_TOKEN,
    app: {
      name: 'Music Player',
      build: '1.0.0'
    }
  });
}

async function authenticateAppleMusic(): Promise<string> {
  const music = MusicKit.getInstance();
  await music.authorize();
  return music.musicUserToken;
}

async function getPlaylists(): Promise<AppleMusicPlaylist[]> {
  const music = MusicKit.getInstance();
  const response = await music.api.library.playlists();
  return response.data;
}

async function getPlaylistTracks(playlistId: string): Promise<AppleMusicTrack[]> {
  const music = MusicKit.getInstance();
  const response = await music.api.library.playlist(playlistId, {
    include: 'tracks'
  });
  return response.data.relationships.tracks.data;
}
```

### Apple Music Import Interface
```typescript
// AppleMusicImport.tsx
function AppleMusicImport() {
  const [authorized, setAuthorized] = useState(false);
  const [playlists, setPlaylists] = useState<AppleMusicPlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeMusicKit();
  }, []);

  const handleAuthorize = async () => {
    try {
      await authenticateAppleMusic();
      setAuthorized(true);
      loadPlaylists();
    } catch (error) {
      console.error('Apple Music authorization failed');
    }
  };

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const data = await getPlaylists();
      setPlaylists(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apple-music-import">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Import from Apple Music</h1>
        {!authorized && (
          <Button onClick={handleAuthorize}>
            <AppleMusicIcon className="mr-2" />
            Connect Apple Music
          </Button>
        )}
      </header>

      {authorized && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <AppleMusicPlaylists
              playlists={playlists}
              onImport={handleImportPlaylist}
            />
          )}
        </div>
      )}
    </div>
  );
}
```

### Apple Music Playlist Component
```typescript
// AppleMusicPlaylists.tsx
interface AppleMusicPlaylist {
  id: string;
  attributes: {
    name: string;
    description?: string;
    artwork?: { url: string };
    trackCount: number;
  };
}

function AppleMusicPlaylists({
  playlists,
  onImport
}: AppleMusicPlaylistsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {playlists.map(playlist => (
        <div
          key={playlist.id}
          className="bg-bg-secondary rounded-lg overflow-hidden"
        >
          <div className="aspect-square relative">
            {playlist.attributes.artwork ? (
              <img
                src={formatAppleMusicArtwork(playlist.attributes.artwork.url, 300)}
                className="w-full h-full object-cover"
                alt={playlist.attributes.name}
              />
            ) : (
              <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                <MusicIcon className="w-12 h-12 text-text-muted" />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="font-medium truncate">{playlist.attributes.name}</p>
            <p className="text-sm text-text-secondary">
              {playlist.attributes.trackCount} tracks
            </p>
            <Button
              size="sm"
              className="mt-2 w-full"
              onClick={() => onImport(playlist.id)}
            >
              Import
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAppleMusicArtwork(url: string, size: number): string {
  return url.replace('{w}', String(size)).replace('{h}', String(size));
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/apple-music.service.ts` - Apple Music API
- **New endpoints:**
  - `POST /api/apple-music/import/playlist/:id` - Import playlist

### Apple Music Service
```typescript
// apple-music.service.ts
class AppleMusicService {
  async importPlaylist(
    playlistId: string,
    userToken: string,
    onProgress: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    // Get tracks from Apple Music
    const tracks = await this.getPlaylistTracks(playlistId, userToken);

    const progress: ImportProgress = {
      total: tracks.length,
      processed: 0,
      matched: 0,
      downloaded: 0,
      failed: 0,
      currentTrack: null
    };

    for (const track of tracks) {
      progress.currentTrack = `${track.attributes.artistName} - ${track.attributes.name}`;
      onProgress(progress);

      try {
        // Search YouTube for match
        const match = await trackMatcherService.findMatch({
          title: track.attributes.name,
          artist: track.attributes.artistName,
          album: track.attributes.albumName,
          duration: Math.round(track.attributes.durationInMillis / 1000),
          isrc: track.attributes.isrc
        });

        if (match && match.confidence >= 70) {
          progress.matched++;

          await downloadService.download(match.youtubeUrl, {
            metadata: {
              title: track.attributes.name,
              artist: track.attributes.artistName,
              album: track.attributes.albumName,
              albumArt: formatAppleMusicArtwork(
                track.attributes.artwork?.url,
                600
              )
            }
          });
          progress.downloaded++;
        }
      } catch (error) {
        progress.failed++;
      }

      progress.processed++;
      onProgress(progress);
    }

    return {
      total: tracks.length,
      imported: progress.downloaded,
      skipped: tracks.length - progress.matched,
      failed: progress.failed
    };
  }

  private async getPlaylistTracks(
    playlistId: string,
    userToken: string
  ): Promise<AppleMusicTrack[]> {
    // Use MusicKit API server-side or relay from frontend
    const response = await fetch(
      `https://api.music.apple.com/v1/me/library/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${this.developerToken}`,
          'Music-User-Token': userToken
        }
      }
    );

    const data = await response.json();
    return data.data;
  }
}
```

## Dependencies
- **Requires:**
  - Multi-Source Download
  - Apple Developer Account ($99/year)
- **Blocks:** None

## MusicKit Requirements

1. **Apple Developer Account** - Required for MusicKit access
2. **MusicKit Identifier** - Configure in Apple Developer portal
3. **Developer Token** - JWT signed with MusicKit private key
4. **User Authorization** - OAuth-like flow via MusicKit JS

## Track Matching Strategy

Since ISRC codes are available in Apple Music metadata, use them for more accurate matching:

```typescript
async function matchWithISRC(track: AppleMusicTrack): Promise<YouTubeMatch | null> {
  if (track.attributes.isrc) {
    // Search YouTube with ISRC (some official uploads include ISRC)
    const isrcResults = await searchYouTube(`"${track.attributes.isrc}"`);
    if (isrcResults.length > 0) {
      return isrcResults[0];
    }
  }

  // Fall back to title/artist search
  return searchByMetadata(track);
}
```

## Notes
- Apple Music API requires paid developer account
- MusicKit JS handles auth in browser
- Consider caching Apple Music catalog IDs to YouTube matches
- May want to support Apple Music links/URLs pasted by user
- Handle Apple Music exclusives that may not be on YouTube
- Consider using ISRC for better matching accuracy
- Rate limiting: 15,000 requests per day per user token

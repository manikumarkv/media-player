# Feature: Spotify Sync

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Import liked songs and playlists from Spotify account. Connects via OAuth, reads user's library, and downloads matching tracks from YouTube. Enables migrating from Spotify to this offline-first player.

## User Stories
- As a user, I want to import my Spotify playlists so that I can have offline copies of my curated music
- As a user, I want to import my Spotify liked songs so that I can migrate my entire library
- As a user, I want to keep my library in sync with Spotify so that new likes are automatically downloaded
- As a user, I want to see match quality so that I know if the right version was found

## Acceptance Criteria
- [ ] OAuth authentication with Spotify
- [ ] View Spotify playlists and liked songs
- [ ] Import playlists as local playlists
- [ ] Download tracks by finding YouTube matches
- [ ] Show match confidence for each track
- [ ] Manual correction for poor matches
- [ ] Progress tracking for large imports
- [ ] Handle tracks without matches gracefully
- [ ] Sync option for ongoing imports

## Technical Approach

### Frontend Changes
- **New components:**
  - `frontend/src/components/Import/SpotifyImport.tsx` - Main import interface
  - `frontend/src/components/Import/SpotifyPlaylists.tsx` - Playlist browser
  - `frontend/src/components/Import/SpotifyLiked.tsx` - Liked songs view
  - `frontend/src/components/Import/TrackMatcher.tsx` - Match verification
  - `frontend/src/components/Import/ImportProgress.tsx` - Progress display
- **State changes:**
  - Add Spotify import state

### Spotify Import Interface
```typescript
// SpotifyImport.tsx
function SpotifyImport() {
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [view, setView] = useState<'playlists' | 'liked'>('playlists');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

  const handleConnect = async () => {
    const { authUrl } = await api.get('/api/spotify/auth-url');
    // Open OAuth popup
  };

  const handleImportPlaylist = async (playlistId: string) => {
    setImporting(true);

    const eventSource = new EventSource(
      `/api/spotify/import/playlist/${playlistId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setImportProgress(data);

      if (data.status === 'complete') {
        eventSource.close();
        setImporting(false);
      }
    };
  };

  return (
    <div className="spotify-import">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Import from Spotify</h1>
        {!connected && (
          <Button onClick={handleConnect}>
            <SpotifyIcon className="mr-2" />
            Connect Spotify
          </Button>
        )}
      </header>

      {connected && (
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <Tab value="playlists">Playlists</Tab>
            <Tab value="liked">Liked Songs</Tab>
          </TabsList>

          <TabsContent value="playlists">
            <SpotifyPlaylists
              playlists={playlists}
              onImport={handleImportPlaylist}
            />
          </TabsContent>

          <TabsContent value="liked">
            <SpotifyLiked onImport={() => handleImportPlaylist('liked')} />
          </TabsContent>
        </Tabs>
      )}

      {importing && importProgress && (
        <ImportProgressModal progress={importProgress} />
      )}
    </div>
  );
}
```

### Track Matching Component
```typescript
// TrackMatcher.tsx
interface TrackMatch {
  spotifyTrack: SpotifyTrack;
  youtubeMatch: YouTubeResult | null;
  confidence: number;
  alternativeMatches: YouTubeResult[];
}

function TrackMatcher({
  match,
  onConfirm,
  onSelectAlternative,
  onSkip
}: TrackMatcherProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const confidenceColor =
    match.confidence >= 90 ? 'text-green-500' :
    match.confidence >= 70 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <div className="track-match border rounded p-4">
      <div className="flex gap-4">
        {/* Spotify Track */}
        <div className="flex-1">
          <h4 className="text-xs text-text-muted mb-1">Spotify</h4>
          <div className="flex items-center gap-3">
            <img
              src={match.spotifyTrack.albumArt}
              className="w-12 h-12 rounded"
              alt={match.spotifyTrack.album}
            />
            <div>
              <p className="font-medium">{match.spotifyTrack.title}</p>
              <p className="text-sm text-text-secondary">
                {match.spotifyTrack.artist}
              </p>
              <p className="text-xs text-text-muted">
                {formatDuration(match.spotifyTrack.duration)}
              </p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center">
          <ArrowRight className="text-text-muted" />
        </div>

        {/* YouTube Match */}
        <div className="flex-1">
          <h4 className="text-xs text-text-muted mb-1">
            YouTube Match
            <span className={`ml-2 ${confidenceColor}`}>
              {match.confidence}% match
            </span>
          </h4>
          {match.youtubeMatch ? (
            <div className="flex items-center gap-3">
              <img
                src={match.youtubeMatch.thumbnail}
                className="w-12 h-12 rounded object-cover"
                alt={match.youtubeMatch.title}
              />
              <div>
                <p className="font-medium truncate">{match.youtubeMatch.title}</p>
                <p className="text-sm text-text-secondary">
                  {match.youtubeMatch.channel}
                </p>
                <p className="text-xs text-text-muted">
                  {formatDuration(match.youtubeMatch.duration)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-text-muted">No match found</p>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAlternatives(!showAlternatives)}
        >
          {showAlternatives ? 'Hide' : 'Show'} alternatives
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSkip}>
            Skip
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={!match.youtubeMatch}
          >
            Confirm & Download
          </Button>
        </div>
      </div>

      {showAlternatives && (
        <div className="mt-4 space-y-2">
          {match.alternativeMatches.map((alt, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 p-2 rounded hover:bg-bg-tertiary"
              onClick={() => onSelectAlternative(alt)}
            >
              <img
                src={alt.thumbnail}
                className="w-10 h-10 rounded object-cover"
                alt={alt.title}
              />
              <div className="flex-1 text-left">
                <p className="text-sm truncate">{alt.title}</p>
                <p className="text-xs text-text-secondary">{alt.channel}</p>
              </div>
              <span className="text-xs text-text-muted">
                {formatDuration(alt.duration)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/spotify.service.ts` - Spotify API integration
  - `backend/src/services/track-matcher.service.ts` - YouTube matching
- **New endpoints:**
  - `GET /api/spotify/auth-url` - Get OAuth URL
  - `GET /api/spotify/callback` - OAuth callback
  - `GET /api/spotify/playlists` - Get user playlists
  - `GET /api/spotify/liked` - Get liked songs
  - `GET /api/spotify/import/playlist/:id` - SSE import endpoint

### Spotify Service
```typescript
// spotify.service.ts
import SpotifyWebApi from 'spotify-web-api-node';

class SpotifyService {
  private api = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });

  async getPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
    this.api.setAccessToken(accessToken);

    const playlists: SpotifyPlaylist[] = [];
    let offset = 0;

    while (true) {
      const response = await this.api.getUserPlaylists({ offset, limit: 50 });
      playlists.push(...response.body.items.map(this.mapPlaylist));

      if (!response.body.next) break;
      offset += 50;
    }

    return playlists;
  }

  async getPlaylistTracks(
    accessToken: string,
    playlistId: string
  ): Promise<SpotifyTrack[]> {
    this.api.setAccessToken(accessToken);

    const tracks: SpotifyTrack[] = [];
    let offset = 0;

    while (true) {
      const response = await this.api.getPlaylistTracks(playlistId, {
        offset,
        limit: 100
      });

      tracks.push(...response.body.items.map(item =>
        this.mapTrack(item.track)
      ));

      if (!response.body.next) break;
      offset += 100;
    }

    return tracks;
  }

  async importPlaylist(
    accessToken: string,
    playlistId: string,
    onProgress: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const tracks = await this.getPlaylistTracks(accessToken, playlistId);

    const progress: ImportProgress = {
      total: tracks.length,
      processed: 0,
      matched: 0,
      downloaded: 0,
      failed: 0,
      currentTrack: null
    };

    for (const track of tracks) {
      progress.currentTrack = track;
      onProgress(progress);

      try {
        // Find YouTube match
        const match = await trackMatcherService.findMatch(track);
        progress.processed++;

        if (match) {
          progress.matched++;

          // Download if confidence is high enough
          if (match.confidence >= 80) {
            await downloadService.download(match.youtubeUrl, {
              metadata: {
                title: track.title,
                artist: track.artist,
                album: track.album,
                albumArt: track.albumArt
              }
            });
            progress.downloaded++;
          }
        }
      } catch (error) {
        progress.failed++;
      }

      onProgress(progress);
    }

    progress.currentTrack = null;
    onProgress(progress);

    return {
      total: tracks.length,
      imported: progress.downloaded,
      skipped: progress.total - progress.matched,
      failed: progress.failed
    };
  }

  private mapTrack(track: any): SpotifyTrack {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url,
      duration: Math.round(track.duration_ms / 1000),
      isrc: track.external_ids?.isrc
    };
  }
}
```

### Track Matcher Service
```typescript
// track-matcher.service.ts
class TrackMatcherService {
  async findMatch(track: SpotifyTrack): Promise<TrackMatch | null> {
    // Search YouTube
    const searchQuery = `${track.artist} ${track.title}`;
    const results = await this.searchYouTube(searchQuery);

    if (results.length === 0) {
      return null;
    }

    // Score each result
    const scored = results.map(result => ({
      result,
      score: this.calculateMatchScore(track, result)
    }));

    scored.sort((a, b) => b.score - a.score);

    return {
      spotifyTrack: track,
      youtubeMatch: scored[0].score > 50 ? scored[0].result : null,
      confidence: Math.min(100, scored[0].score),
      alternativeMatches: scored.slice(1, 6).map(s => s.result)
    };
  }

  private calculateMatchScore(spotify: SpotifyTrack, youtube: YouTubeResult): number {
    let score = 0;

    // Title similarity
    const titleSim = stringSimilarity(
      this.normalize(spotify.title),
      this.normalize(youtube.title)
    );
    score += titleSim * 40;

    // Artist in title/channel
    const artistInTitle = this.normalize(youtube.title)
      .includes(this.normalize(spotify.artist.split(',')[0]));
    const artistChannel = stringSimilarity(
      this.normalize(spotify.artist.split(',')[0]),
      this.normalize(youtube.channel)
    );
    score += (artistInTitle ? 20 : 0) + (artistChannel * 15);

    // Duration match (within 5 seconds)
    const durationDiff = Math.abs(spotify.duration - youtube.duration);
    if (durationDiff < 5) {
      score += 25 * (1 - durationDiff / 5);
    } else if (durationDiff < 15) {
      score += 10;
    }

    // Bonus for official/audio keywords
    const titleLower = youtube.title.toLowerCase();
    if (titleLower.includes('official')) score += 5;
    if (titleLower.includes('audio')) score += 5;
    if (titleLower.includes('lyrics')) score += 3;

    return score;
  }

  private normalize(s: string): string {
    return s
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

### Database Changes
```prisma
model SpotifyAccount {
  id            String    @id @default(cuid())
  userId        String?
  email         String    @unique
  displayName   String?
  accessToken   String
  refreshToken  String
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model SpotifyImport {
  id            String    @id @default(cuid())
  playlistId    String
  playlistName  String
  totalTracks   Int
  importedCount Int
  status        String    @default("pending")
  createdAt     DateTime  @default(now())
}
```

## Dependencies
- **Requires:** Multi-Source Download
- **Blocks:** None

## Notes
- Spotify API has rate limits (~180 requests/minute)
- Consider caching YouTube matches to avoid repeated searches
- May want to allow manual matching for low-confidence matches
- Could use ISRC codes for more accurate matching (some YouTube videos have ISRC)
- Consider background import for large playlists
- May want to create local playlist mirroring Spotify playlist

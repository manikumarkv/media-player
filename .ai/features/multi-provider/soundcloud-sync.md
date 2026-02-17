# Feature: SoundCloud Sync

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Import likes and playlists from SoundCloud account. Downloads tracks directly from SoundCloud (when available) or finds YouTube alternatives. Great for DJ mixes, remixes, and independent artists often found on SoundCloud.

## User Stories
- As a user, I want to import my SoundCloud likes so that I can have offline copies of tracks I've discovered
- As a user, I want to download SoundCloud playlists so that I can save DJ mixes and compilations
- As a user, I want SoundCloud tracks to download directly so that I get the best quality available
- As a user, I want to sync my SoundCloud over time so that new likes are automatically added

## Acceptance Criteria
- [ ] OAuth authentication with SoundCloud
- [ ] View SoundCloud likes and playlists
- [ ] Direct download when track is available
- [ ] Fallback to YouTube search when needed
- [ ] Handle SoundCloud Go+ tracks appropriately
- [ ] Download progress tracking
- [ ] Sync option for ongoing imports
- [ ] Handle private/removed tracks gracefully

## Technical Approach

### Frontend Changes
- **New components:**
  - `frontend/src/components/Import/SoundCloudImport.tsx` - Main interface
  - `frontend/src/components/Import/SoundCloudLikes.tsx` - Likes browser
  - `frontend/src/components/Import/SoundCloudPlaylists.tsx` - Playlists view
- **State changes:**
  - Add SoundCloud import state

### SoundCloud Import Interface
```typescript
// SoundCloudImport.tsx
function SoundCloudImport() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<SoundCloudAccount | null>(null);
  const [likes, setLikes] = useState<SoundCloudTrack[]>([]);
  const [playlists, setPlaylists] = useState<SoundCloudPlaylist[]>([]);

  return (
    <div className="soundcloud-import">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Import from SoundCloud</h1>
        {!connected ? (
          <Button onClick={handleConnect}>
            <SoundCloudIcon className="mr-2" />
            Connect SoundCloud
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src={account?.avatar}
              className="w-8 h-8 rounded-full"
              alt={account?.username}
            />
            <span>{account?.username}</span>
          </div>
        )}
      </header>

      {connected && (
        <Tabs defaultValue="likes">
          <TabsList>
            <Tab value="likes">
              Likes ({likes.length})
            </Tab>
            <Tab value="playlists">
              Playlists ({playlists.length})
            </Tab>
          </TabsList>

          <TabsContent value="likes">
            <SoundCloudLikes likes={likes} onImport={handleImportLikes} />
          </TabsContent>

          <TabsContent value="playlists">
            <SoundCloudPlaylists
              playlists={playlists}
              onImport={handleImportPlaylist}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
```

### SoundCloud Track Component
```typescript
// SoundCloudTrackItem.tsx
interface SoundCloudTrack {
  id: number;
  title: string;
  user: { username: string; avatar: string };
  duration: number;
  artworkUrl: string;
  downloadable: boolean;
  streamable: boolean;
  isGoPlus: boolean;
  playCount: number;
}

function SoundCloudTrackItem({
  track,
  selected,
  onToggle
}: SoundCloudTrackItemProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded',
      selected && 'bg-accent/10'
    )}>
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        disabled={track.isGoPlus && !hasGoPlusAccess}
      />
      <img
        src={track.artworkUrl}
        className="w-12 h-12 rounded"
        alt={track.title}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.title}</p>
        <p className="text-sm text-text-secondary truncate">
          {track.user.username}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {track.downloadable && (
          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded">
            Direct DL
          </span>
        )}
        {track.isGoPlus && (
          <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">
            Go+
          </span>
        )}
        <span className="text-sm text-text-muted">
          {formatDuration(track.duration / 1000)}
        </span>
      </div>
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/soundcloud.service.ts` - SoundCloud API
- **New endpoints:**
  - `GET /api/soundcloud/auth-url` - OAuth URL
  - `GET /api/soundcloud/callback` - OAuth callback
  - `GET /api/soundcloud/likes` - Get likes
  - `GET /api/soundcloud/playlists` - Get playlists
  - `POST /api/soundcloud/import` - Start import

### SoundCloud Service
```typescript
// soundcloud.service.ts
class SoundCloudService {
  private clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  private clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;

  async getLikes(accessToken: string): Promise<SoundCloudTrack[]> {
    const tracks: SoundCloudTrack[] = [];
    let url = 'https://api.soundcloud.com/me/likes/tracks';

    while (url) {
      const response = await fetch(url, {
        headers: { Authorization: `OAuth ${accessToken}` }
      });
      const data = await response.json();

      tracks.push(...data.collection.map(this.mapTrack));
      url = data.next_href;
    }

    return tracks;
  }

  async importTracks(
    accessToken: string,
    trackIds: number[],
    onProgress: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const progress: ImportProgress = {
      total: trackIds.length,
      processed: 0,
      downloaded: 0,
      failed: 0,
      currentTrack: null
    };

    for (const trackId of trackIds) {
      const track = await this.getTrack(accessToken, trackId);
      progress.currentTrack = track.title;
      onProgress(progress);

      try {
        if (track.downloadable) {
          // Direct download from SoundCloud
          await this.downloadDirect(track, accessToken);
        } else if (track.streamable && !track.isGoPlus) {
          // Use yt-dlp for SoundCloud URL
          await downloadService.download(track.permalink_url);
        } else {
          // Search YouTube as fallback
          await this.downloadViaYouTube(track);
        }
        progress.downloaded++;
      } catch (error) {
        progress.failed++;
      }

      progress.processed++;
      onProgress(progress);
    }

    return {
      total: trackIds.length,
      imported: progress.downloaded,
      failed: progress.failed
    };
  }

  private async downloadDirect(
    track: SoundCloudTrack,
    accessToken: string
  ): Promise<void> {
    // Get download URL
    const downloadUrl = await this.getDownloadUrl(track.id, accessToken);

    // Download file
    const response = await fetch(downloadUrl);
    const buffer = await response.arrayBuffer();

    // Save to disk
    const outputPath = this.generatePath(track);
    await fs.writeFile(outputPath, Buffer.from(buffer));

    // Create media entry
    await mediaService.createFromFile(outputPath, {
      title: track.title,
      artist: track.user.username,
      source: 'soundcloud',
      sourceId: String(track.id)
    });
  }

  private async downloadViaYouTube(track: SoundCloudTrack): Promise<void> {
    const searchQuery = `${track.user.username} ${track.title}`;
    const results = await searchYouTube(searchQuery);

    if (results.length === 0) {
      throw new Error('No YouTube match found');
    }

    // Find best match
    const match = this.findBestMatch(track, results);
    if (!match) {
      throw new Error('No good YouTube match found');
    }

    await downloadService.download(`https://youtube.com/watch?v=${match.id}`, {
      metadata: {
        title: track.title,
        artist: track.user.username,
        source: 'soundcloud'
      }
    });
  }
}
```

### Database Changes
```prisma
model SoundCloudAccount {
  id            String    @id @default(cuid())
  soundcloudId  Int       @unique
  username      String
  avatar        String?
  accessToken   String
  refreshToken  String?
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

## Dependencies
- **Requires:** Multi-Source Download
- **Blocks:** None

## SoundCloud Track Types

| Type | Available | Download Method |
|------|-----------|-----------------|
| Downloadable | ✅ | Direct download |
| Streamable (Free) | ✅ | yt-dlp |
| Go+ Track | ⚠️ | Requires Go+ subscription |
| Private | ❌ | Not accessible |
| Removed | ❌ | Not accessible |

## Notes
- SoundCloud API access may require developer approval
- Go+ tracks need subscription token in cookies
- Many indie/remix tracks are SoundCloud-exclusive
- Consider handling long mixes (1+ hour DJ sets)
- May need to split long mixes into segments
- yt-dlp supports SoundCloud directly, simplifying downloads
- Consider rate limiting to avoid API blocks

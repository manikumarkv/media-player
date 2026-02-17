# Feature: YouTube Playlist Download

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P1 (Critical)

## Complexity
Medium

## Overview
Download all videos from a YouTube playlist at once. Extracts audio from each video, handles metadata, and provides progress tracking for the entire batch operation.

## User Stories
- As a user, I want to paste a YouTube playlist URL and download all songs so that I can get entire albums or curated playlists
- As a user, I want to see progress for each song and overall so that I know how long the download will take
- As a user, I want to skip songs that are already in my library so that I don't download duplicates
- As a user, I want to cancel downloads and resume later so that I can manage my bandwidth

## Acceptance Criteria
- [ ] Accept YouTube playlist URL input
- [ ] Display playlist contents before download
- [ ] Select/deselect individual videos to download
- [ ] Skip duplicates already in library
- [ ] Progress bar for each video and overall
- [ ] Continue downloading remaining videos if one fails
- [ ] Cancel/pause playlist download
- [ ] Resume interrupted downloads
- [ ] Handle private/unavailable videos gracefully
- [ ] Metadata extraction for each downloaded track

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Download/` - Extend download UI
- **New components:**
  - `frontend/src/components/Download/PlaylistDownload.tsx` - Playlist download interface
  - `frontend/src/components/Download/PlaylistPreview.tsx` - Show playlist contents
  - `frontend/src/components/Download/PlaylistItem.tsx` - Individual video row
  - `frontend/src/components/Download/PlaylistProgress.tsx` - Overall progress
- **State changes:**
  - Add playlist download state to download store

### Playlist Preview Component
```typescript
// PlaylistPreview.tsx
interface PlaylistVideo {
  videoId: string;
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
  isAvailable: boolean;
  isDuplicate: boolean;
  selected: boolean;
}

function PlaylistPreview({ playlistUrl, onDownload }: PlaylistPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [videos, setVideos] = useState<PlaylistVideo[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    loadPlaylistInfo(playlistUrl);
  }, [playlistUrl]);

  const loadPlaylistInfo = async (url: string) => {
    setLoading(true);
    try {
      const response = await api.post('/api/download/playlist/preview', { url });
      setPlaylist(response.data.playlist);
      setVideos(response.data.videos.map((v: PlaylistVideo) => ({
        ...v,
        selected: v.isAvailable && !v.isDuplicate
      })));
    } finally {
      setLoading(false);
    }
  };

  const toggleVideo = (videoId: string) => {
    setVideos(videos.map(v =>
      v.videoId === videoId ? { ...v, selected: !v.selected } : v
    ));
  };

  const toggleAll = (selected: boolean) => {
    setVideos(videos.map(v =>
      v.isAvailable && !v.isDuplicate ? { ...v, selected } : v
    ));
  };

  const handleDownload = () => {
    const selectedVideos = videos.filter(v => v.selected).map(v => v.videoId);
    onDownload(selectedVideos);
  };

  if (loading) return <LoadingSpinner />;
  if (!playlist) return <ErrorState message="Could not load playlist" />;

  return (
    <div className="playlist-preview">
      <header className="flex gap-4 mb-6">
        <img
          src={playlist.thumbnail}
          className="w-32 h-32 rounded"
          alt={playlist.title}
        />
        <div>
          <h2 className="text-xl font-bold">{playlist.title}</h2>
          <p className="text-text-secondary">{playlist.channel}</p>
          <p className="text-sm text-text-muted">
            {videos.length} videos • {formatDuration(playlist.totalDuration)}
          </p>
        </div>
      </header>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => toggleAll(true)}>
            Select All
          </Button>
          <Button size="sm" variant="secondary" onClick={() => toggleAll(false)}>
            Deselect All
          </Button>
        </div>
        <p className="text-sm">
          {videos.filter(v => v.selected).length} of {videos.length} selected
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {videos.map(video => (
          <PlaylistItem
            key={video.videoId}
            video={video}
            onToggle={() => toggleVideo(video.videoId)}
          />
        ))}
      </div>

      <footer className="mt-6 flex justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button onClick={handleDownload}>
          Download {videos.filter(v => v.selected).length} Songs
        </Button>
      </footer>
    </div>
  );
}
```

### Playlist Item Component
```typescript
// PlaylistItem.tsx
function PlaylistItem({ video, onToggle }: PlaylistItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded',
        video.selected && 'bg-accent/10',
        !video.isAvailable && 'opacity-50'
      )}
    >
      <input
        type="checkbox"
        checked={video.selected}
        onChange={onToggle}
        disabled={!video.isAvailable || video.isDuplicate}
      />
      <img
        src={video.thumbnail}
        className="w-16 h-9 rounded object-cover"
        alt={video.title}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{video.title}</p>
        <p className="text-sm text-text-secondary truncate">{video.channel}</p>
      </div>
      <div className="text-sm text-text-muted">
        {formatDuration(video.duration)}
      </div>
      {!video.isAvailable && (
        <span className="text-xs text-error">Unavailable</span>
      )}
      {video.isDuplicate && (
        <span className="text-xs text-warning">Already in library</span>
      )}
    </div>
  );
}
```

### Playlist Download Progress
```typescript
// PlaylistProgress.tsx
interface PlaylistDownloadProgress {
  status: 'downloading' | 'paused' | 'completed' | 'failed';
  totalVideos: number;
  completedVideos: number;
  failedVideos: number;
  currentVideo: {
    title: string;
    progress: number;
  } | null;
}

function PlaylistProgress({ progress, onPause, onResume, onCancel }: PlaylistProgressProps) {
  const overallProgress = (progress.completedVideos / progress.totalVideos) * 100;

  return (
    <div className="playlist-progress bg-bg-secondary rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Downloading Playlist</h3>
        <span className="text-sm text-text-secondary">
          {progress.completedVideos} / {progress.totalVideos} complete
        </span>
      </div>

      <ProgressBar value={overallProgress} className="mb-4" />

      {progress.currentVideo && (
        <div className="mb-4">
          <p className="text-sm truncate">{progress.currentVideo.title}</p>
          <ProgressBar value={progress.currentVideo.progress} size="sm" />
        </div>
      )}

      {progress.failedVideos > 0 && (
        <p className="text-sm text-error mb-2">
          {progress.failedVideos} videos failed
        </p>
      )}

      <div className="flex gap-2">
        {progress.status === 'downloading' ? (
          <Button size="sm" variant="secondary" onClick={onPause}>
            Pause
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={onResume}>
            Resume
          </Button>
        )}
        <Button size="sm" variant="destructive" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/download.service.ts` - Add playlist support
  - `backend/src/controllers/download.controller.ts` - Add playlist endpoints
- **New endpoints:**
  - `POST /api/download/playlist/preview` - Get playlist info
  - `POST /api/download/playlist` - Start playlist download
  - `GET /api/download/playlist/:id/progress` - SSE for progress
  - `POST /api/download/playlist/:id/pause` - Pause download
  - `POST /api/download/playlist/:id/resume` - Resume download
  - `DELETE /api/download/playlist/:id` - Cancel download

### Playlist Download Service
```typescript
// download.service.ts
import ytdl from 'ytdl-core';
import ytpl from 'ytpl';

class DownloadService {
  async getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    const playlist = await ytpl(url, { limit: Infinity });

    const videos = await Promise.all(
      playlist.items.map(async (item) => {
        const isDuplicate = await this.checkDuplicate(item.id);
        return {
          videoId: item.id,
          title: item.title,
          channel: item.author.name,
          duration: item.durationSec || 0,
          thumbnail: item.bestThumbnail.url,
          isAvailable: !item.isLive && item.durationSec > 0,
          isDuplicate
        };
      })
    );

    return {
      playlist: {
        id: playlist.id,
        title: playlist.title,
        channel: playlist.author.name,
        thumbnail: playlist.bestThumbnail.url,
        videoCount: playlist.estimatedItemCount,
        totalDuration: videos.reduce((sum, v) => sum + v.duration, 0)
      },
      videos
    };
  }

  async downloadPlaylist(
    playlistId: string,
    videoIds: string[],
    onProgress: (progress: PlaylistDownloadProgress) => void
  ): Promise<void> {
    const progress: PlaylistDownloadProgress = {
      status: 'downloading',
      totalVideos: videoIds.length,
      completedVideos: 0,
      failedVideos: 0,
      currentVideo: null
    };

    for (const videoId of videoIds) {
      // Check if paused/cancelled
      const job = await this.getJob(playlistId);
      if (job.status === 'paused') {
        await this.waitForResume(playlistId);
      }
      if (job.status === 'cancelled') {
        break;
      }

      try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(videoUrl);

        progress.currentVideo = {
          title: info.videoDetails.title,
          progress: 0
        };
        onProgress(progress);

        await this.downloadSingle(videoUrl, (p) => {
          progress.currentVideo!.progress = p;
          onProgress(progress);
        });

        progress.completedVideos++;
      } catch (error) {
        progress.failedVideos++;
        console.error(`Failed to download ${videoId}:`, error);
      }

      progress.currentVideo = null;
      onProgress(progress);
    }

    progress.status = 'completed';
    onProgress(progress);
  }

  private async checkDuplicate(videoId: string): Promise<boolean> {
    const existing = await prisma.media.findFirst({
      where: { sourceId: videoId }
    });
    return !!existing;
  }
}
```

### Database Changes
```prisma
model PlaylistDownloadJob {
  id              String   @id @default(cuid())
  playlistId      String
  playlistTitle   String
  totalVideos     Int
  completedVideos Int      @default(0)
  failedVideos    Int      @default(0)
  videoIds        Json     // Array of video IDs to download
  status          String   @default("pending") // pending, downloading, paused, completed, cancelled
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Dependencies
- **Requires:** Single video download functionality
- **Blocks:** None

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Private playlist | Show error message |
| Video age-restricted | Skip with warning |
| Video unavailable | Mark as failed, continue others |
| Video already downloaded | Skip, show as duplicate |
| Playlist very long (500+) | Paginate preview, batch downloads |
| Network interruption | Pause and allow resume |

## Notes
- Consider rate limiting to avoid YouTube blocks
- May want to add delay between downloads
- Could add playlist import to create actual playlist in app
- Consider parallel downloads for speed (with rate limiting)
- May want to support YouTube Music playlists
- Handle playlist URL formats: full URL, playlist ID, shortened URLs

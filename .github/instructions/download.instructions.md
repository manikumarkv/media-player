# Download System Instructions

## Overview
The download system is responsible for fetching videos and audio from YouTube and integrating them into the local media library. This is a **secondary feature** - it only runs when user needs to add new content.

## Important Context
- **Requires internet**: Downloads cannot work offline
- **Async operation**: Downloads run in background with progress updates
- **User-initiated**: Never auto-download
- **One-time action**: Once downloaded, content is local forever

## Core Requirements

### Download Capabilities
- Single video downloads (any quality)
- Single audio extraction (convert to MP3)
- Full playlist downloads (batch operation)
- Quality selection before download
- Concurrent downloads with queue management

### User Experience
- Show real-time progress (percentage, speed, ETA)
- Allow pause/resume functionality
- Queue multiple downloads
- Preview metadata before downloading
- Provide cancel option

## Component Structure

```
Downloader/
├── UrlInput.tsx           # YouTube URL input and validation
├── VideoPreview.tsx       # Show metadata before download
├── QualitySelector.tsx    # Choose video quality
├── DownloadProgress.tsx   # Progress bar with stats
├── DownloadQueue.tsx      # List of pending/active downloads
├── DownloadHistory.tsx    # Previously downloaded items
└── downloader.types.ts    # Type definitions
```

## Implementation Guidelines

### URL Validation
Accept these YouTube URL formats:
```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/playlist?list=PLAYLIST_ID
https://music.youtube.com/watch?v=VIDEO_ID
```

Validate before sending to backend:
```typescript
const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
    /^https?:\/\/music\.youtube\.com\/watch\?v=[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
};
```

### Metadata Fetching
Before downloading, fetch and display:
- Title
- Duration
- Thumbnail
- Channel name
- View count
- Upload date
- Available qualities (1080p, 720p, 480p, 360p, audio-only)
- File size estimate

API call:
```typescript
GET /api/download/metadata?url=<encoded-url>

Response: {
  data: {
    videoId: string,
    title: string,
    duration: number,
    thumbnail: string,
    channel: string,
    views: number,
    uploadDate: string,
    availableQualities: Quality[]
  }
}
```

### Quality Selection
Present available formats:
- **Video**: 1080p, 720p, 480p, 360p (with file size estimates)
- **Audio Only**: Best quality MP3 (typically 128-320 kbps)

Show estimated file size for each quality:
```
1080p (1.2 GB)
720p (680 MB)
480p (340 MB)
Audio Only (4.5 MB)
```

Default to 720p for video, best quality for audio.

### Download Initiation
```typescript
POST /api/download/video
Body: {
  url: string,
  quality: '1080p' | '720p' | '480p' | '360p'
}

Response: {
  data: {
    downloadId: string,
    status: 'queued' | 'downloading' | 'processing' | 'complete'
  }
}
```

```typescript
POST /api/download/audio
Body: {
  url: string
}

Response: {
  data: {
    downloadId: string,
    status: 'queued' | 'downloading' | 'processing' | 'complete'
  }
}
```

### WebSocket Progress Updates
Connect to backend WebSocket:
```typescript
const socket = io('http://localhost:3000');

socket.on('download:progress', (data) => {
  // data: { downloadId, progress, speed, eta, status }
  updateProgressUI(data);
});

socket.on('download:complete', (data) => {
  // data: { downloadId, mediaId, filePath }
  showSuccessNotification();
  addToLibrary(data.mediaId);
});

socket.on('download:error', (data) => {
  // data: { downloadId, error }
  showErrorNotification(data.error);
});
```

### Progress Display
Show for each active download:
- Filename/title
- Progress bar (0-100%)
- Download speed (MB/s)
- ETA (estimated time remaining)
- Status (downloading, processing, complete)
- Cancel button

Example UI:
```
🎵 Song Title - Artist Name
[████████████--------------------] 60%
12.5 MB/s • 2m 30s remaining
[Cancel]
```

### Playlist Downloads
When downloading a playlist:
1. Fetch playlist metadata first
2. Show list of all videos
3. Allow user to select which videos to download
4. Show aggregate progress (e.g., "Downloading 5 of 20 videos")
5. Download sequentially or in parallel (max 3 concurrent)

API call:
```typescript
POST /api/download/playlist
Body: {
  url: string,
  quality: string,
  selectedVideos?: string[] // Optional: specific video IDs
}

Response: {
  data: {
    playlistId: string,
    totalVideos: number,
    downloads: DownloadTask[]
  }
}
```

### Queue Management
- Maximum 5 concurrent downloads
- Queue additional downloads
- Show queue position
- Allow reordering queue
- Clear queue option
- Retry failed downloads

### Error Handling
Handle these errors gracefully:
- Invalid YouTube URL
- Private/deleted video
- Age-restricted content
- Geo-blocked content
- Network timeout
- Insufficient disk space
- Unsupported format
- YouTube API rate limiting

Error messages should be user-friendly:
```
❌ "This video is private and cannot be downloaded"
❌ "You've reached the download limit. Please try again later."
❌ "Not enough disk space. Free up at least 500 MB."
```

### Post-Download Actions
After successful download:
1. Automatically add to media library database
2. Extract and save thumbnail locally
3. Generate metadata entry
4. Show success notification with "Play Now" button
5. Optionally add to "Recently Downloaded" section

### Download History
Track all downloads with:
- Download date/time
- Original YouTube URL
- Quality selected
- File size
- Status (success/failed)
- Error message (if failed)

Allow user to:
- Re-download failed items
- View original YouTube link
- Delete download history

## Performance Considerations

### Bandwidth Management
- Don't saturate network (limit to 3 concurrent downloads)
- Throttle download speed option (optional)
- Pause all downloads option
- Resume downloads after app restart

### Disk Space
- Check available space before starting download
- Warn if space is low (< 1GB free)
- Clean up partial downloads on error
- Provide option to change download location

### Memory Management
- Stream downloads to disk (don't load entire file in memory)
- Clean up temporary files
- Release resources on cancel

## YouTube Library Selection

### ytdl-core (Recommended for MVP)
**Pros:**
- Pure Node.js (no external dependencies)
- Fast and lightweight
- Good community support

**Cons:**
- May break when YouTube changes
- Limited format support
- No built-in playlist support

**Installation:**
```bash
npm install ytdl-core @types/ytdl-core
```

### yt-dlp (Recommended for Production)
**Pros:**
- Most reliable and actively maintained
- Excellent format support
- Built-in playlist handling
- Handles geo-restrictions better

**Cons:**
- Requires Python binary
- Larger Docker image

**Installation:**
```bash
# In Dockerfile
RUN apk add --no-cache python3 py3-pip
RUN pip3 install yt-dlp
```

**Recommendation:** Start with ytdl-core for MVP, migrate to yt-dlp if issues arise.

## FFmpeg Integration
Required for audio extraction (MP4 → MP3):

**Installation in Docker:**
```dockerfile
RUN apk add --no-cache ffmpeg
```

**Usage:**
```typescript
import ffmpeg from 'fluent-ffmpeg';

ffmpeg(inputPath)
  .toFormat('mp3')
  .audioBitrate(192)
  .on('progress', (progress) => {
    // Emit progress via WebSocket
  })
  .on('end', () => {
    // Conversion complete
  })
  .save(outputPath);
```

## Security Considerations

### Input Validation
- Never trust user URLs
- Validate against whitelist of domains (youtube.com, youtu.be)
- Sanitize filenames (remove special characters, path traversal)
- Check file extensions before saving

### Rate Limiting
- Limit downloads per user/IP
- Implement cooldown between downloads
- Detect and block abuse patterns

### Disk Usage
- Set maximum file size (e.g., 5GB per video)
- Implement total storage quota
- Clean up old downloads automatically

## Testing Checklist

### Functionality
- [ ] Download single video at various qualities
- [ ] Extract audio to MP3
- [ ] Download full playlist
- [ ] Show accurate progress updates
- [ ] Pause and resume download
- [ ] Cancel in-progress download
- [ ] Handle invalid URLs gracefully
- [ ] Handle private/deleted videos
- [ ] Retry failed downloads
- [ ] Multiple concurrent downloads work

### Edge Cases
- [ ] Very long video (3+ hours)
- [ ] Very short video (< 30 seconds)
- [ ] Large playlist (50+ videos)
- [ ] Interrupted network connection
- [ ] Full disk space
- [ ] Rapid successive downloads

### Performance
- [ ] No memory leaks during long downloads
- [ ] CPU usage stays reasonable
- [ ] Network bandwidth is managed
- [ ] Temporary files are cleaned up

## UI/UX Best Practices

### ✅ Do
- Show progress immediately upon starting
- Provide clear feedback for all actions
- Allow background downloads
- Save incomplete downloads for resume
- Provide "Open in YouTube" link for reference

### ❌ Don't
- Don't block UI during downloads
- Don't auto-start downloads without confirmation
- Don't hide errors from user
- Don't download same video twice (check duplicates)
- Don't leave orphaned files on error

## Example Service Implementation

```typescript
export class DownloadService {
  async downloadVideo(url: string, quality: string) {
    // Validate URL
    // Check disk space
    // Create download task
    // Start download with ytdl-core/yt-dlp
    // Emit progress events via WebSocket
    // Save to database on complete
    // Clean up temp files
  }

  async downloadAudio(url: string) {
    // Similar to video but extract audio
    // Convert to MP3 with FFmpeg
  }

  async getMetadata(url: string) {
    // Fetch video info without downloading
  }
}
```

## Common Issues and Solutions

**Issue**: Downloads fail with "Video unavailable"
**Solution**: Video may be private, deleted, or geo-blocked. Show clear error message.

**Issue**: Progress stuck at 99%
**Solution**: FFmpeg post-processing. Show "Processing..." status.

**Issue**: Out of memory
**Solution**: Use streaming instead of loading full file in memory.

**Issue**: YouTube rate limiting
**Solution**: Implement exponential backoff and retry logic.

# Feature: Video Download

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Download video files (not just audio) from YouTube with support for video playback in the player. Enables watching music videos, live performances, and video content directly in the app.

## User Stories
- As a user, I want to download music videos so that I can watch them offline
- As a user, I want to choose video quality so that I can balance storage and quality
- As a user, I want to watch downloaded videos in the app so that I don't need another video player
- As a user, I want to switch between audio and video playback so that I can choose how to experience the content

## Acceptance Criteria
- [ ] Option to download video instead of audio-only
- [ ] Multiple quality options (1080p, 720p, 480p, 360p)
- [ ] Show file size estimates for each quality
- [ ] Video player in the app with standard controls
- [ ] Mini player for video (picture-in-picture)
- [ ] Audio-only mode for video files
- [ ] Video thumbnail scrubbing
- [ ] Subtitle/caption support if available

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Download/DownloadDialog.tsx` - Add video option
  - `frontend/src/components/Player/` - Add video player support
  - `frontend/src/stores/playerStore.ts` - Handle video playback
- **New components:**
  - `frontend/src/components/Player/VideoPlayer.tsx` - Video player component
  - `frontend/src/components/Player/VideoControls.tsx` - Video-specific controls
  - `frontend/src/components/Player/PictureInPicture.tsx` - PiP support
  - `frontend/src/components/Download/VideoQualitySelector.tsx` - Quality picker
- **State changes:**
  - Add `isVideo: boolean` to current media
  - Add `videoMode: 'video' | 'audio'` for playback mode

### Video Download Options
```typescript
// VideoQualitySelector.tsx
interface VideoQuality {
  quality: string;      // '1080p', '720p', etc.
  format: string;       // 'mp4', 'webm'
  fileSize: number;     // Estimated bytes
  hasAudio: boolean;    // Some streams are video-only
  fps: number;
}

function VideoQualitySelector({ videoId, onSelect }: VideoQualitySelectorProps) {
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/download/video/${videoId}/qualities`)
      .then(res => setQualities(res.data))
      .finally(() => setLoading(false));
  }, [videoId]);

  return (
    <div className="space-y-2">
      <h4 className="font-medium">Video Quality</h4>
      {qualities.map(q => (
        <button
          key={q.quality}
          onClick={() => onSelect(q)}
          className="w-full flex items-center justify-between p-2 rounded hover:bg-bg-tertiary"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{q.quality}</span>
            {q.fps > 30 && <span className="text-xs text-accent">{q.fps}fps</span>}
          </div>
          <span className="text-text-secondary">{formatFileSize(q.fileSize)}</span>
        </button>
      ))}
    </div>
  );
}
```

### Video Player Component
```typescript
// VideoPlayer.tsx
function VideoPlayer({
  src,
  poster,
  onTimeUpdate,
  onEnded
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number>();

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      await videoRef.current?.requestPictureInPicture();
    }
  };

  return (
    <div
      className={cn(
        'video-player relative bg-black',
        isFullscreen && 'fixed inset-0 z-50'
      )}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onEnded={onEnded}
      />

      <VideoControls
        videoRef={videoRef}
        visible={showControls}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onTogglePiP={togglePiP}
      />
    </div>
  );
}
```

### Video Controls
```typescript
// VideoControls.tsx
function VideoControls({
  videoRef,
  visible,
  isFullscreen,
  onToggleFullscreen,
  onTogglePiP
}: VideoControlsProps) {
  const video = videoRef.current;
  const { currentTime, duration, isPlaying, togglePlay, seek } = useVideoState(video);

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent',
        'transition-opacity',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Progress bar with thumbnail preview */}
      <VideoProgressBar
        currentTime={currentTime}
        duration={duration}
        videoRef={videoRef}
        onSeek={seek}
      />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button onClick={togglePlay}>
            {isPlaying ? <Pause /> : <Play />}
          </button>

          <button onClick={() => seek(currentTime - 10)}>
            <Rewind10 />
          </button>
          <button onClick={() => seek(currentTime + 10)}>
            <Forward10 />
          </button>

          <VolumeControl />

          <span className="text-sm text-white">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onTogglePiP} title="Picture in Picture">
            <PictureInPictureIcon />
          </button>
          <button onClick={onToggleFullscreen}>
            {isFullscreen ? <Minimize /> : <Maximize />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Thumbnail Scrubbing
```typescript
// VideoProgressBar.tsx - With thumbnail preview
function VideoProgressBar({
  currentTime,
  duration,
  videoRef,
  onSeek
}: VideoProgressBarProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    setHoverTime(time);
    generateThumbnail(time);
  };

  const generateThumbnail = async (time: number) => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Seek a hidden video element to get thumbnail
    // (actual implementation would use a separate video element)
    video.currentTime = time;
    await new Promise(resolve => video.onseeked = resolve);

    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setThumbnailUrl(canvas.toDataURL());
  };

  return (
    <div
      ref={progressRef}
      className="relative h-1 bg-white/30 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTime(null)}
      onClick={(e) => {
        const rect = progressRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / rect.width) * duration;
        onSeek(time);
      }}
    >
      {/* Progress */}
      <div
        className="absolute h-full bg-accent"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />

      {/* Thumbnail preview */}
      {hoverTime !== null && thumbnailUrl && (
        <div
          className="absolute bottom-4 transform -translate-x-1/2"
          style={{ left: `${(hoverTime / duration) * 100}%` }}
        >
          <img
            src={thumbnailUrl}
            className="w-32 h-18 rounded shadow-lg"
            alt="Preview"
          />
          <p className="text-xs text-white text-center mt-1">
            {formatTime(hoverTime)}
          </p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" width={160} height={90} />
    </div>
  );
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/download.service.ts` - Add video download support
- **New endpoints:**
  - `GET /api/download/video/:id/qualities` - Get available qualities
  - `POST /api/download/video` - Download video with quality selection

### Video Download Service
```typescript
// download.service.ts
async downloadVideo(
  url: string,
  quality: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const info = await ytdl.getInfo(url);

  // Get video format matching quality
  const videoFormat = ytdl.chooseFormat(info.formats, {
    quality: this.mapQualityToItag(quality),
    filter: 'videoandaudio'
  });

  // If best quality has separate audio, we need to merge
  if (!videoFormat.hasAudio) {
    return this.downloadAndMerge(url, quality, onProgress);
  }

  // Download combined stream
  const outputPath = this.generatePath(info.videoDetails, 'mp4');
  const stream = ytdl(url, { format: videoFormat });

  await this.streamToFile(stream, outputPath, onProgress);

  return outputPath;
}

private async downloadAndMerge(
  url: string,
  quality: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const videoPath = await this.downloadVideoOnly(url, quality);
  const audioPath = await this.downloadAudioOnly(url);
  const outputPath = this.generateMergedPath(url);

  // Merge with FFmpeg
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .outputOptions(['-c:v copy', '-c:a aac'])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Clean up temp files
  await fs.unlink(videoPath);
  await fs.unlink(audioPath);

  return outputPath;
}
```

### Database Changes
```prisma
model Media {
  // ... existing fields
  isVideo       Boolean   @default(false)
  videoQuality  String?   // '1080p', '720p', etc.
  hasSubtitles  Boolean   @default(false)
  subtitlePath  String?   // Path to subtitle file
}
```

## Dependencies
- **Requires:** Core download functionality, FFmpeg
- **Blocks:** None

## Notes
- Consider storage impact warnings for video downloads
- May want to add automatic quality selection based on network/storage
- Consider thumbnail generation for video library view
- Could add chapter support if available in video
- May need to handle different aspect ratios
- Consider bandwidth warning for large downloads
- Support for 4K/HDR would be nice but increases complexity

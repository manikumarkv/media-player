# Player Component Instructions

## Overview
The player is the heart of the application. It must provide a seamless, responsive, and reliable playback experience for both audio and video content.

## Core Requirements

### Offline-First
- **MUST** work without internet connection
- Load media from local backend API
- Handle network errors gracefully
- Show offline status indicator

### Performance
- Start playback within 500ms of user action
- Support seeking without re-downloading entire file (range requests)
- Smooth progress bar updates (60fps)
- No jank or stuttering during playback
- Handle large media files (1GB+) efficiently

## Component Structure

### Main Player Components
```
Player/
├── AudioPlayer.tsx       # Audio playback UI
├── VideoPlayer.tsx       # Video playback UI
├── Controls.tsx          # Play/pause/skip/volume controls
├── ProgressBar.tsx       # Seekable progress indicator
├── VolumeControl.tsx     # Volume slider and mute
├── NowPlaying.tsx        # Current track info display
├── Queue.tsx             # Upcoming tracks list
└── player.types.ts       # Shared types
```

## Implementation Guidelines

### HTML5 Audio/Video API
- Use native `<audio>` and `<video>` elements
- Leverage browser's built-in decoding
- Support all major codecs (MP3, MP4, WebM)

### State Management
Use a custom `usePlayer` hook that manages:
```typescript
interface PlayerState {
  currentMedia: Media | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  queue: Media[];
  repeatMode: 'off' | 'one' | 'all';
  shuffleEnabled: boolean;
}
```

### Playback Controls

#### Play/Pause
- Instant response (< 100ms)
- Show loading state while buffering
- Handle errors (file not found, corrupt file)
- Auto-resume from last position for video

#### Seek (Progress Bar)
- Draggable progress indicator
- Click anywhere to jump
- Show preview thumbnail on hover (video only)
- Support keyboard arrow keys (left/right = 5s skip)
- Use range requests to backend API

#### Volume
- Slider from 0-100
- Mute toggle button
- Persist volume preference to localStorage
- Keyboard shortcuts (up/down arrows)

#### Next/Previous
- Respect queue order
- Handle edge cases (first/last track)
- Support "Play Next" vs "Add to Queue"
- Smooth transition between tracks (< 200ms gap)

#### Shuffle
- Fisher-Yates algorithm for true randomness
- Don't repeat recently played tracks
- Persist shuffle state

#### Repeat
- Off: Stop after queue ends
- One: Repeat current track
- All: Loop entire queue

### Auto-Play
- Automatically play next track in queue
- Respect repeat and shuffle settings
- Continue until queue is empty
- Emit event when queue completes

### Error Handling
Handle these scenarios gracefully:
- File not found (404)
- Corrupt media file
- Unsupported format
- Network timeout
- Insufficient permissions

Show user-friendly error messages:
```typescript
"Unable to play this track. The file may be corrupted."
"This video format is not supported by your browser."
```

### Loading States
- Show spinner during initial load
- Buffering indicator if playback stalls
- Skeleton screen for metadata
- Progress indicator for seeking

### Keyboard Shortcuts
Implement these global shortcuts:
- `Space`: Play/Pause
- `→`: Skip forward 5s
- `←`: Skip back 5s
- `↑`: Volume up
- `↓`: Volume down
- `M`: Mute/Unmute
- `N`: Next track
- `P`: Previous track
- `S`: Toggle shuffle
- `R`: Cycle repeat mode

Prevent default browser behavior when appropriate.

### Range Requests for Seeking
When user seeks to a different position:
```typescript
// Request only the needed byte range
fetch(`/api/media/${id}/stream`, {
  headers: {
    'Range': `bytes=${startByte}-${endByte}`
  }
});
```

Backend must support `Range` header and return `206 Partial Content`.

### Play History Tracking
Record play events when:
- Track completes (90%+ played)
- User manually skips after 30s
- User closes app with track playing

Send to backend:
```typescript
POST /api/media/:id/play
{
  duration: 180,        // Seconds actually played
  completedPlay: true   // Did they finish it?
}
```

### Now Playing Display
Show current track information:
- Thumbnail/album art (fallback icon if missing)
- Title
- Artist/Channel
- Duration (current / total)
- Like/favorite button
- Add to playlist button

Update document title and media session API:
```typescript
navigator.mediaSession.metadata = new MediaMetadata({
  title: media.title,
  artist: media.artist,
  album: media.album,
  artwork: [{ src: media.thumbnail }]
});
```

### Queue Management
- Display next 10 tracks
- Drag-and-drop to reorder
- Remove from queue
- Clear queue button
- "Play Next" adds to position 1
- "Add to Queue" adds to end

### Video-Specific Features
- Picture-in-Picture support
- Fullscreen toggle
- Playback speed control (0.5x to 2x)
- Subtitle support (if available)
- Minimize to corner while browsing

### Audio-Specific Features
- Background playback (continue when tab inactive)
- Visualizer (optional, waveform display)
- Equalizer controls (optional)
- Lyrics display (if metadata includes lyrics)

## Testing Checklist

### Functionality
- [ ] Play audio file successfully
- [ ] Play video file successfully
- [ ] Pause and resume playback
- [ ] Seek to different positions
- [ ] Volume control works
- [ ] Mute/unmute works
- [ ] Next track plays automatically
- [ ] Previous track works
- [ ] Shuffle mode randomizes correctly
- [ ] Repeat modes work as expected
- [ ] Keyboard shortcuts respond
- [ ] Queue can be reordered
- [ ] Play history is recorded
- [ ] Works offline (disconnect internet)

### Edge Cases
- [ ] Handle missing file gracefully
- [ ] Handle corrupt file without crashing
- [ ] Handle empty queue
- [ ] Handle single item in queue with repeat
- [ ] Handle very long files (3+ hours)
- [ ] Handle quick successive skip clicks
- [ ] Handle seek to end of track

### Performance
- [ ] Playback starts quickly (< 500ms)
- [ ] Seeking is smooth
- [ ] No UI jank during playback
- [ ] Memory doesn't leak during long sessions
- [ ] Works with 1000+ items in queue

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Common Pitfalls

### ❌ Don't
- Don't load entire file into memory
- Don't block UI thread during playback
- Don't forget to clean up event listeners
- Don't ignore range request capabilities
- Don't auto-play without user interaction (browser policy)

### ✅ Do
- Use Web Audio API for advanced features
- Implement proper cleanup in useEffect
- Debounce seek operations
- Show visual feedback for all actions
- Test with slow network conditions
- Handle browser autoplay policies

## API Integration

### Stream Endpoint
```typescript
GET /api/media/:id/stream
Headers:
  Range: bytes=0-1024 (optional)

Response:
  Status: 200 OK (full file) or 206 Partial Content (range)
  Content-Type: audio/mpeg or video/mp4
  Content-Length: <size>
  Accept-Ranges: bytes
  Content-Range: bytes 0-1024/5242880 (if range request)
```

### Play Tracking Endpoint
```typescript
POST /api/media/:id/play
Body: {
  duration: number,
  completedPlay: boolean
}

Response: { success: true }
```

## Accessibility

- Provide ARIA labels for all controls
- Support keyboard navigation
- Announce track changes to screen readers
- Ensure sufficient color contrast
- Provide text alternatives for icons

## Example Hook Structure

```typescript
export const usePlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>(initialState);

  const play = useCallback(async (media: Media) => {
    // Implementation
  }, []);

  const pause = useCallback(() => {
    // Implementation
  }, []);

  const seek = useCallback((time: number) => {
    // Implementation
  }, []);

  useEffect(() => {
    // Event listeners setup
    return () => {
      // Cleanup
    };
  }, []);

  return { state, play, pause, seek, ... };
};
```

## Resources
- [HTML5 Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio)
- [HTML5 Video API Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)
- [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests)

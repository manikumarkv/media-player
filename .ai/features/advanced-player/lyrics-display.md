# Feature: Lyrics Display

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Display synchronized lyrics that scroll with the music. Supports LRC format for line-by-line synchronization and falls back to static lyrics when timing data isn't available. Enhances the listening experience by showing what's being sung.

## User Stories
- As a user, I want to see song lyrics so that I can sing along or understand the words
- As a user, I want lyrics to highlight the current line so that I can follow along easily
- As a user, I want to tap on a lyric line to seek to that part so that I can navigate the song
- As a user, I want to add my own lyrics so that songs without lyrics can have them

## Acceptance Criteria
- [ ] Display lyrics synced to current playback position
- [ ] Current line highlighted and centered in view
- [ ] Auto-scroll to keep current line visible
- [ ] Click/tap on line to seek to that timestamp
- [ ] Support LRC format (timestamped lyrics)
- [ ] Support plain text lyrics (static display)
- [ ] Lyrics panel can be shown/hidden
- [ ] Full-screen lyrics mode
- [ ] Manual lyrics editing/addition
- [ ] Lyrics persist in database

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add lyrics display state
  - `frontend/src/components/Player/` - Add lyrics panel
- **New components:**
  - `frontend/src/components/Player/Lyrics/LyricsPanel.tsx` - Main lyrics container
  - `frontend/src/components/Player/Lyrics/LyricLine.tsx` - Individual lyric line
  - `frontend/src/components/Player/Lyrics/LyricsEditor.tsx` - Edit/add lyrics
  - `frontend/src/components/Player/Lyrics/LyricsFullscreen.tsx` - Fullscreen view
  - `frontend/src/hooks/useLyrics.ts` - Lyrics parsing and sync logic
- **State changes:**
  - Add `lyricsVisible: boolean`
  - Add `lyricsFullscreen: boolean`
  - Add `currentLyricIndex: number`

### LRC Format Parsing
```typescript
// LRC format example:
// [00:12.34]First line of lyrics
// [00:15.67]Second line of lyrics

interface LyricLine {
  time: number;    // seconds
  text: string;
}

function parseLRC(lrcContent: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const lineRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  for (const line of lrcContent.split('\n')) {
    const match = line.match(lineRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3].padEnd(3, '0'));

      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = match[4].trim();

      if (text) {
        lines.push({ time, text });
      }
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}
```

### Lyrics Sync Hook
```typescript
// useLyrics.ts
export function useLyrics(mediaId: string | null) {
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { currentTime } = usePlayerStore();

  // Load lyrics for current track
  useEffect(() => {
    if (!mediaId) {
      setLyrics(null);
      return;
    }

    fetchLyrics(mediaId).then(data => {
      if (data.lrc) {
        setLyrics(parseLRC(data.lrc));
      } else if (data.plainText) {
        // Convert plain text to single "line" without timing
        setLyrics([{ time: 0, text: data.plainText }]);
      } else {
        setLyrics(null);
      }
    });
  }, [mediaId]);

  // Update current line based on playback position
  useEffect(() => {
    if (!lyrics || lyrics.length === 0) return;

    // Find the line that should be highlighted
    let index = 0;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) {
        index = i;
      } else {
        break;
      }
    }

    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  }, [currentTime, lyrics]);

  return {
    lyrics,
    currentIndex,
    hasTimedLyrics: lyrics && lyrics.length > 1,
    isLoading: !lyrics && mediaId !== null
  };
}
```

### Lyrics Panel Component
```typescript
// LyricsPanel.tsx
function LyricsPanel() {
  const { mediaId } = usePlayerStore();
  const { lyrics, currentIndex, hasTimedLyrics } = useLyrics(mediaId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current line
  useEffect(() => {
    if (!containerRef.current || !hasTimedLyrics) return;

    const currentLine = containerRef.current.children[currentIndex] as HTMLElement;
    if (currentLine) {
      currentLine.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentIndex, hasTimedLyrics]);

  if (!lyrics) {
    return (
      <div className="lyrics-panel empty">
        <p>No lyrics available</p>
        <Button onClick={openEditor}>Add Lyrics</Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="lyrics-panel">
      {lyrics.map((line, index) => (
        <LyricLine
          key={index}
          text={line.text}
          time={line.time}
          isActive={index === currentIndex}
          isPast={index < currentIndex}
          onClick={() => seekTo(line.time)}
          isClickable={hasTimedLyrics}
        />
      ))}
    </div>
  );
}
```

### Lyric Line Component
```typescript
// LyricLine.tsx
function LyricLine({
  text,
  time,
  isActive,
  isPast,
  onClick,
  isClickable
}: LyricLineProps) {
  return (
    <p
      className={cn(
        'lyric-line py-2 px-4 text-center transition-all duration-300',
        isActive && 'text-accent text-lg font-medium scale-105',
        isPast && 'text-text-muted',
        !isActive && !isPast && 'text-text-secondary',
        isClickable && 'cursor-pointer hover:text-text-primary'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      {text}
    </p>
  );
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Add lyrics CRUD
- **New endpoints:**
  - `GET /api/media/:id/lyrics` - Get lyrics for a track
  - `PUT /api/media/:id/lyrics` - Update/add lyrics
  - `DELETE /api/media/:id/lyrics` - Remove lyrics

### Database Changes
```prisma
model Lyrics {
  id        String   @id @default(cuid())
  mediaId   String   @unique
  media     Media    @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  lrc       String?  // LRC format with timestamps
  plainText String?  // Plain text without timestamps
  source    String?  // Where lyrics came from
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Dependencies
- **Requires:** Core player functionality
- **Blocks:** None

## Lyrics Sources (Future Enhancement)
- Embedded in audio file metadata (ID3 tags)
- User-provided LRC/TXT files
- Manual entry in editor
- Future: External lyrics APIs (with user permission)

## UI Layouts

### Side Panel Mode
```
┌──────────────────────┬─────────────┐
│                      │   Previous  │
│                      │   line...   │
│    Album Art /       │             │
│    Visualizer        │ ♪ CURRENT   │
│                      │   LINE ♪    │
│                      │             │
│                      │   Next      │
│                      │   line...   │
└──────────────────────┴─────────────┘
```

### Fullscreen Mode
```
┌─────────────────────────────────────┐
│                                     │
│         Previous line...            │
│                                     │
│      ♪ CURRENT LINE IS HERE ♪       │
│                                     │
│         Next line coming...         │
│                                     │
│      ○───────●────────○  2:34      │
│      [⏮] [⏯] [⏭]                   │
└─────────────────────────────────────┘
```

## Notes
- Consider karaoke-style word-by-word highlighting (enhanced LRC format)
- May want dual-language lyrics for translations
- Could detect lyrics in audio file ID3 tags during import
- Consider accessibility: screen reader support for lyrics
- Font size preference for lyrics display
- Background blur/dim effect in fullscreen mode

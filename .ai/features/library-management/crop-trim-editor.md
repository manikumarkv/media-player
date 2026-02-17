# Feature: Crop/Trim Editor

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Audio/video editor that allows trimming, cropping, and cutting sections from media files. Users can save edits as a new file or replace the original. Useful for removing intros, outros, unwanted segments, or extracting specific parts.

## User Stories
- As a user, I want to trim the beginning and end of songs so that I can remove unwanted intros/outros
- As a user, I want to cut out sections from the middle so that I can remove ads or silence
- As a user, I want to save edits as a new file so that I keep the original intact
- As a user, I want to preview my edits before saving so that I can verify they're correct

## Acceptance Criteria
- [ ] Visual waveform display for precise editing
- [ ] Drag handles to set start and end points
- [ ] Cut/remove sections from middle of track
- [ ] Preview edited audio before saving
- [ ] Save as new file with custom name
- [ ] Option to replace original file
- [ ] Support for audio formats: MP3, AAC, FLAC, WAV
- [ ] Preserve audio quality (no re-encoding when possible)
- [ ] Undo/redo support during editing
- [ ] Keyboard shortcuts for precise control

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/` - Add edit option to context menu
- **New components:**
  - `frontend/src/components/Editor/AudioEditor.tsx` - Main editor component
  - `frontend/src/components/Editor/WaveformDisplay.tsx` - Audio waveform visualization
  - `frontend/src/components/Editor/TimelineControls.tsx` - Trim handles and timeline
  - `frontend/src/components/Editor/EditPreview.tsx` - Preview edited result
  - `frontend/src/components/Editor/CutRegions.tsx` - Manage cut sections
  - `frontend/src/hooks/useWaveform.ts` - Waveform generation logic
- **State changes:**
  - Add editor state for current project, regions, undo history

### Waveform Generation
```typescript
// useWaveform.ts
async function generateWaveform(
  audioUrl: string,
  samples: number = 1000
): Promise<number[]> {
  const audioContext = new AudioContext();
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Get audio data from first channel
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(channelData.length / samples);
  const waveform: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;

    // Get average amplitude for this block
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += Math.abs(channelData[j]);
    }
    waveform.push(sum / blockSize);
  }

  // Normalize to 0-1 range
  const max = Math.max(...waveform);
  return waveform.map(v => v / max);
}
```

### Waveform Display Component
```typescript
// WaveformDisplay.tsx
function WaveformDisplay({
  waveform,
  duration,
  currentTime,
  regions,
  onRegionChange
}: WaveformDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveform.length;

    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    waveform.forEach((amplitude, i) => {
      const x = i * barWidth;
      const barHeight = amplitude * height * 0.8;
      const y = (height - barHeight) / 2;

      // Color based on whether this section is cut
      const time = (i / waveform.length) * duration;
      const isCut = regions.some(r => r.type === 'cut' && time >= r.start && time <= r.end);

      ctx.fillStyle = isCut ? '#666' : '#6366f1';
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw trim handles
    regions.forEach(region => {
      if (region.type === 'trim') {
        const startX = (region.start / duration) * width;
        const endX = (region.end / duration) * width;

        // Dim areas outside trim region
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, startX, height);
        ctx.fillRect(endX, 0, width - endX, height);

        // Draw handles
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(startX - 2, 0, 4, height);
        ctx.fillRect(endX - 2, 0, 4, height);
      }
    });

    // Draw playhead
    const playheadX = (currentTime / duration) * width;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(playheadX - 1, 0, 2, height);
  }, [waveform, duration, currentTime, regions]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}
```

### Editor State
```typescript
interface EditRegion {
  id: string;
  type: 'trim' | 'cut';
  start: number;  // seconds
  end: number;    // seconds
}

interface EditorState {
  mediaId: string;
  originalDuration: number;
  regions: EditRegion[];
  history: EditRegion[][];  // For undo/redo
  historyIndex: number;

  addRegion: (region: Omit<EditRegion, 'id'>) => void;
  updateRegion: (id: string, updates: Partial<EditRegion>) => void;
  removeRegion: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/audio-editor.service.ts` - Audio processing
- **New endpoints:**
  - `POST /api/media/:id/edit/preview` - Generate preview of edits
  - `POST /api/media/:id/edit/save` - Apply edits and save

### Audio Processing Service
```typescript
// audio-editor.service.ts
import ffmpeg from 'fluent-ffmpeg';

class AudioEditorService {
  async applyEdits(
    mediaId: string,
    regions: EditRegion[],
    options: { saveAsNew: boolean; newName?: string }
  ): Promise<Media> {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    const inputPath = media.filePath;
    const outputPath = options.saveAsNew
      ? this.generateNewPath(media, options.newName)
      : this.generateTempPath(media);

    // Build FFmpeg filter complex for cuts and trims
    const filterComplex = this.buildFilterComplex(regions, media.duration);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .complexFilter(filterComplex)
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    if (!options.saveAsNew) {
      // Replace original
      await fs.rename(outputPath, inputPath);
      // Update duration in database
      const newDuration = await this.getAudioDuration(inputPath);
      await prisma.media.update({
        where: { id: mediaId },
        data: { duration: newDuration }
      });
      return prisma.media.findUnique({ where: { id: mediaId } });
    } else {
      // Create new media entry
      const newDuration = await this.getAudioDuration(outputPath);
      return prisma.media.create({
        data: {
          title: options.newName || `${media.title} (edited)`,
          artist: media.artist,
          album: media.album,
          filePath: outputPath,
          duration: newDuration,
          // ... copy other metadata
        }
      });
    }
  }

  private buildFilterComplex(regions: EditRegion[], totalDuration: number): string {
    // Sort regions by start time
    const sorted = [...regions].sort((a, b) => a.start - b.start);

    // Build segments to keep
    const segments: { start: number; end: number }[] = [];
    let currentStart = 0;

    // Apply trims first
    const trimRegion = sorted.find(r => r.type === 'trim');
    if (trimRegion) {
      currentStart = trimRegion.start;
      totalDuration = trimRegion.end;
    }

    // Apply cuts
    const cuts = sorted.filter(r => r.type === 'cut');
    for (const cut of cuts) {
      if (cut.start > currentStart) {
        segments.push({ start: currentStart, end: cut.start });
      }
      currentStart = cut.end;
    }
    if (currentStart < totalDuration) {
      segments.push({ start: currentStart, end: totalDuration });
    }

    // Build FFmpeg filter
    const filters = segments.map((seg, i) =>
      `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`
    );
    const concat = segments.map((_, i) => `[a${i}]`).join('') +
      `concat=n=${segments.length}:v=0:a=1[out]`;

    return filters.join(';') + ';' + concat;
  }
}
```

### Database Changes
- None required for basic implementation
- Optional: Store edit history for non-destructive editing

## Dependencies
- **Requires:** FFmpeg installed on server
- **Blocks:** None

## UI Design

### Editor Interface
```
┌─────────────────────────────────────────────────────┐
│ Edit: "Song Title"                          [Close] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂     │
│  |                                              |   │
│ 0:00                                          3:45  │
│                                                     │
│  [⏮] [⏯] [⏭]     [Zoom -] [====] [Zoom +]         │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Tools: [✂️ Cut] [⬌ Trim] [↩ Undo] [↪ Redo] [⟲ Reset]│
├─────────────────────────────────────────────────────┤
│ Regions:                                            │
│  • Trim: 0:05 - 3:40                      [Remove]  │
│  • Cut: 1:30 - 1:45 (ad removed)          [Remove]  │
├─────────────────────────────────────────────────────┤
│ [Cancel]   [Preview]   [Save as New] [Replace]     │
└─────────────────────────────────────────────────────┘
```

## Notes
- FFmpeg provides high-quality audio processing
- Consider WebAssembly ffmpeg for client-side processing (slower but no server needed)
- Non-destructive editing (save edit list only) is an alternative approach
- May want to add fade in/out at cut points to avoid clicks
- Consider batch editing for applying same edits to multiple files
- Support keyboard shortcuts: Space=play/pause, Left/Right=seek, I/O=set in/out points

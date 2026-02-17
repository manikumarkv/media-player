# Feature: Export to Drive

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Export all or selected songs to an external drive or folder for use with portable music players, car systems, or as backups. Supports organizing exports by folder structure, converting formats if needed, and syncing changes.

## User Stories
- As a user, I want to export my music to a USB drive so that I can play it in my car
- As a user, I want to choose which playlists/songs to export so that I don't copy everything
- As a user, I want to organize exports by artist/album so that they're easy to navigate
- As a user, I want to sync changes instead of re-exporting everything so that exports are quick

## Acceptance Criteria
- [ ] Export selected songs, playlists, or entire library
- [ ] Choose destination folder (including external drives)
- [ ] Organize by: flat, artist, album, artist/album hierarchy
- [ ] Option to convert format (MP3, AAC, FLAC)
- [ ] Progress indicator with estimated time
- [ ] Sync mode: only export new/changed files
- [ ] Generate M3U playlists for playlist exports
- [ ] Preserve or strip metadata options
- [ ] Handle filename conflicts (skip, overwrite, rename)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/` - Add export option
- **New components:**
  - `frontend/src/components/Export/ExportDialog.tsx` - Main export modal
  - `frontend/src/components/Export/ExportOptions.tsx` - Configuration options
  - `frontend/src/components/Export/ExportProgress.tsx` - Progress display
  - `frontend/src/components/Export/FolderPicker.tsx` - Destination selector
- **State changes:**
  - Add export state for tracking progress

### Export Dialog
```typescript
// ExportDialog.tsx
interface ExportOptions {
  source: 'all' | 'selected' | 'playlist';
  sourceIds?: string[];  // playlist or song IDs
  destination: string;   // folder path
  organization: 'flat' | 'artist' | 'album' | 'artist-album';
  format: 'original' | 'mp3' | 'aac' | 'flac';
  quality?: number;      // bitrate for converted files
  syncMode: boolean;     // only export new/changed
  generatePlaylists: boolean;
  conflictResolution: 'skip' | 'overwrite' | 'rename';
}

function ExportDialog({ isOpen, onClose, initialSelection }: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    source: initialSelection?.length ? 'selected' : 'all',
    sourceIds: initialSelection,
    destination: '',
    organization: 'artist-album',
    format: 'original',
    syncMode: true,
    generatePlaylists: true,
    conflictResolution: 'skip'
  });

  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleExport = async () => {
    const response = await api.post('/api/export', options);
    // Start polling for progress
    pollProgress(response.data.jobId);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Export Music</DialogTitle>
      <DialogContent>
        {progress ? (
          <ExportProgress progress={progress} />
        ) : (
          <ExportOptions options={options} onChange={setOptions} />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} disabled={!options.destination}>
          Export
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Folder Organization
```typescript
// Generate destination path based on organization setting
function getExportPath(
  media: Media,
  organization: ExportOptions['organization']
): string {
  const sanitize = (s: string) => s.replace(/[<>:"/\\|?*]/g, '_');

  switch (organization) {
    case 'flat':
      return sanitize(`${media.artist} - ${media.title}`);
    case 'artist':
      return `${sanitize(media.artist)}/${sanitize(media.title)}`;
    case 'album':
      return `${sanitize(media.album)}/${sanitize(media.title)}`;
    case 'artist-album':
      return `${sanitize(media.artist)}/${sanitize(media.album)}/${sanitize(media.title)}`;
  }
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/export.service.ts` - Export logic
- **New endpoints:**
  - `POST /api/export` - Start export job
  - `GET /api/export/:jobId/progress` - Get job progress
  - `DELETE /api/export/:jobId` - Cancel export job

### Export Service
```typescript
// export.service.ts
class ExportService {
  async startExport(options: ExportOptions): Promise<string> {
    const jobId = generateJobId();

    // Get media to export
    const media = await this.getMediaToExport(options);

    // Start background job
    this.runExportJob(jobId, media, options);

    return jobId;
  }

  private async runExportJob(
    jobId: string,
    media: Media[],
    options: ExportOptions
  ): Promise<void> {
    const progress: ExportProgress = {
      total: media.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      currentFile: '',
      status: 'running'
    };

    // Store progress for polling
    await this.setProgress(jobId, progress);

    for (const item of media) {
      progress.currentFile = item.title;
      await this.setProgress(jobId, progress);

      try {
        const exported = await this.exportSingleFile(item, options);
        if (exported === 'skipped') {
          progress.skipped++;
        } else {
          progress.completed++;
        }
      } catch (error) {
        progress.failed++;
        // Log error but continue
      }

      await this.setProgress(jobId, progress);
    }

    // Generate playlists if requested
    if (options.generatePlaylists) {
      await this.generateM3UPlaylists(options);
    }

    progress.status = 'complete';
    await this.setProgress(jobId, progress);
  }

  private async exportSingleFile(
    media: Media,
    options: ExportOptions
  ): Promise<'exported' | 'skipped'> {
    const destPath = path.join(
      options.destination,
      getExportPath(media, options.organization) + this.getExtension(options.format, media)
    );

    // Check if file exists
    if (await fs.pathExists(destPath)) {
      if (options.syncMode) {
        // Check if source is newer
        const sourceStats = await fs.stat(media.filePath);
        const destStats = await fs.stat(destPath);
        if (sourceStats.mtime <= destStats.mtime) {
          return 'skipped';
        }
      }

      switch (options.conflictResolution) {
        case 'skip':
          return 'skipped';
        case 'overwrite':
          // Continue to export
          break;
        case 'rename':
          destPath = this.getUniquePath(destPath);
          break;
      }
    }

    // Create destination directory
    await fs.ensureDir(path.dirname(destPath));

    // Copy or convert
    if (options.format === 'original') {
      await fs.copy(media.filePath, destPath);
    } else {
      await this.convertAndCopy(media.filePath, destPath, options);
    }

    return 'exported';
  }

  private async convertAndCopy(
    source: string,
    dest: string,
    options: ExportOptions
  ): Promise<void> {
    const codecMap = {
      mp3: 'libmp3lame',
      aac: 'aac',
      flac: 'flac'
    };

    await new Promise<void>((resolve, reject) => {
      ffmpeg(source)
        .audioCodec(codecMap[options.format])
        .audioBitrate(options.quality || 320)
        .output(dest)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
  }

  private async generateM3UPlaylists(options: ExportOptions): Promise<void> {
    if (options.source !== 'playlist') return;

    for (const playlistId of options.sourceIds) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
        include: { items: { include: { media: true } } }
      });

      const m3uContent = this.generateM3U(playlist, options);
      const m3uPath = path.join(options.destination, `${playlist.name}.m3u`);
      await fs.writeFile(m3uPath, m3uContent);
    }
  }

  private generateM3U(playlist: Playlist, options: ExportOptions): string {
    let content = '#EXTM3U\n';

    for (const item of playlist.items) {
      const relativePath = getExportPath(item.media, options.organization) +
        this.getExtension(options.format, item.media);

      content += `#EXTINF:${Math.round(item.media.duration)},${item.media.artist} - ${item.media.title}\n`;
      content += `${relativePath}\n`;
    }

    return content;
  }
}
```

### Database Changes
- None required for basic implementation
- Optional: Store export history for sync tracking

## Dependencies
- **Requires:** FFmpeg for format conversion
- **Blocks:** None

## UI Design

### Export Dialog
```
┌─────────────────────────────────────────────────────┐
│ Export Music                                [Close] │
├─────────────────────────────────────────────────────┤
│ Source:                                             │
│ ○ Entire library (1,234 songs)                     │
│ ○ Selected songs (15 songs)                        │
│ ● Playlist: [Summer Vibes ▼] (45 songs)            │
│                                                     │
│ Destination:                                        │
│ [/Volumes/USB_DRIVE/Music               ] [Browse] │
│                                                     │
│ Organization:                                       │
│ [Artist / Album ▼]                                 │
│                                                     │
│ Format:                                             │
│ ● Keep original format                              │
│ ○ Convert to: [MP3 ▼] [320 kbps ▼]                │
│                                                     │
│ Options:                                            │
│ ☑ Sync mode (only export new/changed)              │
│ ☑ Generate M3U playlists                           │
│ If file exists: [Skip ▼]                           │
├─────────────────────────────────────────────────────┤
│ [Cancel]                               [Export]     │
└─────────────────────────────────────────────────────┘
```

### Progress Display
```
┌─────────────────────────────────────────────────────┐
│ Exporting...                                        │
├─────────────────────────────────────────────────────┤
│ ████████████░░░░░░░░░░░░░░░░░░  45%                │
│                                                     │
│ Current: Artist - Song Title.mp3                   │
│                                                     │
│ Completed: 45 / 100                                │
│ Skipped: 12 (already up to date)                   │
│ Failed: 0                                          │
│                                                     │
│ Estimated time remaining: ~2 minutes               │
├─────────────────────────────────────────────────────┤
│ [Cancel Export]                                     │
└─────────────────────────────────────────────────────┘
```

## Notes
- Consider web-based folder picker limitations (may need Electron for full access)
- Could use File System Access API for browser-based folder selection
- May want to add export presets (e.g., "Car USB", "Phone")
- Consider normalizing volume levels during export
- Handle very long paths/filenames that exceed OS limits
- May want to export album art as folder.jpg in each album folder

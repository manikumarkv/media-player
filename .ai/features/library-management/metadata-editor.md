# Feature: Metadata Editor

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Edit ID3 tags, album art, and song metadata directly in the app. Allows users to correct incorrect metadata, add missing information, and maintain a well-organized library.

## User Stories
- As a user, I want to edit song titles and artist names so that I can fix incorrect metadata
- As a user, I want to add or change album art so that my library looks better
- As a user, I want to edit multiple songs at once so that I can fix entire albums quickly
- As a user, I want changes to be saved to the actual file so that they persist when I export

## Acceptance Criteria
- [ ] Edit single song metadata (title, artist, album, year, genre, track number)
- [ ] Batch edit multiple songs (common fields)
- [ ] Change album art (upload, paste, or search online)
- [ ] Preview changes before saving
- [ ] Write changes to file ID3 tags
- [ ] Undo changes (within session)
- [ ] Auto-capitalize and clean up common formatting issues
- [ ] Suggest metadata from filename patterns
- [ ] Search and apply metadata from online databases (optional)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/` - Add edit option to context menu
- **New components:**
  - `frontend/src/components/Metadata/MetadataEditor.tsx` - Main editor dialog
  - `frontend/src/components/Metadata/SingleSongEditor.tsx` - Single song form
  - `frontend/src/components/Metadata/BatchEditor.tsx` - Batch edit form
  - `frontend/src/components/Metadata/AlbumArtPicker.tsx` - Album art selection
  - `frontend/src/components/Metadata/MetadataPreview.tsx` - Preview changes
- **State changes:**
  - Add editor state for pending changes

### Metadata Editor Component
```typescript
// MetadataEditor.tsx
interface EditableMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  year?: number;
  genre?: string;
  trackNumber?: number;
  totalTracks?: number;
  discNumber?: number;
  composer?: string;
  comment?: string;
  albumArt?: File | string;  // File for upload, string for URL
}

function MetadataEditor({ mediaIds, onClose }: MetadataEditorProps) {
  const [changes, setChanges] = useState<EditableMetadata>({});
  const [loading, setLoading] = useState(false);

  const isBatchEdit = mediaIds.length > 1;
  const [media, setMedia] = useState<Media[]>([]);

  useEffect(() => {
    // Load current metadata
    Promise.all(mediaIds.map(id => api.get(`/api/media/${id}`)))
      .then(responses => setMedia(responses.map(r => r.data)));
  }, [mediaIds]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isBatchEdit) {
        await api.patch('/api/media/batch/metadata', {
          ids: mediaIds,
          changes
        });
      } else {
        await api.patch(`/api/media/${mediaIds[0]}/metadata`, changes);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} className="max-w-2xl">
      <DialogTitle>
        {isBatchEdit ? `Edit ${mediaIds.length} Songs` : 'Edit Metadata'}
      </DialogTitle>
      <DialogContent>
        {isBatchEdit ? (
          <BatchEditor
            songs={media}
            changes={changes}
            onChange={setChanges}
          />
        ) : (
          <SingleSongEditor
            song={media[0]}
            changes={changes}
            onChange={setChanges}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="secondary">Cancel</Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Single Song Editor
```typescript
// SingleSongEditor.tsx
function SingleSongEditor({ song, changes, onChange }: SingleSongEditorProps) {
  const merged = { ...song, ...changes };

  const handleChange = (field: keyof EditableMetadata, value: any) => {
    onChange({ ...changes, [field]: value });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 flex gap-4">
        <AlbumArtPicker
          current={merged.albumArt || song.albumArtPath}
          onChange={(art) => handleChange('albumArt', art)}
        />
        <div className="flex-1 space-y-3">
          <Input
            label="Title"
            value={merged.title}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <Input
            label="Artist"
            value={merged.artist}
            onChange={(e) => handleChange('artist', e.target.value)}
          />
        </div>
      </div>

      <Input
        label="Album"
        value={merged.album}
        onChange={(e) => handleChange('album', e.target.value)}
      />
      <Input
        label="Album Artist"
        value={merged.albumArtist}
        onChange={(e) => handleChange('albumArtist', e.target.value)}
      />

      <Input
        label="Year"
        type="number"
        value={merged.year}
        onChange={(e) => handleChange('year', parseInt(e.target.value))}
      />
      <Input
        label="Genre"
        value={merged.genre}
        onChange={(e) => handleChange('genre', e.target.value)}
      />

      <div className="flex gap-2">
        <Input
          label="Track"
          type="number"
          value={merged.trackNumber}
          onChange={(e) => handleChange('trackNumber', parseInt(e.target.value))}
          className="w-20"
        />
        <span className="self-end pb-2">/</span>
        <Input
          label="Total"
          type="number"
          value={merged.totalTracks}
          onChange={(e) => handleChange('totalTracks', parseInt(e.target.value))}
          className="w-20"
        />
      </div>

      <Input
        label="Disc"
        type="number"
        value={merged.discNumber}
        onChange={(e) => handleChange('discNumber', parseInt(e.target.value))}
      />

      <Input
        label="Composer"
        value={merged.composer}
        onChange={(e) => handleChange('composer', e.target.value)}
        className="col-span-2"
      />
    </div>
  );
}
```

### Album Art Picker
```typescript
// AlbumArtPicker.tsx
function AlbumArtPicker({ current, onChange }: AlbumArtPickerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          const blob = await item.getType(item.types[0]);
          const file = new File([blob], 'album-art.jpg', { type: blob.type });
          setPreview(URL.createObjectURL(file));
          onChange(file);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to paste image');
    }
  };

  const displaySrc = preview || current;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-32 h-32 bg-bg-secondary rounded flex items-center justify-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {displaySrc ? (
          <img src={displaySrc} className="w-full h-full object-cover rounded" />
        ) : (
          <ImageIcon className="w-8 h-8 text-text-muted" />
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" onClick={() => fileInputRef.current?.click()}>
          Upload
        </Button>
        <Button size="sm" variant="secondary" onClick={handlePaste}>
          Paste
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Add metadata update methods
  - `backend/src/controllers/media.controller.ts` - Add metadata endpoints
- **New endpoints:**
  - `PATCH /api/media/:id/metadata` - Update single song metadata
  - `PATCH /api/media/batch/metadata` - Update multiple songs

### Metadata Service
```typescript
// Using music-metadata and node-id3 for tag writing
import * as mm from 'music-metadata';
import NodeID3 from 'node-id3';

class MetadataService {
  async updateMetadata(mediaId: string, changes: EditableMetadata): Promise<Media> {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });

    // Handle album art upload
    let albumArtPath = media.albumArtPath;
    if (changes.albumArt) {
      albumArtPath = await this.saveAlbumArt(changes.albumArt, mediaId);
    }

    // Update database
    const updated = await prisma.media.update({
      where: { id: mediaId },
      data: {
        title: changes.title ?? media.title,
        artist: changes.artist ?? media.artist,
        album: changes.album ?? media.album,
        year: changes.year ?? media.year,
        genre: changes.genre ?? media.genre,
        trackNumber: changes.trackNumber ?? media.trackNumber,
        albumArtPath
      }
    });

    // Update file ID3 tags
    await this.writeTagsToFile(media.filePath, changes, albumArtPath);

    return updated;
  }

  private async writeTagsToFile(
    filePath: string,
    changes: EditableMetadata,
    albumArtPath?: string
  ): Promise<void> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.mp3') {
      const tags: NodeID3.Tags = {};

      if (changes.title) tags.title = changes.title;
      if (changes.artist) tags.artist = changes.artist;
      if (changes.album) tags.album = changes.album;
      if (changes.year) tags.year = String(changes.year);
      if (changes.genre) tags.genre = changes.genre;
      if (changes.trackNumber) tags.trackNumber = String(changes.trackNumber);

      if (albumArtPath) {
        tags.image = {
          mime: 'image/jpeg',
          type: { id: 3, name: 'front cover' },
          description: 'Album Art',
          imageBuffer: await fs.readFile(albumArtPath)
        };
      }

      NodeID3.update(tags, filePath);
    } else if (ext === '.flac' || ext === '.ogg') {
      // Use mutagen or ffmpeg for other formats
      await this.writeTagsWithFFmpeg(filePath, changes, albumArtPath);
    }
  }

  async updateBatch(ids: string[], changes: EditableMetadata): Promise<void> {
    for (const id of ids) {
      await this.updateMetadata(id, changes);
    }
  }
}
```

### Database Changes
- None required - uses existing media schema

## Dependencies
- **Requires:** node-id3 or similar for ID3 tag writing
- **Blocks:** None

## UI Design

### Single Song Editor
```
┌─────────────────────────────────────────────────────┐
│ Edit Metadata                               [Close] │
├─────────────────────────────────────────────────────┤
│ ┌────────┐  Title:    [Song Title            ]     │
│ │        │  Artist:   [Artist Name           ]     │
│ │ Album  │                                          │
│ │  Art   │  Album:    [Album Name            ]     │
│ │        │  Album Artist: [Album Artist       ]     │
│ └────────┘                                          │
│ [Upload] [Paste]                                    │
│                                                     │
│ Year:  [2023  ]    Genre: [Rock              ]     │
│ Track: [5 ] / [12]  Disc:  [1  ]                   │
│ Composer: [Composer Name                     ]     │
├─────────────────────────────────────────────────────┤
│ [Cancel]                               [Save]       │
└─────────────────────────────────────────────────────┘
```

### Batch Editor
```
┌─────────────────────────────────────────────────────┐
│ Edit 5 Songs                                [Close] │
├─────────────────────────────────────────────────────┤
│ Common fields will be applied to all selected songs │
│                                                     │
│ ☑ Artist:  [Various Artists         ]             │
│ ☑ Album:   [Greatest Hits           ]             │
│ ☐ Year:    [                        ]             │
│ ☑ Genre:   [Pop                     ]             │
│ ☑ Album Art: [No Change ▼]                        │
│                                                     │
│ Preview:                                            │
│ • Song 1 - Old Artist → Various Artists            │
│ • Song 2 - Old Artist → Various Artists            │
│ • ...                                               │
├─────────────────────────────────────────────────────┤
│ [Cancel]                          [Apply to All]    │
└─────────────────────────────────────────────────────┘
```

## Notes
- Consider MusicBrainz integration for auto-fetching metadata
- May want to support album art search via Discogs, Last.fm
- Handle encoding issues with special characters
- Support embedded lyrics editing (future)
- Consider undo history for metadata changes
- May want to show "revert to original" option per field

# Feature: Delete Songs

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P1 (Critical)

## Complexity
Low

## Overview
Delete downloaded songs from the library and remove the associated files from disk. Essential library management feature that allows users to free up storage space and remove unwanted tracks.

## User Stories
- As a user, I want to delete songs I no longer want so that I can free up storage space
- As a user, I want to select multiple songs for batch deletion so that I can clean up efficiently
- As a user, I want a confirmation before deletion so that I don't accidentally delete songs
- As a user, I want to see how much space will be freed so that I can make informed decisions

## Acceptance Criteria
- [ ] Delete single song from context menu
- [ ] Multi-select songs for batch deletion
- [ ] Confirmation dialog before deletion
- [ ] Show file size(s) that will be freed
- [ ] Remove from database and file system
- [ ] Remove from all playlists containing the song
- [ ] Update currently playing queue if deleted song is present
- [ ] Handle deletion of currently playing song gracefully
- [ ] Undo option (within 10 seconds or until page navigation)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Library/SongList.tsx` - Add delete option
  - `frontend/src/components/Library/SongContextMenu.tsx` - Add delete menu item
  - `frontend/src/stores/libraryStore.ts` - Add selection and delete actions
- **New components:**
  - `frontend/src/components/Library/DeleteConfirmDialog.tsx` - Confirmation modal
  - `frontend/src/components/Library/MultiSelectToolbar.tsx` - Batch actions toolbar
- **State changes:**
  - Add `selectedSongIds: Set<string>` to library store
  - Add `isSelectionMode: boolean`

### Delete Confirmation Dialog
```typescript
// DeleteConfirmDialog.tsx
interface DeleteConfirmDialogProps {
  songs: Media[];
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({ songs, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  const totalSize = songs.reduce((sum, song) => sum + (song.fileSize || 0), 0);
  const isSingle = songs.length === 1;

  return (
    <Dialog open onClose={onCancel}>
      <DialogTitle>
        Delete {isSingle ? 'Song' : `${songs.length} Songs`}?
      </DialogTitle>
      <DialogContent>
        {isSingle ? (
          <div className="flex items-center gap-3">
            <img src={songs[0].albumArt} className="w-12 h-12 rounded" />
            <div>
              <p className="font-medium">{songs[0].title}</p>
              <p className="text-sm text-text-secondary">{songs[0].artist}</p>
            </div>
          </div>
        ) : (
          <ul className="max-h-48 overflow-y-auto">
            {songs.map(song => (
              <li key={song.id} className="py-1">{song.title} - {song.artist}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-text-secondary">
          This will permanently delete {isSingle ? 'this song' : 'these songs'} and
          free up {formatFileSize(totalSize)} of storage.
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button onClick={onConfirm} variant="destructive">Delete</Button>
      </DialogActions>
    </Dialog>
  );
}
```

### Multi-Select Mode
```typescript
// libraryStore.ts
interface LibraryState {
  selectedSongIds: Set<string>;
  isSelectionMode: boolean;

  toggleSelection: (songId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  deleteSelected: () => Promise<void>;
}

const useLibraryStore = create<LibraryState>((set, get) => ({
  selectedSongIds: new Set(),
  isSelectionMode: false,

  toggleSelection: (songId) => {
    set(state => {
      const newSet = new Set(state.selectedSongIds);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return { selectedSongIds: newSet };
    });
  },

  selectAll: () => {
    const { songs } = get();
    set({ selectedSongIds: new Set(songs.map(s => s.id)) });
  },

  clearSelection: () => {
    set({ selectedSongIds: new Set(), isSelectionMode: false });
  },

  deleteSelected: async () => {
    const { selectedSongIds } = get();
    const ids = Array.from(selectedSongIds);

    try {
      await api.delete('/api/media/batch', { data: { ids } });
      // Remove from local state
      set(state => ({
        songs: state.songs.filter(s => !selectedSongIds.has(s.id)),
        selectedSongIds: new Set(),
        isSelectionMode: false
      }));
    } catch (error) {
      // Handle error
    }
  }
}));
```

### Backend Changes
- **Files to modify:**
  - `backend/src/services/media.service.ts` - Add delete methods
  - `backend/src/controllers/media.controller.ts` - Add delete endpoints
  - `backend/src/routes/media.routes.ts` - Add delete routes
- **New endpoints:**
  - `DELETE /api/media/:id` - Delete single song
  - `DELETE /api/media/batch` - Delete multiple songs

### Service Implementation
```typescript
// media.service.ts
class MediaService {
  async deleteMedia(id: string): Promise<void> {
    // Get media to find file path
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new NotFoundError('Media not found');
    }

    // Delete from playlists first (foreign key)
    await prisma.playlistItem.deleteMany({
      where: { mediaId: id }
    });

    // Delete from database
    await prisma.media.delete({ where: { id } });

    // Delete file from disk
    if (media.filePath) {
      await fs.unlink(media.filePath).catch(() => {
        // Log but don't fail if file doesn't exist
        console.warn(`File not found: ${media.filePath}`);
      });
    }

    // Delete album art if not shared with other tracks
    if (media.albumArtPath) {
      const othersWithSameArt = await prisma.media.count({
        where: { albumArtPath: media.albumArtPath }
      });
      if (othersWithSameArt === 0) {
        await fs.unlink(media.albumArtPath).catch(() => {});
      }
    }
  }

  async deleteMediaBatch(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        await this.deleteMedia(id);
        deleted++;
      } catch (error) {
        failed.push(id);
      }
    }

    return { deleted, failed };
  }
}
```

### Controller Implementation
```typescript
// media.controller.ts
class MediaController {
  async deleteMedia(req: Request, res: Response) {
    const { id } = req.params;
    await mediaService.deleteMedia(id);
    res.status(204).send();
  }

  async deleteMediaBatch(req: Request, res: Response) {
    const { ids } = req.body;
    const result = await mediaService.deleteMediaBatch(ids);
    res.json(result);
  }
}

// Validation schema
const deleteMediaBatchSchema = z.object({
  ids: z.array(z.string()).min(1).max(100)
});
```

### Database Changes
- None required - uses existing schema with cascade deletes

## Dependencies
- **Requires:** Core library functionality
- **Blocks:** None

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Delete currently playing song | Stop playback, skip to next, or clear queue |
| Delete song in active queue | Remove from queue, don't affect playback |
| Delete last song in playlist | Playlist becomes empty |
| File already deleted | Mark as deleted in DB anyway |
| Partial batch failure | Return list of failed IDs, continue with others |

## Undo Implementation (Optional Enhancement)
```typescript
// Soft delete approach - move to trash
interface TrashedMedia {
  media: Media;
  deletedAt: Date;
  originalPath: string;
}

// Keep in memory for quick undo
const trashBin: Map<string, TrashedMedia> = new Map();

// Auto-purge after 30 seconds
function scheduleTrashPurge(id: string) {
  setTimeout(() => {
    const item = trashBin.get(id);
    if (item) {
      fs.unlink(item.originalPath);
      trashBin.delete(id);
    }
  }, 30000);
}
```

## Notes
- Consider "soft delete" with trash/recycle bin for recovery
- May want to preserve file for a grace period before physical deletion
- Handle storage quota updates after deletion
- Consider bulk operations for deleting entire albums or artists
- May need to handle shared files (same audio file, multiple metadata entries)

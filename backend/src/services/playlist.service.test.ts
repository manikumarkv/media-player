import { describe, it, expect, beforeEach } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

const { playlistService } = await import('./playlist.service.js');

describe('playlistService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('findAll', () => {
    it('should return all non-system playlists with pagination', async () => {
      const mockPlaylists = [
        { id: '1', name: 'Playlist 1', isSystem: false },
        { id: '2', name: 'Playlist 2', isSystem: false },
      ];
      mockPrisma.playlist.findMany.mockResolvedValue(mockPlaylists);
      mockPrisma.playlist.count.mockResolvedValue(2);

      const result = await playlistService.findAll();

      expect(result.data).toEqual(mockPlaylists);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.playlist.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isSystem: false },
        })
      );
    });
  });

  describe('findById', () => {
    it('should return playlist by id', async () => {
      const mockPlaylist = { id: '1', name: 'My Playlist' };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);

      const result = await playlistService.findById('1');

      expect(result).toEqual(mockPlaylist);
    });

    it('should throw NotFoundError if not found', async () => {
      mockPrisma.playlist.findUnique.mockResolvedValue(null);

      await expect(playlistService.findById('999')).rejects.toThrow();
    });
  });

  describe('findByIdWithItems', () => {
    it('should return playlist with items', async () => {
      const mockPlaylist = {
        id: '1',
        name: 'My Playlist',
        items: [{ id: 'i1', media: { id: 'm1', title: 'Song' } }],
      };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);

      const result = await playlistService.findByIdWithItems('1');

      expect(result).toEqual(mockPlaylist);
      expect(mockPrisma.playlist.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            items: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('should create new playlist', async () => {
      const mockPlaylist = { id: '1', name: 'New Playlist', isSystem: false };
      mockPrisma.playlist.create.mockResolvedValue(mockPlaylist);

      const result = await playlistService.create({ name: 'New Playlist' });

      expect(result).toEqual(mockPlaylist);
      expect(mockPrisma.playlist.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Playlist',
          isSystem: false,
        }),
      });
    });
  });

  describe('update', () => {
    it('should update playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Original', isSystem: false };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.playlist.update.mockResolvedValue({ ...mockPlaylist, name: 'Updated' });

      const result = await playlistService.update('1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw error for system playlist', async () => {
      const mockPlaylist = { id: '1', name: 'System', isSystem: true };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);

      await expect(playlistService.update('1', { name: 'Test' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Playlist', isSystem: false };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.playlist.delete.mockResolvedValue(mockPlaylist);

      await playlistService.delete('1');

      expect(mockPrisma.playlist.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw error for system playlist', async () => {
      const mockPlaylist = { id: '1', name: 'System', isSystem: true };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);

      await expect(playlistService.delete('1')).rejects.toThrow();
    });
  });

  describe('addItem', () => {
    it('should add item to playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Playlist', isSystem: false };
      const mockMedia = { id: 'm1', title: 'Song' };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.playlistItem.findUnique.mockResolvedValue(null);
      mockPrisma.playlistItem.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.playlistItem.create.mockResolvedValue({ id: 'i1' });

      await playlistService.addItem('1', 'm1');

      expect(mockPrisma.playlistItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          playlistId: '1',
          mediaId: 'm1',
          position: 1,
        }),
      });
    });

    it('should throw error if media already in playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Playlist', isSystem: false };
      const mockMedia = { id: 'm1', title: 'Song' };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.playlistItem.findUnique.mockResolvedValue({ id: 'i1' });

      await expect(playlistService.addItem('1', 'm1')).rejects.toThrow();
    });
  });

  describe('removeItem', () => {
    it('should remove item from playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Playlist', isSystem: false };
      const mockItem = { id: 'i1', position: 2 };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.playlistItem.findUnique.mockResolvedValue(mockItem);
      mockPrisma.playlistItem.delete.mockResolvedValue(mockItem);
      mockPrisma.playlistItem.updateMany.mockResolvedValue({ count: 1 });

      await playlistService.removeItem('1', 'm1');

      expect(mockPrisma.playlistItem.delete).toHaveBeenCalled();
    });
  });

  describe('clearPlaylist', () => {
    it('should clear all items from playlist', async () => {
      const mockPlaylist = { id: '1', name: 'Playlist', isSystem: false, items: [] };
      mockPrisma.playlist.findUnique.mockResolvedValue(mockPlaylist);
      mockPrisma.playlistItem.deleteMany.mockResolvedValue({ count: 5 });

      await playlistService.clearPlaylist('1');

      expect(mockPrisma.playlistItem.deleteMany).toHaveBeenCalledWith({
        where: { playlistId: '1' },
      });
    });
  });

  describe('getItemCount', () => {
    it('should return item count', async () => {
      mockPrisma.playlistItem.count.mockResolvedValue(10);

      const result = await playlistService.getItemCount('1');

      expect(result).toBe(10);
    });
  });

  describe('getTotalDuration', () => {
    it('should return total duration', async () => {
      mockPrisma.playlistItem.findMany.mockResolvedValue([
        { media: { duration: 180 } },
        { media: { duration: 240 } },
      ]);

      const result = await playlistService.getTotalDuration('1');

      expect(result).toBe(420);
    });
  });
});

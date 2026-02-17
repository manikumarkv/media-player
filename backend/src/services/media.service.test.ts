import { describe, it, expect, beforeEach } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

const { mediaService } = await import('./media.service.js');

describe('mediaService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('findAll', () => {
    it('should return all media with default pagination', async () => {
      const mockMedia = [
        { id: '1', title: 'Song 1', duration: 180 },
        { id: '2', title: 'Song 2', duration: 200 },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockMedia);
      mockPrisma.media.count.mockResolvedValue(2);

      const result = await mediaService.findAll({});

      expect(result.data).toEqual(mockMedia);
      expect(result.pagination.total).toBe(2);
      expect(mockPrisma.media.findMany).toHaveBeenCalled();
    });

    it('should filter by query', async () => {
      mockPrisma.media.findMany.mockResolvedValue([]);
      mockPrisma.media.count.mockResolvedValue(0);

      await mediaService.findAll({ query: 'test' });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: expect.any(Object) }),
            ]),
          }),
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrisma.media.findMany.mockResolvedValue([]);
      mockPrisma.media.count.mockResolvedValue(100);

      await mediaService.findAll({ page: 2, limit: 10 });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should filter by isLiked', async () => {
      mockPrisma.media.findMany.mockResolvedValue([]);
      mockPrisma.media.count.mockResolvedValue(0);

      await mediaService.findAll({ isLiked: true });

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isLiked: true,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('should return media by id', async () => {
      const mockMedia = { id: '1', title: 'Song 1' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);

      const result = await mediaService.findById('1');

      expect(result).toEqual(mockMedia);
      expect(mockPrisma.media.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundError if media not found', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      await expect(mediaService.findById('999')).rejects.toThrow();
    });
  });

  describe('findBySourceId', () => {
    it('should return media by source id', async () => {
      const mockMedia = { id: '1', sourceId: 'yt123' };
      mockPrisma.media.findFirst.mockResolvedValue(mockMedia);

      const result = await mediaService.findBySourceId('yt123');

      expect(result).toEqual(mockMedia);
    });

    it('should return null if not found', async () => {
      mockPrisma.media.findFirst.mockResolvedValue(null);

      const result = await mediaService.findBySourceId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new media', async () => {
      const input = {
        title: 'New Song',
        duration: 180,
        filePath: '/media/song.opus',
        mimeType: 'audio/opus',
        fileSize: 1000000,
      };
      const mockMedia = { id: '1', ...input };
      mockPrisma.media.create.mockResolvedValue(mockMedia);

      const result = await mediaService.create(input);

      expect(result).toEqual(mockMedia);
      expect(mockPrisma.media.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update existing media', async () => {
      const mockMedia = { id: '1', title: 'Original' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.update.mockResolvedValue({ ...mockMedia, title: 'Updated' });

      const result = await mediaService.update('1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundError if media not found', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      await expect(mediaService.update('999', { title: 'Test' })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete media', async () => {
      const mockMedia = { id: '1', title: 'Song' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.delete.mockResolvedValue(mockMedia);

      await mediaService.delete('1');

      expect(mockPrisma.media.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('toggleLike', () => {
    it('should toggle like status from false to true', async () => {
      const mockMedia = { id: '1', isLiked: false };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.update.mockResolvedValue({ ...mockMedia, isLiked: true });

      const result = await mediaService.toggleLike('1');

      expect(result.isLiked).toBe(true);
      expect(mockPrisma.media.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isLiked: true },
      });
    });

    it('should toggle like status from true to false', async () => {
      const mockMedia = { id: '1', isLiked: true };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.update.mockResolvedValue({ ...mockMedia, isLiked: false });

      const result = await mediaService.toggleLike('1');

      expect(result.isLiked).toBe(false);
    });
  });

  describe('incrementPlayCount', () => {
    it('should increment play count', async () => {
      const mockMedia = { id: '1', playCount: 5 };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.media.update.mockResolvedValue({ ...mockMedia, playCount: 6 });

      const result = await mediaService.incrementPlayCount('1');

      expect(result.playCount).toBe(6);
    });
  });

  describe('getLiked', () => {
    it('should return only liked media', async () => {
      const mockMedia = [{ id: '1', isLiked: true }];
      mockPrisma.media.findMany.mockResolvedValue(mockMedia);
      mockPrisma.media.count.mockResolvedValue(1);

      const result = await mediaService.getLiked({});

      expect(mockPrisma.media.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isLiked: true,
          }),
        })
      );
    });
  });

  describe('getRecentlyAdded', () => {
    it('should return recently added media', async () => {
      const mockMedia = [{ id: '1', title: 'New Song' }];
      mockPrisma.media.findMany.mockResolvedValue(mockMedia);

      const result = await mediaService.getRecentlyAdded(5);

      expect(result).toEqual(mockMedia);
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('getMostPlayed', () => {
    it('should return most played media', async () => {
      const mockMedia = [{ id: '1', playCount: 100 }];
      mockPrisma.media.findMany.mockResolvedValue(mockMedia);

      const result = await mediaService.getMostPlayed(5);

      expect(result).toEqual(mockMedia);
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: { playCount: { gt: 0 } },
        orderBy: { playCount: 'desc' },
        take: 5,
      });
    });
  });

  describe('getStats', () => {
    it('should return media statistics', async () => {
      mockPrisma.media.aggregate.mockResolvedValue({
        _count: { id: 10 },
        _sum: { duration: 3600, fileSize: 100000000 },
      });
      mockPrisma.media.count.mockResolvedValue(5);

      const result = await mediaService.getStats();

      expect(result).toEqual({
        totalCount: 10,
        totalDuration: 3600,
        totalSize: 100000000,
        likedCount: 5,
      });
    });
  });
});

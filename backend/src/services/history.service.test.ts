import { describe, it, expect, beforeEach } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

const { historyService } = await import('./history.service.js');

describe('historyService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('getAll', () => {
    it('should return play history with media', async () => {
      const mockHistory = [
        { id: '1', mediaId: 'm1', playedAt: new Date(), media: { title: 'Song 1' } },
      ];
      mockPrisma.playHistory.findMany.mockResolvedValue(mockHistory);
      mockPrisma.playHistory.count.mockResolvedValue(1);

      const result = await historyService.getAll({});

      expect(result.data).toEqual(mockHistory);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { media: true },
          orderBy: { playedAt: 'desc' },
        })
      );
    });

    it('should apply pagination', async () => {
      mockPrisma.playHistory.findMany.mockResolvedValue([]);
      mockPrisma.playHistory.count.mockResolvedValue(100);

      await historyService.getAll({ page: 2, limit: 20 });

      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });

  describe('getByDate', () => {
    it('should filter by date range', async () => {
      mockPrisma.playHistory.findMany.mockResolvedValue([]);
      mockPrisma.playHistory.count.mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await historyService.getByDate(startDate, endDate);

      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            playedAt: expect.objectContaining({
              gte: startDate,
              lte: endDate,
            }),
          }),
        })
      );
    });
  });

  describe('recordPlay', () => {
    it('should create play history entry', async () => {
      const mockMedia = { id: 'm1', title: 'Song' };
      const mockEntry = { id: '1', mediaId: 'm1', playedAt: new Date(), duration: 180, media: mockMedia };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.playHistory.create.mockResolvedValue(mockEntry);
      mockPrisma.media.update.mockResolvedValue({ ...mockMedia, playCount: 1 });

      const result = await historyService.recordPlay('m1', 180);

      expect(result).toEqual(mockEntry);
      expect(mockPrisma.playHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mediaId: 'm1',
          duration: 180,
        }),
        include: { media: true },
      });
    });

    it('should throw error if media not found', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      await expect(historyService.recordPlay('nonexistent', 180)).rejects.toThrow();
    });
  });

  describe('getRecent', () => {
    it('should return recent history entries', async () => {
      const mockHistory = [{ id: '1', media: { title: 'Song' } }];
      mockPrisma.playHistory.findMany.mockResolvedValue(mockHistory);

      const result = await historyService.getRecent(10);

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          orderBy: { playedAt: 'desc' },
        })
      );
    });
  });

  describe('getToday', () => {
    it('should return today\'s history', async () => {
      const mockHistory = [{ id: '1' }];
      mockPrisma.playHistory.findMany.mockResolvedValue(mockHistory);

      const result = await historyService.getToday();

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            playedAt: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('getStats', () => {
    it('should return play statistics', async () => {
      mockPrisma.playHistory.aggregate.mockResolvedValue({
        _count: { id: 100 },
        _sum: { duration: 18000 },
      });
      mockPrisma.playHistory.groupBy.mockResolvedValue([
        { mediaId: 'm1', _count: 10 },
        { mediaId: 'm2', _count: 5 },
      ]);

      const result = await historyService.getStats();

      expect(result).toEqual({
        totalPlays: 100,
        totalListenTime: 18000,
        uniqueTracks: 2,
      });
    });
  });

  describe('clear', () => {
    it('should clear all history', async () => {
      mockPrisma.playHistory.deleteMany.mockResolvedValue({ count: 50 });

      await historyService.clear();

      expect(mockPrisma.playHistory.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getHistoryForMedia', () => {
    it('should return history for specific media', async () => {
      const mockHistory = [{ id: '1', mediaId: 'm1' }];
      mockPrisma.playHistory.findMany.mockResolvedValue(mockHistory);
      mockPrisma.playHistory.count.mockResolvedValue(1);

      const result = await historyService.getHistoryForMedia('m1', {});

      expect(result.data).toEqual(mockHistory);
      expect(mockPrisma.playHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { mediaId: 'm1' },
        })
      );
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete history older than date', async () => {
      mockPrisma.playHistory.deleteMany.mockResolvedValue({ count: 10 });
      const date = new Date('2024-01-01');

      const result = await historyService.deleteOlderThan(date);

      expect(result).toBe(10);
      expect(mockPrisma.playHistory.deleteMany).toHaveBeenCalledWith({
        where: {
          playedAt: { lt: date },
        },
      });
    });
  });

  describe('getMostPlayedToday', () => {
    it('should return most played tracks today', async () => {
      mockPrisma.playHistory.groupBy.mockResolvedValue([
        { mediaId: 'm1', _count: { mediaId: 10 } },
        { mediaId: 'm2', _count: { mediaId: 5 } },
      ]);

      const result = await historyService.getMostPlayedToday(5);

      expect(result).toEqual([
        { mediaId: 'm1', count: 10 },
        { mediaId: 'm2', count: 5 },
      ]);
    });
  });
});

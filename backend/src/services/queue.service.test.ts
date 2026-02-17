import { describe, it, expect, beforeEach } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

const { queueService } = await import('./queue.service.js');

describe('queueService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('getAll', () => {
    it('should return empty queue initially', async () => {
      mockPrisma.queueItem.findMany.mockResolvedValue([]);

      const queue = await queueService.getAll();

      expect(queue).toEqual([]);
      expect(mockPrisma.queueItem.findMany).toHaveBeenCalledWith({
        include: { media: true },
        orderBy: { position: 'asc' },
      });
    });

    it('should return queue items with media', async () => {
      const mockQueue = [
        { id: 'q1', mediaId: 'm1', position: 0, media: { id: 'm1', title: 'Song 1' } },
        { id: 'q2', mediaId: 'm2', position: 1, media: { id: 'm2', title: 'Song 2' } },
      ];
      mockPrisma.queueItem.findMany.mockResolvedValue(mockQueue);

      const queue = await queueService.getAll();

      expect(queue).toEqual(mockQueue);
    });
  });

  describe('add', () => {
    it('should add media to end of queue', async () => {
      const mockMedia = { id: 'm1', title: 'Song' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.queueItem.findFirst.mockResolvedValue(null);
      mockPrisma.queueItem.aggregate.mockResolvedValue({ _max: { position: 1 } });
      mockPrisma.queueItem.create.mockResolvedValue({ id: 'q1' });
      mockPrisma.queueItem.findMany.mockResolvedValue([]);

      await queueService.add('m1');

      expect(mockPrisma.queueItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mediaId: 'm1',
          position: 2,
        }),
      });
    });

    it('should add media at specific position', async () => {
      const mockMedia = { id: 'm1', title: 'Song' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.queueItem.findFirst.mockResolvedValue(null);
      mockPrisma.queueItem.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.queueItem.create.mockResolvedValue({ id: 'q1' });
      mockPrisma.queueItem.findMany.mockResolvedValue([]);

      await queueService.add('m1', 0);

      expect(mockPrisma.queueItem.updateMany).toHaveBeenCalled();
      expect(mockPrisma.queueItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mediaId: 'm1',
          position: 0,
        }),
      });
    });

    it('should throw error if media not found', async () => {
      mockPrisma.media.findUnique.mockResolvedValue(null);

      await expect(queueService.add('nonexistent')).rejects.toThrow();
    });

    it('should throw error if media already in queue', async () => {
      const mockMedia = { id: 'm1', title: 'Song' };
      mockPrisma.media.findUnique.mockResolvedValue(mockMedia);
      mockPrisma.queueItem.findFirst.mockResolvedValue({ id: 'q1' });

      await expect(queueService.add('m1')).rejects.toThrow();
    });
  });

  describe('addMultiple', () => {
    it('should add multiple media to queue', async () => {
      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'm1' },
        { id: 'm2' },
      ]);
      mockPrisma.queueItem.findMany.mockResolvedValue([]);
      mockPrisma.queueItem.aggregate.mockResolvedValue({ _max: { position: -1 } });
      mockPrisma.queueItem.createMany.mockResolvedValue({ count: 2 });

      await queueService.addMultiple(['m1', 'm2']);

      expect(mockPrisma.queueItem.createMany).toHaveBeenCalled();
    });

    it('should skip already queued items', async () => {
      mockPrisma.media.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      mockPrisma.queueItem.findMany.mockResolvedValue([{ mediaId: 'm1' }]);
      mockPrisma.queueItem.aggregate.mockResolvedValue({ _max: { position: 0 } });
      mockPrisma.queueItem.createMany.mockResolvedValue({ count: 1 });

      await queueService.addMultiple(['m1', 'm2']);

      expect(mockPrisma.queueItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ mediaId: 'm2' }),
        ]),
      });
    });
  });

  describe('remove', () => {
    it('should remove media from queue', async () => {
      const mockItem = { id: 'q1', mediaId: 'm1', position: 1 };
      mockPrisma.queueItem.findFirst.mockResolvedValue(mockItem);
      mockPrisma.queueItem.delete.mockResolvedValue(mockItem);
      mockPrisma.queueItem.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.queueItem.findMany.mockResolvedValue([]);

      await queueService.remove('m1');

      expect(mockPrisma.queueItem.delete).toHaveBeenCalledWith({
        where: { id: 'q1' },
      });
    });

    it('should throw error if item not in queue', async () => {
      mockPrisma.queueItem.findFirst.mockResolvedValue(null);

      await expect(queueService.remove('nonexistent')).rejects.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all items from queue', async () => {
      mockPrisma.queueItem.deleteMany.mockResolvedValue({ count: 5 });

      await queueService.clear();

      expect(mockPrisma.queueItem.deleteMany).toHaveBeenCalled();
    });
  });

  describe('shuffle', () => {
    it('should shuffle queue items', async () => {
      const mockItems = [
        { id: 'q1', position: 0 },
        { id: 'q2', position: 1 },
        { id: 'q3', position: 2 },
      ];
      mockPrisma.queueItem.findMany.mockResolvedValue(mockItems);
      mockPrisma.queueItem.update.mockResolvedValue({});

      await queueService.shuffle();

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should not shuffle if queue has 1 or fewer items', async () => {
      mockPrisma.queueItem.findMany.mockResolvedValue([{ id: 'q1' }]);

      await queueService.shuffle();

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getCount', () => {
    it('should return queue count', async () => {
      mockPrisma.queueItem.count.mockResolvedValue(5);

      const result = await queueService.getCount();

      expect(result).toBe(5);
    });
  });

  describe('getByPosition', () => {
    it('should return item at position', async () => {
      const mockItem = { id: 'q1', position: 0, media: { title: 'Song' } };
      mockPrisma.queueItem.findFirst.mockResolvedValue(mockItem);

      const result = await queueService.getByPosition(0);

      expect(result).toEqual(mockItem);
    });

    it('should return null if position not found', async () => {
      mockPrisma.queueItem.findFirst.mockResolvedValue(null);

      const result = await queueService.getByPosition(99);

      expect(result).toBeNull();
    });
  });

  describe('setQueue', () => {
    it('should replace entire queue', async () => {
      mockPrisma.queueItem.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.media.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]);
      mockPrisma.queueItem.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.queueItem.findMany.mockResolvedValue([]);

      await queueService.setQueue(['m1', 'm2']);

      expect(mockPrisma.queueItem.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.queueItem.createMany).toHaveBeenCalled();
    });

    it('should return empty array for empty input', async () => {
      mockPrisma.queueItem.deleteMany.mockResolvedValue({ count: 0 });

      const result = await queueService.setQueue([]);

      expect(result).toEqual([]);
    });
  });
});

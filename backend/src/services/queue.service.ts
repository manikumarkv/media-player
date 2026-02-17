import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError } from '../errors/index.js';
import { type QueueItemWithMedia } from '../types/index.js';

export const queueService = {
  async getAll(): Promise<QueueItemWithMedia[]> {
    return prisma.queueItem.findMany({
      include: { media: true },
      orderBy: { position: 'asc' },
    });
  },

  async add(mediaId: string, position?: number): Promise<QueueItemWithMedia[]> {
    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundError('Media');
    }

    // Check if already in queue
    const existing = await prisma.queueItem.findFirst({
      where: { mediaId },
    });

    if (existing) {
      throw new ConflictError('Media already in queue');
    }

    // Get max position if no position specified
    let newPosition: number;
    if (position !== undefined) {
      // Make space at the specified position
      await prisma.queueItem.updateMany({
        where: { position: { gte: position } },
        data: { position: { increment: 1 } },
      });
      newPosition = position;
    } else {
      const maxPosition = await prisma.queueItem.aggregate({
        _max: { position: true },
      });
      newPosition = (maxPosition._max.position ?? -1) + 1;
    }

    await prisma.queueItem.create({
      data: {
        mediaId,
        position: newPosition,
      },
    });

    return this.getAll();
  },

  async addMultiple(mediaIds: string[]): Promise<QueueItemWithMedia[]> {
    // Verify all media exist
    const media = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true },
    });

    const foundIds = new Set(media.map((m) => m.id));
    const missingIds = mediaIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundError(`Media items: ${missingIds.join(', ')}`);
    }

    // Get existing queue items to avoid duplicates
    const existingItems = await prisma.queueItem.findMany({
      where: { mediaId: { in: mediaIds } },
      select: { mediaId: true },
    });

    const existingMediaIds = new Set(existingItems.map((i) => i.mediaId));
    const newMediaIds = mediaIds.filter((id) => !existingMediaIds.has(id));

    if (newMediaIds.length === 0) {
      return this.getAll();
    }

    // Get max position
    const maxPosition = await prisma.queueItem.aggregate({
      _max: { position: true },
    });

    let currentPosition = (maxPosition._max.position ?? -1) + 1;

    // Add new items
    await prisma.queueItem.createMany({
      data: newMediaIds.map((mediaId) => ({
        mediaId,
        position: currentPosition++,
      })),
    });

    return this.getAll();
  },

  async remove(mediaId: string): Promise<QueueItemWithMedia[]> {
    const item = await prisma.queueItem.findFirst({
      where: { mediaId },
    });

    if (!item) {
      throw new NotFoundError('Queue item');
    }

    // Delete the item
    await prisma.queueItem.delete({
      where: { id: item.id },
    });

    // Reorder remaining items
    await prisma.queueItem.updateMany({
      where: { position: { gt: item.position } },
      data: { position: { decrement: 1 } },
    });

    return this.getAll();
  },

  async clear(): Promise<void> {
    await prisma.queueItem.deleteMany();
  },

  async reorder(itemIds: string[]): Promise<QueueItemWithMedia[]> {
    // Update positions in transaction
    await prisma.$transaction(
      itemIds.map((itemId, index) =>
        prisma.queueItem.update({
          where: { id: itemId },
          data: { position: index },
        })
      )
    );

    return this.getAll();
  },

  async moveItem(mediaId: string, newPosition: number): Promise<QueueItemWithMedia[]> {
    const item = await prisma.queueItem.findFirst({
      where: { mediaId },
    });

    if (!item) {
      throw new NotFoundError('Queue item');
    }

    const oldPosition = item.position;

    if (oldPosition === newPosition) {
      return this.getAll();
    }

    // Get all items and reorder
    const items = await prisma.queueItem.findMany({
      orderBy: { position: 'asc' },
    });

    // Remove item from old position
    const reordered = items.filter((i) => i.id !== item.id);

    // Insert at new position
    const clampedPosition = Math.max(0, Math.min(newPosition, reordered.length));
    reordered.splice(clampedPosition, 0, item);

    // Update all positions
    await prisma.$transaction(
      reordered.map((i, index) =>
        prisma.queueItem.update({
          where: { id: i.id },
          data: { position: index },
        })
      )
    );

    return this.getAll();
  },

  async shuffle(): Promise<QueueItemWithMedia[]> {
    const items = await prisma.queueItem.findMany();

    if (items.length <= 1) {
      return this.getAll();
    }

    // Fisher-Yates shuffle
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Update positions
    await prisma.$transaction(
      shuffled.map((item, index) =>
        prisma.queueItem.update({
          where: { id: item.id },
          data: { position: index },
        })
      )
    );

    return this.getAll();
  },

  async getCount(): Promise<number> {
    return prisma.queueItem.count();
  },

  async getByPosition(position: number): Promise<QueueItemWithMedia | null> {
    return prisma.queueItem.findFirst({
      where: { position },
      include: { media: true },
    });
  },

  async setQueue(mediaIds: string[]): Promise<QueueItemWithMedia[]> {
    // Clear existing queue
    await this.clear();

    if (mediaIds.length === 0) {
      return [];
    }

    // Verify all media exist
    const media = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true },
    });

    const foundIds = new Set(media.map((m) => m.id));
    const validIds = mediaIds.filter((id) => foundIds.has(id));

    if (validIds.length === 0) {
      return [];
    }

    // Create new queue items
    await prisma.queueItem.createMany({
      data: validIds.map((mediaId, index) => ({
        mediaId,
        position: index,
      })),
    });

    return this.getAll();
  },
};

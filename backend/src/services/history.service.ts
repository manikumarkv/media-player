import { prisma } from '../config/database.js';
import { NotFoundError } from '../errors/index.js';
import {
  type PlayHistoryWithMedia,
  type PaginatedResult,
  type PaginationParams,
} from '../types/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const historyService = {
  async getAll(params: PaginationParams = {}): Promise<PaginatedResult<PlayHistoryWithMedia>> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.playHistory.findMany({
        include: { media: true },
        orderBy: { playedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playHistory.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  async recordPlay(mediaId: string, duration: number): Promise<PlayHistoryWithMedia> {
    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundError('Media');
    }

    // Create history entry
    const history = await prisma.playHistory.create({
      data: {
        mediaId,
        duration: Math.max(0, Math.round(duration)),
      },
      include: { media: true },
    });

    // Increment play count on media
    await prisma.media.update({
      where: { id: mediaId },
      data: { playCount: { increment: 1 } },
    });

    return history;
  },

  async clear(): Promise<void> {
    await prisma.playHistory.deleteMany();
  },

  async getRecent(limit = 10): Promise<PlayHistoryWithMedia[]> {
    return prisma.playHistory.findMany({
      include: { media: true },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });
  },

  async getByDate(
    startDate: Date,
    endDate: Date,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<PlayHistoryWithMedia>> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where = {
      playedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [data, total] = await Promise.all([
      prisma.playHistory.findMany({
        where,
        include: { media: true },
        orderBy: { playedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },

  async getToday(): Promise<PlayHistoryWithMedia[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.playHistory.findMany({
      where: {
        playedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { media: true },
      orderBy: { playedAt: 'desc' },
    });
  },

  async getStats(): Promise<{
    totalPlays: number;
    totalListenTime: number;
    uniqueTracks: number;
  }> {
    const [stats, uniqueTracks] = await Promise.all([
      prisma.playHistory.aggregate({
        _count: { id: true },
        _sum: { duration: true },
      }),
      prisma.playHistory.groupBy({
        by: ['mediaId'],
        _count: true,
      }),
    ]);

    return {
      totalPlays: stats._count.id,
      totalListenTime: stats._sum.duration ?? 0,
      uniqueTracks: uniqueTracks.length,
    };
  },

  async getMostPlayedToday(limit = 10): Promise<{ mediaId: string; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await prisma.playHistory.groupBy({
      by: ['mediaId'],
      where: {
        playedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: { mediaId: true },
      orderBy: { _count: { mediaId: 'desc' } },
      take: limit,
    });

    return result.map((r) => ({
      mediaId: r.mediaId,
      count: r._count.mediaId,
    }));
  },

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.playHistory.deleteMany({
      where: {
        playedAt: { lt: date },
      },
    });

    return result.count;
  },

  async getHistoryForMedia(
    mediaId: string,
    params: PaginationParams = {}
  ): Promise<PaginatedResult<PlayHistoryWithMedia>> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where = { mediaId };

    const [data, total] = await Promise.all([
      prisma.playHistory.findMany({
        where,
        include: { media: true },
        orderBy: { playedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playHistory.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  },
};

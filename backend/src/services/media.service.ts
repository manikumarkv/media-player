import fs from 'fs';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../errors/index.js';
import type {
  Media,
  CreateMediaInput,
  UpdateMediaInput,
  MediaSearchParams,
  PaginatedResult,
} from '../types/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const mediaService = {
  async findAll(params: MediaSearchParams = {}): Promise<PaginatedResult<Media>> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { artist: { contains: params.query, mode: 'insensitive' } },
        { album: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.artist) {
      where.artist = { contains: params.artist, mode: 'insensitive' };
    }

    if (params.album) {
      where.album = { contains: params.album, mode: 'insensitive' };
    }

    if (params.isLiked !== undefined) {
      where.isLiked = params.isLiked;
    }

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';
    orderBy[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
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

  async findById(id: string): Promise<Media> {
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new NotFoundError('Media');
    }

    return media;
  },

  async findByFilePath(filePath: string): Promise<Media | null> {
    return prisma.media.findUnique({
      where: { filePath },
    });
  },

  async findBySourceId(sourceId: string): Promise<Media | null> {
    return prisma.media.findFirst({
      where: { sourceId },
    });
  },

  async create(input: CreateMediaInput): Promise<Media> {
    // Debug: Log what we're about to insert
    console.log('[media.service.create] Input:', {
      title: input.title,
      artist: input.artist,
      album: input.album,
      year: input.year,
    });

    return prisma.media.create({
      data: {
        title: input.title,
        artist: input.artist,
        album: input.album,
        year: input.year,
        duration: input.duration,
        filePath: input.filePath,
        thumbnailPath: input.thumbnailPath,
        sourceUrl: input.sourceUrl,
        sourceId: input.sourceId,
        mimeType: input.mimeType ?? 'audio/mpeg',
        fileSize: input.fileSize ?? 0,
      },
    });
  },

  async update(id: string, input: UpdateMediaInput): Promise<Media> {
    // First check if media exists
    await this.findById(id);

    return prisma.media.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string): Promise<void> {
    // First get the media to access file paths
    const media = await this.findById(id);

    // Delete from database first
    await prisma.media.delete({
      where: { id },
    });

    // Delete media file from disk
    if (media.filePath && fs.existsSync(media.filePath)) {
      fs.unlinkSync(media.filePath);
    }

    // Delete thumbnail from disk
    if (media.thumbnailPath && fs.existsSync(media.thumbnailPath)) {
      fs.unlinkSync(media.thumbnailPath);
    }
  },

  async toggleLike(id: string): Promise<Media> {
    const media = await this.findById(id);

    return prisma.media.update({
      where: { id },
      data: { isLiked: !media.isLiked },
    });
  },

  async incrementPlayCount(id: string): Promise<Media> {
    // First check if media exists
    await this.findById(id);

    return prisma.media.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    });
  },

  async getLiked(params: MediaSearchParams = {}): Promise<PaginatedResult<Media>> {
    return this.findAll({ ...params, isLiked: true });
  },

  async getRecentlyAdded(limit = 10): Promise<Media[]> {
    return prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getMostPlayed(limit = 10): Promise<Media[]> {
    return prisma.media.findMany({
      where: { playCount: { gt: 0 } },
      orderBy: { playCount: 'desc' },
      take: limit,
    });
  },

  async getStats(): Promise<{
    totalCount: number;
    totalDuration: number;
    totalSize: number;
    likedCount: number;
  }> {
    const [stats, likedCount] = await Promise.all([
      prisma.media.aggregate({
        _count: { id: true },
        _sum: { duration: true, fileSize: true },
      }),
      prisma.media.count({ where: { isLiked: true } }),
    ]);

    return {
      totalCount: stats._count.id,
      totalDuration: stats._sum.duration ?? 0,
      totalSize: stats._sum.fileSize ?? 0,
      likedCount,
    };
  },
};

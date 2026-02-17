import { prisma } from '../config/database.js';
import { NotFoundError, ConflictError, BadRequestError } from '../errors/index.js';
import {
  type Playlist,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
  type PlaylistWithItems,
  type PaginatedResult,
  type PaginationParams,
} from '../types/index.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const playlistService = {
  async findAll(params: PaginationParams = {}): Promise<PaginatedResult<Playlist>> {
    const page = Math.max(1, params.page ?? DEFAULT_PAGE);
    const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.playlist.findMany({
        where: { isSystem: false },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.playlist.count({ where: { isSystem: false } }),
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

  async findById(id: string): Promise<Playlist> {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      throw new NotFoundError('Playlist');
    }

    return playlist;
  },

  async findByIdWithItems(id: string): Promise<PlaylistWithItems> {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          include: { media: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundError('Playlist');
    }

    return playlist;
  },

  async create(input: CreatePlaylistInput): Promise<Playlist> {
    return prisma.playlist.create({
      data: {
        name: input.name,
        description: input.description,
        coverPath: input.coverPath,
        isSystem: false,
      },
    });
  },

  async update(id: string, input: UpdatePlaylistInput): Promise<Playlist> {
    const playlist = await this.findById(id);

    if (playlist.isSystem) {
      throw new BadRequestError('Cannot update system playlist');
    }

    return prisma.playlist.update({
      where: { id },
      data: input,
    });
  },

  async delete(id: string): Promise<void> {
    const playlist = await this.findById(id);

    if (playlist.isSystem) {
      throw new BadRequestError('Cannot delete system playlist');
    }

    await prisma.playlist.delete({
      where: { id },
    });
  },

  async addItem(playlistId: string, mediaId: string): Promise<PlaylistWithItems> {
    // Verify playlist exists
    await this.findById(playlistId);

    // Verify media exists
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundError('Media');
    }

    // Check if already in playlist
    const existing = await prisma.playlistItem.findUnique({
      where: { playlistId_mediaId: { playlistId, mediaId } },
    });

    if (existing) {
      throw new ConflictError('Media already in playlist');
    }

    // Get max position
    const maxPosition = await prisma.playlistItem.aggregate({
      where: { playlistId },
      _max: { position: true },
    });

    const newPosition = (maxPosition._max.position ?? -1) + 1;

    await prisma.playlistItem.create({
      data: {
        playlistId,
        mediaId,
        position: newPosition,
      },
    });

    return this.findByIdWithItems(playlistId);
  },

  async removeItem(playlistId: string, mediaId: string): Promise<PlaylistWithItems> {
    // Verify playlist exists
    await this.findById(playlistId);

    const item = await prisma.playlistItem.findUnique({
      where: { playlistId_mediaId: { playlistId, mediaId } },
    });

    if (!item) {
      throw new NotFoundError('Playlist item');
    }

    // Delete the item
    await prisma.playlistItem.delete({
      where: { id: item.id },
    });

    // Reorder remaining items
    await this.reorderAfterRemoval(playlistId, item.position);

    return this.findByIdWithItems(playlistId);
  },

  async reorderItems(
    playlistId: string,
    itemIds: string[]
  ): Promise<PlaylistWithItems> {
    // Verify playlist exists
    await this.findById(playlistId);

    // Update positions in transaction
    await prisma.$transaction(
      itemIds.map((itemId, index) =>
        prisma.playlistItem.update({
          where: { id: itemId },
          data: { position: index },
        })
      )
    );

    return this.findByIdWithItems(playlistId);
  },

  async moveItem(
    playlistId: string,
    mediaId: string,
    newPosition: number
  ): Promise<PlaylistWithItems> {
    // Verify playlist exists
    await this.findById(playlistId);

    const item = await prisma.playlistItem.findUnique({
      where: { playlistId_mediaId: { playlistId, mediaId } },
    });

    if (!item) {
      throw new NotFoundError('Playlist item');
    }

    const oldPosition = item.position;

    if (oldPosition === newPosition) {
      return this.findByIdWithItems(playlistId);
    }

    // Get all items and reorder
    const items = await prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { position: 'asc' },
    });

    // Remove item from old position
    const reordered = items.filter((i) => i.id !== item.id);

    // Insert at new position
    reordered.splice(newPosition, 0, item);

    // Update all positions
    await prisma.$transaction(
      reordered.map((i, index) =>
        prisma.playlistItem.update({
          where: { id: i.id },
          data: { position: index },
        })
      )
    );

    return this.findByIdWithItems(playlistId);
  },

  async clearPlaylist(id: string): Promise<PlaylistWithItems> {
    // Verify playlist exists
    await this.findById(id);

    await prisma.playlistItem.deleteMany({
      where: { playlistId: id },
    });

    return this.findByIdWithItems(id);
  },

  async getItemCount(playlistId: string): Promise<number> {
    return prisma.playlistItem.count({
      where: { playlistId },
    });
  },

  async getTotalDuration(playlistId: string): Promise<number> {
    const result = await prisma.playlistItem.findMany({
      where: { playlistId },
      include: { media: { select: { duration: true } } },
    });

    return result.reduce((sum, item) => sum + item.media.duration, 0);
  },

  async reorderAfterRemoval(playlistId: string, removedPosition: number): Promise<void> {
    await prisma.playlistItem.updateMany({
      where: {
        playlistId,
        position: { gt: removedPosition },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  },
};

// Helper function exposed for internal use
async function reorderAfterRemoval(
  playlistId: string,
  removedPosition: number
): Promise<void> {
  await prisma.playlistItem.updateMany({
    where: {
      playlistId,
      position: { gt: removedPosition },
    },
    data: {
      position: { decrement: 1 },
    },
  });
}

// Attach to service for internal use
Object.assign(playlistService, { reorderAfterRemoval });

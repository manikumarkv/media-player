import { z } from 'zod';

export const playlistIdSchema = z.object({
  id: z.string().min(1, 'Playlist ID is required'),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional(),
});

export const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  coverPath: z.string().optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverPath: z.string().optional(),
});

export const addPlaylistItemSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
});

export const removePlaylistItemSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
});

export const reorderPlaylistSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'Item IDs are required'),
});

export const movePlaylistItemSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  position: z.number().int().nonnegative('Position must be non-negative'),
});

export type PlaylistIdInput = z.infer<typeof playlistIdSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;
export type RemovePlaylistItemInput = z.infer<typeof removePlaylistItemSchema>;
export type ReorderPlaylistInput = z.infer<typeof reorderPlaylistSchema>;
export type MovePlaylistItemInput = z.infer<typeof movePlaylistItemSchema>;

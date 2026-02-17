import { z } from 'zod';

export const mediaIdSchema = z.object({
  id: z.string().min(1, 'Media ID is required'),
});

export const mediaSearchSchema = z.object({
  query: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  isLiked: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
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
  sortBy: z.enum(['title', 'artist', 'createdAt', 'playCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const createMediaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  artist: z.string().max(200).optional(),
  album: z.string().max(200).optional(),
  duration: z.number().int().nonnegative('Duration must be non-negative'),
  filePath: z.string().min(1, 'File path is required'),
  thumbnailPath: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceId: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

export const updateMediaSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  artist: z.string().max(200).optional(),
  album: z.string().max(200).optional(),
  thumbnailPath: z.string().optional(),
});

export type MediaIdInput = z.infer<typeof mediaIdSchema>;
export type MediaSearchInput = z.infer<typeof mediaSearchSchema>;
export type CreateMediaInput = z.infer<typeof createMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

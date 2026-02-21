import { z } from 'zod';

export const exportModeSchema = z.object({
  mode: z.enum(['album', 'artist', 'playlist', 'all']),
});

export const checkExportStatusSchema = z.object({
  destinationPath: z.string().min(1, 'Destination path is required'),
  mode: z.enum(['album', 'artist', 'playlist', 'all']),
  itemIds: z.array(z.string()).min(1, 'At least one item ID is required'),
});

export const startExportSchema = z.object({
  destinationPath: z.string().min(1, 'Destination path is required'),
  mode: z.enum(['album', 'artist', 'playlist', 'all']),
  albumName: z.string().optional(),
  artistName: z.string().optional(),
  playlistId: z.string().optional(),
  mediaIds: z.array(z.string()).optional(),
  includeArtwork: z.boolean().default(true),
  includeM3U: z.boolean().default(true),
});

export type ExportModeInput = z.infer<typeof exportModeSchema>;
export type CheckExportStatusInput = z.infer<typeof checkExportStatusSchema>;
export type StartExportInput = z.infer<typeof startExportSchema>;

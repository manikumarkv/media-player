import { z } from 'zod';

export const downloadIdSchema = z.object({
  id: z.string().min(1, 'Download ID is required'),
});

export const startDownloadSchema = z.object({
  url: z.string().url('Valid URL is required'),
});

export const getInfoSchema = z.object({
  url: z.string().url('Valid URL is required'),
});

export const playlistUrlSchema = z.object({
  url: z.string().url('Valid playlist URL is required'),
});

export const playlistStartSchema = z.object({
  url: z.string().url('Valid playlist URL is required'),
  videoIds: z.array(z.string()).optional(),
  createPlaylist: z.boolean().optional(),
  playlistName: z.string().max(100, 'Playlist name must be 100 characters or less').optional(),
});

export type DownloadIdInput = z.infer<typeof downloadIdSchema>;
export type StartDownloadInput = z.infer<typeof startDownloadSchema>;
export type GetInfoInput = z.infer<typeof getInfoSchema>;
export type PlaylistUrlInput = z.infer<typeof playlistUrlSchema>;
export type PlaylistStartInput = z.infer<typeof playlistStartSchema>;

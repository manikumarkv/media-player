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

export type DownloadIdInput = z.infer<typeof downloadIdSchema>;
export type StartDownloadInput = z.infer<typeof startDownloadSchema>;
export type GetInfoInput = z.infer<typeof getInfoSchema>;

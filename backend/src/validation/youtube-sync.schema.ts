import { z } from 'zod';

export const updateYouTubeSyncSettingsSchema = z.object({
  autoSync: z.boolean().optional(),
  syncInterval: z.number().int().positive().max(1440).optional(), // max 24 hours
  filterMusic: z.boolean().optional(),
  maxDuration: z.number().int().positive().max(36000).optional(), // max 10 hours
});

export const uploadCookiesSchema = z.object({
  cookies: z.string().min(1, 'Cookie content is required'),
});

export const historyLimitSchema = z.object({
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .optional(),
});

export type UpdateYouTubeSyncSettingsInput = z.infer<typeof updateYouTubeSyncSettingsSchema>;
export type UploadCookiesInput = z.infer<typeof uploadCookiesSchema>;
export type HistoryLimitInput = z.infer<typeof historyLimitSchema>;

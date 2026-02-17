import { z } from 'zod';

export const recordPlaySchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  duration: z.number().int().nonnegative('Duration must be non-negative'),
});

export const historyQuerySchema = z.object({
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
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date())
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .pipe(z.date())
    .optional(),
});

export const mediaIdParamSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
});

export type RecordPlayInput = z.infer<typeof recordPlaySchema>;
export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
export type MediaIdParamInput = z.infer<typeof mediaIdParamSchema>;

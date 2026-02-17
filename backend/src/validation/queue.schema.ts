import { z } from 'zod';

export const addToQueueSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  position: z.number().int().nonnegative().optional(),
});

export const addMultipleToQueueSchema = z.object({
  mediaIds: z.array(z.string().min(1)).min(1, 'Media IDs are required'),
});

export const removeFromQueueSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
});

export const reorderQueueSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1, 'Item IDs are required'),
});

export const moveQueueItemSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  position: z.number().int().nonnegative('Position must be non-negative'),
});

export const setQueueSchema = z.object({
  mediaIds: z.array(z.string().min(1)),
});

export type AddToQueueInput = z.infer<typeof addToQueueSchema>;
export type AddMultipleToQueueInput = z.infer<typeof addMultipleToQueueSchema>;
export type RemoveFromQueueInput = z.infer<typeof removeFromQueueSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type MoveQueueItemInput = z.infer<typeof moveQueueItemSchema>;
export type SetQueueInput = z.infer<typeof setQueueSchema>;

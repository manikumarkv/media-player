import { type Request, type Response, type NextFunction } from 'express';
import { queueService } from '../services/index.js';
import {
  type AddToQueueInput,
  type AddMultipleToQueueInput,
  type ReorderQueueInput,
  type MoveQueueItemInput,
  type SetQueueInput,
} from '../validation/queue.schema.js';

export const queueController = {
  async get(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.getAll();
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async add(
    req: Request<unknown, unknown, AddToQueueInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.add(req.body.mediaId, req.body.position);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async addMultiple(
    req: Request<unknown, unknown, AddMultipleToQueueInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.addMultiple(req.body.mediaIds);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async remove(
    req: Request<{ mediaId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.remove(req.params.mediaId);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async clear(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await queueService.clear();
      res.json({ success: true, data: [] });
    } catch (error) {
      next(error);
    }
  },

  async reorder(
    req: Request<unknown, unknown, ReorderQueueInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.reorder(req.body.itemIds);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async move(
    req: Request<unknown, unknown, MoveQueueItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.moveItem(req.body.mediaId, req.body.position);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async shuffle(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.shuffle();
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async setQueue(
    req: Request<unknown, unknown, SetQueueInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const queue = await queueService.setQueue(req.body.mediaIds);
      res.json({ success: true, data: queue });
    } catch (error) {
      next(error);
    }
  },

  async getCount(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await queueService.getCount();
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },
};

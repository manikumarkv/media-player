import { type Request, type Response, type NextFunction } from 'express';
import { historyService } from '../services/index.js';
import {
  type RecordPlayInput,
  type HistoryQueryInput,
} from '../validation/history.schema.js';

export const historyController = {
  async list(
    req: Request<unknown, unknown, unknown, HistoryQueryInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { startDate, endDate, ...pagination } = req.query;

      let result;
      if (startDate && endDate) {
        result = await historyService.getByDate(startDate, endDate, pagination);
      } else {
        result = await historyService.getAll(pagination);
      }

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async recordPlay(
    req: Request<unknown, unknown, RecordPlayInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const history = await historyService.recordPlay(req.body.mediaId, req.body.duration);
      res.status(201).json({ success: true, data: history });
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
      await historyService.clear();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async getRecent(
    req: Request<unknown, unknown, unknown, { limit?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const history = await historyService.getRecent(limit);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  async getToday(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const history = await historyService.getToday();
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  async getStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await historyService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async getHistoryForMedia(
    req: Request<{ mediaId: string }, unknown, unknown, HistoryQueryInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await historyService.getHistoryForMedia(req.params.mediaId, req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },
};

import { type Request, type Response, type NextFunction } from 'express';
import { mediaService } from '../services/index.js';
import { type MediaSearchInput } from '../validation/media.schema.js';

export const likesController = {
  async list(
    req: Request<unknown, unknown, unknown, MediaSearchInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await mediaService.getLiked(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async toggle(
    req: Request<{ mediaId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.toggleLike(req.params.mediaId);
      res.json({ success: true, data: media });
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
      const stats = await mediaService.getStats();
      res.json({ success: true, data: { count: stats.likedCount } });
    } catch (error) {
      next(error);
    }
  },
};

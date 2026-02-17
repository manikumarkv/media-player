import { type Request, type Response, type NextFunction } from 'express';
import { mediaService, streamService } from '../services/index.js';
import {
  type MediaSearchInput,
  type CreateMediaInput,
  type UpdateMediaInput,
} from '../validation/media.schema.js';

export const mediaController = {
  async list(
    req: Request<unknown, unknown, unknown, MediaSearchInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await mediaService.findAll(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.findById(req.params.id);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async create(
    req: Request<unknown, unknown, CreateMediaInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.create(req.body);
      res.status(201).json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async update(
    req: Request<{ id: string }, unknown, UpdateMediaInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.update(req.params.id, req.body);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async delete(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await mediaService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async stream(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.findById(req.params.id);
      const range = req.headers.range;

      const result = await streamService.getFileStream(media.filePath, range);

      if (range) {
        res.status(206);
        res.setHeader('Content-Range', `bytes ${result.start}-${result.end}/${result.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
      } else {
        res.status(200);
      }

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Length', result.contentLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  async thumbnail(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.findById(req.params.id);

      if (!media.thumbnailPath) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No thumbnail' } });
        return;
      }

      const result = await streamService.getThumbnailStream(media.thumbnailPath);

      res.setHeader('Content-Type', result.mimeType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  async toggleLike(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const media = await mediaService.toggleLike(req.params.id);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async getLiked(
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

  async getStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await mediaService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async getRecentlyAdded(
    req: Request<unknown, unknown, unknown, { limit?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const media = await mediaService.getRecentlyAdded(limit);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },

  async getMostPlayed(
    req: Request<unknown, unknown, unknown, { limit?: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const media = await mediaService.getMostPlayed(limit);
      res.json({ success: true, data: media });
    } catch (error) {
      next(error);
    }
  },
};

import { type Request, type Response, type NextFunction } from 'express';
import { downloadService, youtubeService } from '../services/index.js';
import {
  type StartDownloadInput,
  type GetInfoInput,
  type PlaylistUrlInput,
} from '../validation/download.schema.js';

export const downloadController = {
  async list(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const downloads = await downloadService.findAll();
      res.json({ success: true, data: downloads });
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
      const download = await downloadService.findById(req.params.id);
      res.json({ success: true, data: download });
    } catch (error) {
      next(error);
    }
  },

  async getInfo(
    req: Request<unknown, unknown, GetInfoInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const info = await downloadService.getInfo(req.body.url);
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  },

  async start(
    req: Request<unknown, unknown, StartDownloadInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const download = await downloadService.start(req.body.url);
      res.status(201).json({ success: true, data: download });
    } catch (error) {
      next(error);
    }
  },

  async cancel(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const download = await downloadService.cancel(req.params.id);
      res.json({ success: true, data: download });
    } catch (error) {
      next(error);
    }
  },

  async retry(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const download = await downloadService.retry(req.params.id);
      res.json({ success: true, data: download });
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
      await downloadService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async clearCompleted(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await downloadService.clearCompleted();
      res.json({ success: true, data: { cleared: count } });
    } catch (error) {
      next(error);
    }
  },

  async clearFailed(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await downloadService.clearFailed();
      res.json({ success: true, data: { cleared: count } });
    } catch (error) {
      next(error);
    }
  },

  async checkAvailability(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const available = await youtubeService.isAvailable();
      res.json({ success: true, data: { available } });
    } catch (error) {
      next(error);
    }
  },

  async getPlaylistInfo(
    req: Request<unknown, unknown, PlaylistUrlInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const info = await downloadService.getPlaylistInfo(req.body.url);
      res.json({ success: true, data: info });
    } catch (error) {
      next(error);
    }
  },

  async startPlaylist(
    req: Request<unknown, unknown, PlaylistUrlInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await downloadService.startPlaylist(req.body.url);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};

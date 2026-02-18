import { type Request, type Response, type NextFunction } from 'express';
import { youtubeSyncService } from '../services/index.js';
import type {
  UpdateYouTubeSyncSettingsInput,
  UploadCookiesInput,
  HistoryLimitInput,
} from '../validation/youtube-sync.schema.js';

export const youtubeSyncController = {
  /**
   * GET /youtube-sync/status - Get YouTube sync status
   */
  async getStatus(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const status = await youtubeSyncService.getStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /youtube-sync/settings - Get sync settings
   */
  async getSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await youtubeSyncService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /youtube-sync/settings - Update sync settings
   */
  async updateSettings(
    req: Request<unknown, unknown, UpdateYouTubeSyncSettingsInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await youtubeSyncService.updateSettings(req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /youtube-sync/history - Get sync history
   */
  async getHistory(
    req: Request<unknown, unknown, unknown, HistoryLimitInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const history = await youtubeSyncService.getHistory(limit);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /youtube-sync/auth/cookie - Authenticate with uploaded cookies
   */
  async authWithCookies(
    req: Request<unknown, unknown, UploadCookiesInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await youtubeSyncService.authenticateWithCookies(
        req.body.cookies
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /youtube-sync/sync - Trigger manual sync
   */
  async sync(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await youtubeSyncService.syncLikedVideos();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /youtube-sync/disconnect - Disconnect YouTube account
   */
  async disconnect(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const disconnected = await youtubeSyncService.disconnect();
      if (disconnected) {
        res.json({ success: true, data: { message: 'Disconnected successfully' } });
      } else {
        res.json({ success: true, data: { message: 'No connection to disconnect' } });
      }
    } catch (error) {
      next(error);
    }
  },
};

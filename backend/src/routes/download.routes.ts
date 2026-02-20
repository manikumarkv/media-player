import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { downloadController } from '../controllers/download.controller.js';
import { validate } from '../validation/index.js';
import {
  downloadIdSchema,
  startDownloadSchema,
  getInfoSchema,
  playlistUrlSchema,
  playlistStartSchema,
} from '../validation/download.schema.js';

const router: IRouter = Router();

// GET /downloads - List all downloads
router.get(ROUTES.DOWNLOADS.BASE, downloadController.list);

// GET /downloads/check - Check if yt-dlp is available
router.get(`${ROUTES.DOWNLOADS.BASE}/check`, downloadController.checkAvailability);

// POST /downloads/info - Get video info without downloading
router.post(
  ROUTES.DOWNLOADS.INFO,
  validate(getInfoSchema, 'body'),
  downloadController.getInfo
);

// POST /downloads/start - Start a new download
router.post(
  ROUTES.DOWNLOADS.START,
  validate(startDownloadSchema, 'body'),
  downloadController.start
);

// GET /downloads/:id - Get download by ID
router.get(
  `${ROUTES.DOWNLOADS.BASE}/:id`,
  validate(downloadIdSchema, 'params'),
  downloadController.getById
);

// DELETE /downloads/:id - Cancel and delete download
router.delete(
  ROUTES.DOWNLOADS.CANCEL,
  validate(downloadIdSchema, 'params'),
  downloadController.cancel
);

// POST /downloads/:id/retry - Retry failed download
router.post(
  `${ROUTES.DOWNLOADS.BASE}/:id/retry`,
  validate(downloadIdSchema, 'params'),
  downloadController.retry
);

// DELETE /downloads/:id/delete - Permanently delete download
router.delete(
  `${ROUTES.DOWNLOADS.BASE}/:id/delete`,
  validate(downloadIdSchema, 'params'),
  downloadController.delete
);

// DELETE /downloads/clear/completed - Clear completed downloads
router.delete(`${ROUTES.DOWNLOADS.BASE}/clear/completed`, downloadController.clearCompleted);

// DELETE /downloads/clear/failed - Clear failed downloads
router.delete(`${ROUTES.DOWNLOADS.BASE}/clear/failed`, downloadController.clearFailed);

// POST /downloads/playlist/info - Get playlist info without downloading
router.post(
  ROUTES.DOWNLOADS.PLAYLIST_INFO,
  validate(playlistUrlSchema, 'body'),
  downloadController.getPlaylistInfo
);

// POST /downloads/playlist/start - Start downloading a playlist (with optional selection)
router.post(
  ROUTES.DOWNLOADS.PLAYLIST_START,
  validate(playlistStartSchema, 'body'),
  downloadController.startPlaylist
);

export default router;

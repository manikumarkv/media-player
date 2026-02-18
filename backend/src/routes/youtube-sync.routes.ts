import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { youtubeSyncController } from '../controllers/youtube-sync.controller.js';
import { validate } from '../validation/index.js';
import {
  updateYouTubeSyncSettingsSchema,
  uploadCookiesSchema,
  historyLimitSchema,
} from '../validation/youtube-sync.schema.js';

const router: IRouter = Router();

// GET /youtube-sync/status - Get connection status
router.get(
  ROUTES.YOUTUBE_SYNC.STATUS,
  youtubeSyncController.getStatus
);

// GET /youtube-sync/settings - Get sync settings
router.get(
  ROUTES.YOUTUBE_SYNC.SETTINGS,
  youtubeSyncController.getSettings
);

// PATCH /youtube-sync/settings - Update sync settings
router.patch(
  ROUTES.YOUTUBE_SYNC.SETTINGS,
  validate(updateYouTubeSyncSettingsSchema, 'body'),
  youtubeSyncController.updateSettings
);

// GET /youtube-sync/history - Get sync history
router.get(
  ROUTES.YOUTUBE_SYNC.HISTORY,
  validate(historyLimitSchema, 'query'),
  youtubeSyncController.getHistory
);

// POST /youtube-sync/auth/cookie - Authenticate with cookies
router.post(
  ROUTES.YOUTUBE_SYNC.AUTH.COOKIE,
  validate(uploadCookiesSchema, 'body'),
  youtubeSyncController.authWithCookies
);

// POST /youtube-sync/sync - Trigger manual sync
router.post(
  ROUTES.YOUTUBE_SYNC.SYNC,
  youtubeSyncController.sync
);

// DELETE /youtube-sync/disconnect - Disconnect YouTube account
router.delete(
  ROUTES.YOUTUBE_SYNC.DISCONNECT,
  youtubeSyncController.disconnect
);

export default router;

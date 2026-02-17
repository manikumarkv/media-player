import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { historyController } from '../controllers/index.js';
import { validate } from '../validation/index.js';
import {
  recordPlaySchema,
  historyQuerySchema,
  mediaIdParamSchema,
} from '../validation/history.schema.js';

const router: IRouter = Router();

// GET /history - Get play history
router.get(
  ROUTES.HISTORY.BASE,
  validate(historyQuerySchema, 'query'),
  historyController.list
);

// GET /history/recent - Get recent history
router.get(`${ROUTES.HISTORY.BASE}/recent`, historyController.getRecent);

// GET /history/today - Get today's history
router.get(`${ROUTES.HISTORY.BASE}/today`, historyController.getToday);

// GET /history/stats - Get history stats
router.get(`${ROUTES.HISTORY.BASE}/stats`, historyController.getStats);

// GET /history/media/:mediaId - Get history for specific media
router.get(
  `${ROUTES.HISTORY.BASE}/media/:mediaId`,
  validate(mediaIdParamSchema, 'params'),
  validate(historyQuerySchema, 'query'),
  historyController.getHistoryForMedia
);

// POST /history - Record a play
router.post(
  ROUTES.HISTORY.BASE,
  validate(recordPlaySchema, 'body'),
  historyController.recordPlay
);

// DELETE /history/clear - Clear history
router.delete(ROUTES.HISTORY.CLEAR, historyController.clear);

export default router;

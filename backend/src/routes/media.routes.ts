import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { mediaController } from '../controllers/index.js';
import { validate } from '../validation/index.js';
import {
  mediaIdSchema,
  mediaSearchSchema,
  createMediaSchema,
  updateMediaSchema,
} from '../validation/media.schema.js';

const router: IRouter = Router();

// GET /media - List all media with search/filter
router.get(
  ROUTES.MEDIA.BASE,
  validate(mediaSearchSchema, 'query'),
  mediaController.list
);

// GET /media/stats - Get media statistics
router.get(`${ROUTES.MEDIA.BASE}/stats`, mediaController.getStats);

// GET /media/recent - Get recently added media
router.get(`${ROUTES.MEDIA.BASE}/recent`, mediaController.getRecentlyAdded);

// GET /media/most-played - Get most played media
router.get(`${ROUTES.MEDIA.BASE}/most-played`, mediaController.getMostPlayed);

// GET /media/:id - Get media by ID
router.get(
  ROUTES.MEDIA.BY_ID,
  validate(mediaIdSchema, 'params'),
  mediaController.getById
);

// POST /media - Create new media
router.post(
  ROUTES.MEDIA.BASE,
  validate(createMediaSchema, 'body'),
  mediaController.create
);

// PATCH /media/:id - Update media
router.patch(
  ROUTES.MEDIA.BY_ID,
  validate(mediaIdSchema, 'params'),
  validate(updateMediaSchema, 'body'),
  mediaController.update
);

// DELETE /media/:id - Delete media
router.delete(
  ROUTES.MEDIA.BY_ID,
  validate(mediaIdSchema, 'params'),
  mediaController.delete
);

// GET /media/:id/stream - Stream media file
router.get(
  ROUTES.MEDIA.STREAM,
  validate(mediaIdSchema, 'params'),
  mediaController.stream
);

// GET /media/:id/thumbnail - Get media thumbnail
router.get(
  ROUTES.MEDIA.THUMBNAIL,
  validate(mediaIdSchema, 'params'),
  mediaController.thumbnail
);

// POST /media/:id/like - Toggle like status
router.post(
  `${ROUTES.MEDIA.BY_ID}/like`,
  validate(mediaIdSchema, 'params'),
  mediaController.toggleLike
);

export default router;

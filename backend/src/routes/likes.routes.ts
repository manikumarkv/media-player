import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { likesController } from '../controllers/index.js';
import { validate } from '../validation/index.js';
import { mediaSearchSchema } from '../validation/media.schema.js';

const router: IRouter = Router();

// GET /likes - Get all liked media
router.get(
  ROUTES.LIKES.BASE,
  validate(mediaSearchSchema, 'query'),
  likesController.list
);

// GET /likes/count - Get liked count
router.get(`${ROUTES.LIKES.BASE}/count`, likesController.getCount);

// POST /likes/:mediaId - Toggle like status
router.post(ROUTES.LIKES.TOGGLE, likesController.toggle);

export default router;

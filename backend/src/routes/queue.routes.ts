import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { queueController } from '../controllers/index.js';
import { validate } from '../validation/index.js';
import {
  addToQueueSchema,
  addMultipleToQueueSchema,
  reorderQueueSchema,
  moveQueueItemSchema,
  setQueueSchema,
} from '../validation/queue.schema.js';

const router: IRouter = Router();

// GET /queue - Get current queue
router.get(ROUTES.QUEUE.BASE, queueController.get);

// GET /queue/count - Get queue count
router.get(`${ROUTES.QUEUE.BASE}/count`, queueController.getCount);

// POST /queue/add - Add item to queue
router.post(
  ROUTES.QUEUE.ADD,
  validate(addToQueueSchema, 'body'),
  queueController.add
);

// POST /queue/add-multiple - Add multiple items to queue
router.post(
  `${ROUTES.QUEUE.BASE}/add-multiple`,
  validate(addMultipleToQueueSchema, 'body'),
  queueController.addMultiple
);

// DELETE /queue/:mediaId - Remove item from queue
router.delete(`${ROUTES.QUEUE.BASE}/:mediaId`, queueController.remove);

// DELETE /queue/clear - Clear queue
router.delete(ROUTES.QUEUE.CLEAR, queueController.clear);

// PUT /queue/reorder - Reorder queue
router.put(
  ROUTES.QUEUE.REORDER,
  validate(reorderQueueSchema, 'body'),
  queueController.reorder
);

// PATCH /queue/move - Move item to new position
router.patch(
  `${ROUTES.QUEUE.BASE}/move`,
  validate(moveQueueItemSchema, 'body'),
  queueController.move
);

// POST /queue/shuffle - Shuffle queue
router.post(`${ROUTES.QUEUE.BASE}/shuffle`, queueController.shuffle);

// PUT /queue - Set entire queue
router.put(
  ROUTES.QUEUE.BASE,
  validate(setQueueSchema, 'body'),
  queueController.setQueue
);

export default router;

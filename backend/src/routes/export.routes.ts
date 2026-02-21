import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { exportController } from '../controllers/export.controller.js';
import { validate } from '../validation/index.js';
import {
  exportModeSchema,
  checkExportStatusSchema,
  startExportSchema,
} from '../validation/export.schema.js';

const router: IRouter = Router();

// GET /export/items/:mode - Get exportable items by mode
router.get(
  ROUTES.EXPORT.ITEMS,
  validate(exportModeSchema, 'params'),
  (req, res, next) => exportController.getItems(req, res, next)
);

// POST /export/check-status - Check export status for items
router.post(
  ROUTES.EXPORT.CHECK_STATUS,
  validate(checkExportStatusSchema, 'body'),
  (req, res, next) => exportController.checkStatus(req, res, next)
);

// POST /export/start - Start export operation
router.post(
  ROUTES.EXPORT.START,
  validate(startExportSchema, 'body'),
  (req, res, next) => exportController.start(req, res, next)
);

export default router;

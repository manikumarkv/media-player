import { type Request, type Response, type NextFunction } from 'express';
import { exportService } from '../services/export.service.js';
import { socketService } from '../services/socket.service.js';
import type {
  ExportModeInput,
  CheckExportStatusInput,
  StartExportInput,
} from '../validation/export.schema.js';

export const exportController = {
  /**
   * Get exportable items by mode
   * GET /export/items/:mode
   */
  async getItems(
    req: Request<ExportModeInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mode } = req.params;
      const items = await exportService.getExportableItems(mode);
      res.json({ success: true, data: items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check export status for items
   * POST /export/check-status
   */
  async checkStatus(
    req: Request<unknown, unknown, CheckExportStatusInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { destinationPath, mode, itemIds } = req.body;
      const status = await exportService.checkExportStatus(
        destinationPath,
        mode,
        itemIds
      );
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Start export operation
   * POST /export/start
   */
  async start(
    req: Request<unknown, unknown, StartExportInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        destinationPath,
        mode,
        albumName,
        artistName,
        playlistId,
        mediaIds,
        includeArtwork,
        includeM3U,
      } = req.body;

      // Emit export started event
      socketService.emitExportStarted({
        totalItems: 0, // Will be updated during export
        mode,
        destinationPath,
      });

      // Start export with progress callback
      const result = await exportService.exportItems({
        destinationPath,
        mode,
        albumName,
        artistName,
        playlistId,
        mediaIds,
        includeArtwork,
        includeM3U,
        onProgress: (current, total, currentFile) => {
          socketService.emitExportProgress({
            current,
            total,
            currentFile,
            percentage: Math.round((current / total) * 100),
          });
        },
      });

      // Emit export completed event
      socketService.emitExportCompleted({
        totalExported: result.totalExported,
        totalSkipped: result.totalSkipped,
        destinationPath,
      });

      res.json({ success: true, data: result });
    } catch (error) {
      // Emit export error event
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      socketService.emitExportError({
        error: errorMessage,
      });
      next(error);
    }
  },
};

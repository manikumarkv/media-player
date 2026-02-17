import { type Request, type Response, type NextFunction } from 'express';
import { playlistService } from '../services/index.js';
import {
  type PaginationInput,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
  type AddPlaylistItemInput,
  type ReorderPlaylistInput,
  type MovePlaylistItemInput,
} from '../validation/playlist.schema.js';

export const playlistController = {
  async list(
    req: Request<unknown, unknown, unknown, PaginationInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await playlistService.findAll(req.query);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
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
      const playlist = await playlistService.findByIdWithItems(req.params.id);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async create(
    req: Request<unknown, unknown, CreatePlaylistInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.create(req.body);
      res.status(201).json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async update(
    req: Request<{ id: string }, unknown, UpdatePlaylistInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.update(req.params.id, req.body);
      res.json({ success: true, data: playlist });
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
      await playlistService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  async addItem(
    req: Request<{ id: string }, unknown, AddPlaylistItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.addItem(req.params.id, req.body.mediaId);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(
    req: Request<{ id: string; mediaId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.removeItem(req.params.id, req.params.mediaId);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async reorderItems(
    req: Request<{ id: string }, unknown, ReorderPlaylistInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.reorderItems(req.params.id, req.body.itemIds);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async moveItem(
    req: Request<{ id: string }, unknown, MovePlaylistItemInput>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.moveItem(
        req.params.id,
        req.body.mediaId,
        req.body.position
      );
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async clear(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const playlist = await playlistService.clearPlaylist(req.params.id);
      res.json({ success: true, data: playlist });
    } catch (error) {
      next(error);
    }
  },

  async getItemCount(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const count = await playlistService.getItemCount(req.params.id);
      res.json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  },

  async getTotalDuration(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const duration = await playlistService.getTotalDuration(req.params.id);
      res.json({ success: true, data: { duration } });
    } catch (error) {
      next(error);
    }
  },
};

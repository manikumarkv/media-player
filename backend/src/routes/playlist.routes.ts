import { Router, type IRouter } from 'express';
import { ROUTES } from '@media-player/shared';
import { playlistController } from '../controllers/index.js';
import { validate } from '../validation/index.js';
import {
  playlistIdSchema,
  paginationSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
  addPlaylistItemSchema,
  reorderPlaylistSchema,
  movePlaylistItemSchema,
} from '../validation/playlist.schema.js';

const router: IRouter = Router();

// GET /playlists - List all playlists
router.get(
  ROUTES.PLAYLISTS.BASE,
  validate(paginationSchema, 'query'),
  playlistController.list
);

// GET /playlists/:id - Get playlist by ID with items
router.get(
  ROUTES.PLAYLISTS.BY_ID,
  validate(playlistIdSchema, 'params'),
  playlistController.getById
);

// POST /playlists - Create new playlist
router.post(
  ROUTES.PLAYLISTS.BASE,
  validate(createPlaylistSchema, 'body'),
  playlistController.create
);

// PATCH /playlists/:id - Update playlist
router.patch(
  ROUTES.PLAYLISTS.BY_ID,
  validate(playlistIdSchema, 'params'),
  validate(updatePlaylistSchema, 'body'),
  playlistController.update
);

// DELETE /playlists/:id - Delete playlist
router.delete(
  ROUTES.PLAYLISTS.BY_ID,
  validate(playlistIdSchema, 'params'),
  playlistController.delete
);

// POST /playlists/:id/items - Add item to playlist
router.post(
  ROUTES.PLAYLISTS.ITEMS,
  validate(playlistIdSchema, 'params'),
  validate(addPlaylistItemSchema, 'body'),
  playlistController.addItem
);

// DELETE /playlists/:id/items/:mediaId - Remove item from playlist
router.delete(
  `${ROUTES.PLAYLISTS.ITEMS}/:mediaId`,
  playlistController.removeItem
);

// PUT /playlists/:id/reorder - Reorder playlist items
router.put(
  ROUTES.PLAYLISTS.REORDER,
  validate(playlistIdSchema, 'params'),
  validate(reorderPlaylistSchema, 'body'),
  playlistController.reorderItems
);

// PATCH /playlists/:id/move - Move item to new position
router.patch(
  `${ROUTES.PLAYLISTS.BY_ID}/move`,
  validate(playlistIdSchema, 'params'),
  validate(movePlaylistItemSchema, 'body'),
  playlistController.moveItem
);

// DELETE /playlists/:id/clear - Clear all items from playlist
router.delete(
  `${ROUTES.PLAYLISTS.BY_ID}/clear`,
  validate(playlistIdSchema, 'params'),
  playlistController.clear
);

// GET /playlists/:id/count - Get item count
router.get(
  `${ROUTES.PLAYLISTS.BY_ID}/count`,
  validate(playlistIdSchema, 'params'),
  playlistController.getItemCount
);

// GET /playlists/:id/duration - Get total duration
router.get(
  `${ROUTES.PLAYLISTS.BY_ID}/duration`,
  validate(playlistIdSchema, 'params'),
  playlistController.getTotalDuration
);

export default router;

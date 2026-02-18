import { Router, type Router as RouterType } from 'express';
import mediaRoutes from './media.routes.js';
import playlistRoutes from './playlist.routes.js';
import queueRoutes from './queue.routes.js';
import historyRoutes from './history.routes.js';
import likesRoutes from './likes.routes.js';
import downloadRoutes from './download.routes.js';
import youtubeSyncRoutes from './youtube-sync.routes.js';

export const router: RouterType = Router();

// Mount route modules
router.use(mediaRoutes);
router.use(playlistRoutes);
router.use(queueRoutes);
router.use(historyRoutes);
router.use(likesRoutes);
router.use(downloadRoutes);
router.use(youtubeSyncRoutes);

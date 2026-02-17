import { type Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { SOCKET_EVENTS, type DownloadProgressPayload } from '@media-player/shared';
import { config } from '../config/database.js';

let io: Server | null = null;

export const socketService = {
  initialize(httpServer: HttpServer): Server {
    io = new Server(httpServer, {
      cors: {
        origin: config.frontendUrl,
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket: Socket) => {
      console.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.info(`Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  getIO(): Server {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },

  // Download events
  emitDownloadStarted(downloadId: string, title: string): void {
    io?.emit(SOCKET_EVENTS.DOWNLOAD.STARTED, { downloadId, title });
  },

  emitDownloadProgress(data: DownloadProgressPayload): void {
    io?.emit(SOCKET_EVENTS.DOWNLOAD.PROGRESS, data);
  },

  emitDownloadCompleted(downloadId: string, mediaId: string): void {
    io?.emit(SOCKET_EVENTS.DOWNLOAD.COMPLETED, { downloadId, mediaId });
  },

  emitDownloadError(downloadId: string, error: string): void {
    io?.emit(SOCKET_EVENTS.DOWNLOAD.ERROR, { downloadId, error });
  },

  emitDownloadCancelled(downloadId: string): void {
    io?.emit(SOCKET_EVENTS.DOWNLOAD.CANCELLED, { downloadId });
  },

  // Library events
  emitMediaAdded(mediaId: string): void {
    io?.emit(SOCKET_EVENTS.LIBRARY.MEDIA_ADDED, { mediaId });
  },

  emitMediaUpdated(mediaId: string): void {
    io?.emit(SOCKET_EVENTS.LIBRARY.MEDIA_UPDATED, { mediaId });
  },

  emitMediaDeleted(mediaId: string): void {
    io?.emit(SOCKET_EVENTS.LIBRARY.MEDIA_DELETED, { mediaId });
  },

  emitPlaylistUpdated(playlistId: string): void {
    io?.emit(SOCKET_EVENTS.LIBRARY.PLAYLIST_UPDATED, { playlistId });
  },
};

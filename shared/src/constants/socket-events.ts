/**
 * Socket.io event names
 * All socket events should be defined here for type safety
 */

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Download events
  DOWNLOAD: {
    STARTED: 'download:started',
    PROGRESS: 'download:progress',
    COMPLETED: 'download:completed',
    ERROR: 'download:error',
    CANCELLED: 'download:cancelled',
  },

  // Player sync events (for future multi-device support)
  PLAYER: {
    STATE_CHANGED: 'player:state-changed',
    TRACK_CHANGED: 'player:track-changed',
    SEEK: 'player:seek',
    VOLUME_CHANGED: 'player:volume-changed',
  },

  // Library events
  LIBRARY: {
    MEDIA_ADDED: 'library:media-added',
    MEDIA_UPDATED: 'library:media-updated',
    MEDIA_DELETED: 'library:media-deleted',
    PLAYLIST_UPDATED: 'library:playlist-updated',
  },
} as const;

// Type helpers for socket event payloads
export interface DownloadProgressPayload {
  downloadId: string;
  progress: number;
  speed: string;
  eta: string;
}

export interface DownloadCompletedPayload {
  downloadId: string;
  mediaId: string;
}

export interface DownloadErrorPayload {
  downloadId: string;
  error: string;
}

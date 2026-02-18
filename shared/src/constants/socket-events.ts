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

  // YouTube Sync events
  YOUTUBE_SYNC: {
    STARTED: 'youtube-sync:started',
    PROGRESS: 'youtube-sync:progress',
    COMPLETED: 'youtube-sync:completed',
    ERROR: 'youtube-sync:error',
    AUTH_REQUIRED: 'youtube-sync:auth-required',
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

// YouTube Sync payload types
export interface YouTubeSyncProgressPayload {
  totalVideos: number;
  processedVideos: number;
  downloadedVideos: number;
  skippedVideos: number;
  failedVideos: number;
  currentVideo?: string;
}

export interface YouTubeSyncCompletedPayload {
  videosFound: number;
  videosDownloaded: number;
  videosSkipped: number;
  videosFailed: number;
}

export interface YouTubeSyncErrorPayload {
  error: string;
}

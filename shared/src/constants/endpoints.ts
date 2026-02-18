/**
 * API Endpoint builders
 * Use these functions to build full API URLs
 */

import { API_PREFIX, ROUTES, buildRoute, type RouteParams } from './routes';

/**
 * Build a full API endpoint URL
 */
function endpoint(route: string, params?: RouteParams): string {
  return `${API_PREFIX}${buildRoute(route, params)}`;
}

export const ENDPOINTS = {
  // Health (no API prefix)
  health: () => ROUTES.HEALTH,

  // Media
  media: {
    list: () => endpoint(ROUTES.MEDIA.BASE),
    get: (id: string) => endpoint(ROUTES.MEDIA.BY_ID, { id }),
    stream: (id: string) => endpoint(ROUTES.MEDIA.STREAM, { id }),
    thumbnail: (id: string) => endpoint(ROUTES.MEDIA.THUMBNAIL, { id }),
    search: (query: string) => `${endpoint(ROUTES.MEDIA.SEARCH)}?q=${encodeURIComponent(query)}`,
    create: () => endpoint(ROUTES.MEDIA.BASE),
    update: (id: string) => endpoint(ROUTES.MEDIA.BY_ID, { id }),
    delete: (id: string) => endpoint(ROUTES.MEDIA.BY_ID, { id }),
  },

  // Playlists
  playlists: {
    list: () => endpoint(ROUTES.PLAYLISTS.BASE),
    get: (id: string) => endpoint(ROUTES.PLAYLISTS.BY_ID, { id }),
    create: () => endpoint(ROUTES.PLAYLISTS.BASE),
    update: (id: string) => endpoint(ROUTES.PLAYLISTS.BY_ID, { id }),
    delete: (id: string) => endpoint(ROUTES.PLAYLISTS.BY_ID, { id }),
    items: (id: string) => endpoint(ROUTES.PLAYLISTS.ITEMS, { id }),
    addItem: (id: string) => endpoint(ROUTES.PLAYLISTS.ITEMS, { id }),
    removeItem: (id: string, itemId: string) =>
      endpoint(ROUTES.PLAYLISTS.ITEM, { id, itemId }),
    reorder: (id: string) => endpoint(ROUTES.PLAYLISTS.REORDER, { id }),
  },

  // Queue
  queue: {
    get: () => endpoint(ROUTES.QUEUE.BASE),
    add: () => endpoint(ROUTES.QUEUE.ADD),
    remove: (id: string) => endpoint(ROUTES.QUEUE.REMOVE, { id }),
    clear: () => endpoint(ROUTES.QUEUE.CLEAR),
    reorder: () => endpoint(ROUTES.QUEUE.REORDER),
  },

  // History
  history: {
    list: () => endpoint(ROUTES.HISTORY.BASE),
    add: () => endpoint(ROUTES.HISTORY.BASE),
    clear: () => endpoint(ROUTES.HISTORY.CLEAR),
  },

  // Likes
  likes: {
    list: () => endpoint(ROUTES.LIKES.BASE),
    toggle: (mediaId: string) => endpoint(ROUTES.LIKES.TOGGLE, { mediaId }),
  },

  // Downloads
  downloads: {
    list: () => endpoint(ROUTES.DOWNLOADS.BASE),
    start: () => endpoint(ROUTES.DOWNLOADS.START),
    cancel: (id: string) => endpoint(ROUTES.DOWNLOADS.CANCEL, { id }),
    info: (url: string) =>
      `${endpoint(ROUTES.DOWNLOADS.INFO)}?url=${encodeURIComponent(url)}`,
    playlistInfo: () => endpoint(ROUTES.DOWNLOADS.PLAYLIST_INFO),
    playlistStart: () => endpoint(ROUTES.DOWNLOADS.PLAYLIST_START),
  },

  // YouTube Sync
  youtubeSync: {
    status: () => endpoint(ROUTES.YOUTUBE_SYNC.STATUS),
    settings: () => endpoint(ROUTES.YOUTUBE_SYNC.SETTINGS),
    history: () => endpoint(ROUTES.YOUTUBE_SYNC.HISTORY),
    auth: {
      browser: () => endpoint(ROUTES.YOUTUBE_SYNC.AUTH.BROWSER),
      browserStatus: () => endpoint(ROUTES.YOUTUBE_SYNC.AUTH.BROWSER_STATUS),
      cookie: () => endpoint(ROUTES.YOUTUBE_SYNC.AUTH.COOKIE),
      mountVerify: () => endpoint(ROUTES.YOUTUBE_SYNC.AUTH.MOUNT_VERIFY),
    },
    sync: () => endpoint(ROUTES.YOUTUBE_SYNC.SYNC),
    disconnect: () => endpoint(ROUTES.YOUTUBE_SYNC.DISCONNECT),
  },
} as const;

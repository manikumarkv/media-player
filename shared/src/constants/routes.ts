/**
 * API Route definitions
 * All API routes should be defined here to ensure consistency
 */

export const API_PREFIX = '/api/v1';

export const ROUTES = {
  // Health
  HEALTH: '/health',

  // Media
  MEDIA: {
    BASE: '/media',
    BY_ID: '/media/:id',
    STREAM: '/media/:id/stream',
    THUMBNAIL: '/media/:id/thumbnail',
    SEARCH: '/media/search',
  },

  // Playlists
  PLAYLISTS: {
    BASE: '/playlists',
    BY_ID: '/playlists/:id',
    ITEMS: '/playlists/:id/items',
    ITEM: '/playlists/:id/items/:itemId',
    REORDER: '/playlists/:id/reorder',
  },

  // Queue
  QUEUE: {
    BASE: '/queue',
    ADD: '/queue/add',
    REMOVE: '/queue/:id',
    CLEAR: '/queue/clear',
    REORDER: '/queue/reorder',
  },

  // History
  HISTORY: {
    BASE: '/history',
    CLEAR: '/history/clear',
  },

  // Likes
  LIKES: {
    BASE: '/likes',
    TOGGLE: '/likes/:mediaId',
  },

  // Downloads
  DOWNLOADS: {
    BASE: '/downloads',
    START: '/downloads/start',
    CANCEL: '/downloads/:id',
    INFO: '/downloads/info',
  },
} as const;

// Helper type for route parameter replacement
export type RouteParams = Record<string, string | number>;

/**
 * Replace route parameters with actual values
 * @example buildRoute('/media/:id', { id: '123' }) => '/media/123'
 */
export function buildRoute(route: string, params?: RouteParams): string {
  if (!params) return route;

  let result = route;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}

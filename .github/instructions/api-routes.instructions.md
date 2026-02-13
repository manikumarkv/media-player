# API Routes & URL Management Instructions

**Project:** YouTube Media Player - Centralized URL Management  
**Purpose:** Define patterns for managing all API routes and URLs in a single source of truth  
**Scope:** Frontend API client, Backend routing, URL constants

---

## 🎯 Core Principle

**All URLs, routes, and endpoints defined in ONE place, shared between frontend and backend.**

**Benefits:**
- ✅ No typos or mismatches between FE and BE
- ✅ Easy refactoring (change once, update everywhere)
- ✅ Type-safe endpoint definitions
- ✅ Centralized documentation
- ✅ IDE autocomplete for all routes

---

## 📁 File Structure

```
project-root/
├── shared/
│   ├── constants/
│   │   ├── routes.ts           # API route definitions
│   │   ├── endpoints.ts        # Full endpoint builders
│   │   └── socket-events.ts    # Socket.io event names
│   └── types/
│       └── api.ts              # API request/response types
├── backend/
│   └── src/
│       └── routes/
│           └── index.ts        # Uses shared routes
└── frontend/
    └── src/
        └── api/
            └── client.ts       # Uses shared endpoints
```

---

## 🔧 Implementation Pattern

### 1. **Shared Routes Definition** (`shared/constants/routes.ts`)

**This file defines ALL route paths as constants:**

```typescript
/**
 * Centralized API Route Definitions
 * 
 * IMPORTANT: This file is the single source of truth for all API routes.
 * Both frontend and backend import from this file.
 * 
 * Pattern: /api/<resource>/<action>
 */

export const API_BASE = '/api';

// Media Routes
export const MEDIA_ROUTES = {
  BASE: '/media',
  BY_ID: '/media/:id',
  SEARCH: '/media/search',
  LIKED: '/media/liked',
  FREQUENT: '/media/frequent',
  RECENT: '/media/recent',
  STREAM: '/media/stream/:filename',
} as const;

// Playlist Routes
export const PLAYLIST_ROUTES = {
  BASE: '/playlists',
  BY_ID: '/playlists/:id',
  MEDIA: '/playlists/:id/media',
  ADD_MEDIA: '/playlists/:id/media/:mediaId',
  REMOVE_MEDIA: '/playlists/:id/media/:mediaId',
  REORDER: '/playlists/:id/reorder',
} as const;

// Player Routes
export const PLAYER_ROUTES = {
  PLAY: '/player/play/:id',
  PAUSE: '/player/pause',
  RESUME: '/player/resume/:id',
  HISTORY: '/player/history',
  CURRENT: '/player/current',
  POSITION: '/player/position',
} as const;

// Download Routes
export const DOWNLOAD_ROUTES = {
  BASE: '/downloads',
  BY_ID: '/downloads/:id',
  START: '/downloads/start',
  CANCEL: '/downloads/:id/cancel',
  STATUS: '/downloads/:id/status',
  QUEUE: '/downloads/queue',
} as const;

// Search Routes
export const SEARCH_ROUTES = {
  GLOBAL: '/search',
  MEDIA: '/search/media',
  PLAYLISTS: '/search/playlists',
  ARTISTS: '/search/artists',
} as const;

// Statistics Routes
export const STATS_ROUTES = {
  OVERVIEW: '/stats/overview',
  MEDIA: '/stats/media/:id',
  LISTENING: '/stats/listening',
  TOP_PLAYED: '/stats/top-played',
} as const;

// All routes combined for easy access
export const API_ROUTES = {
  MEDIA: MEDIA_ROUTES,
  PLAYLIST: PLAYLIST_ROUTES,
  PLAYER: PLAYER_ROUTES,
  DOWNLOAD: DOWNLOAD_ROUTES,
  SEARCH: SEARCH_ROUTES,
  STATS: STATS_ROUTES,
} as const;

// Route builder helper type
export type RouteParams = Record<string, string | number>;
```

---

### 2. **Endpoint Builders** (`shared/constants/endpoints.ts`)

**Functions to build complete URLs with parameters:**

```typescript
import { API_BASE, API_ROUTES, RouteParams } from './routes';

/**
 * Endpoint Builder Utilities
 * 
 * These functions build complete URLs from route definitions,
 * replacing parameters with actual values.
 */

/**
 * Replace route parameters with actual values
 * Example: buildUrl('/media/:id', { id: '123' }) => '/media/123'
 */
export function buildUrl(route: string, params?: RouteParams): string {
  if (!params) return route;
  
  let url = route;
  for (const [key, value] of Object.entries(params)) {
    url = url.replace(`:${key}`, String(value));
  }
  
  return url;
}

/**
 * Build full API URL with base path
 */
export function buildApiUrl(route: string, params?: RouteParams): string {
  return API_BASE + buildUrl(route, params);
}

/**
 * Add query parameters to URL
 */
export function addQueryParams(url: string, query?: Record<string, any>): string {
  if (!query || Object.keys(query).length === 0) return url;
  
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

// === Media Endpoints ===

export const mediaEndpoints = {
  list: (query?: { limit?: number; offset?: number; liked?: boolean }) =>
    addQueryParams(buildApiUrl(API_ROUTES.MEDIA.BASE), query),
  
  getById: (id: string) =>
    buildApiUrl(API_ROUTES.MEDIA.BY_ID, { id }),
  
  search: (query: string, filters?: Record<string, any>) =>
    addQueryParams(buildApiUrl(API_ROUTES.MEDIA.SEARCH), { q: query, ...filters }),
  
  liked: () =>
    buildApiUrl(API_ROUTES.MEDIA.LIKED),
  
  frequent: (limit = 20) =>
    addQueryParams(buildApiUrl(API_ROUTES.MEDIA.FREQUENT), { limit }),
  
  recent: (limit = 20) =>
    addQueryParams(buildApiUrl(API_ROUTES.MEDIA.RECENT), { limit }),
  
  stream: (filename: string) =>
    buildApiUrl(API_ROUTES.MEDIA.STREAM, { filename }),
  
  update: (id: string) =>
    buildApiUrl(API_ROUTES.MEDIA.BY_ID, { id }),
  
  delete: (id: string) =>
    buildApiUrl(API_ROUTES.MEDIA.BY_ID, { id }),
};

// === Playlist Endpoints ===

export const playlistEndpoints = {
  list: () =>
    buildApiUrl(API_ROUTES.PLAYLIST.BASE),
  
  create: () =>
    buildApiUrl(API_ROUTES.PLAYLIST.BASE),
  
  getById: (id: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.BY_ID, { id }),
  
  getMedia: (id: string, query?: { limit?: number; offset?: number }) =>
    addQueryParams(buildApiUrl(API_ROUTES.PLAYLIST.MEDIA, { id }), query),
  
  addMedia: (playlistId: string, mediaId: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.ADD_MEDIA, { id: playlistId, mediaId }),
  
  removeMedia: (playlistId: string, mediaId: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.REMOVE_MEDIA, { id: playlistId, mediaId }),
  
  reorder: (id: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.REORDER, { id }),
  
  update: (id: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.BY_ID, { id }),
  
  delete: (id: string) =>
    buildApiUrl(API_ROUTES.PLAYLIST.BY_ID, { id }),
};

// === Player Endpoints ===

export const playerEndpoints = {
  play: (id: string) =>
    buildApiUrl(API_ROUTES.PLAYER.PLAY, { id }),
  
  pause: () =>
    buildApiUrl(API_ROUTES.PLAYER.PAUSE),
  
  resume: (id: string, position?: number) =>
    addQueryParams(buildApiUrl(API_ROUTES.PLAYER.RESUME, { id }), { position }),
  
  history: (query?: { limit?: number; offset?: number }) =>
    addQueryParams(buildApiUrl(API_ROUTES.PLAYER.HISTORY), query),
  
  current: () =>
    buildApiUrl(API_ROUTES.PLAYER.CURRENT),
  
  updatePosition: () =>
    buildApiUrl(API_ROUTES.PLAYER.POSITION),
};

// === Download Endpoints ===

export const downloadEndpoints = {
  list: () =>
    buildApiUrl(API_ROUTES.DOWNLOAD.BASE),
  
  start: () =>
    buildApiUrl(API_ROUTES.DOWNLOAD.START),
  
  getById: (id: string) =>
    buildApiUrl(API_ROUTES.DOWNLOAD.BY_ID, { id }),
  
  cancel: (id: string) =>
    buildApiUrl(API_ROUTES.DOWNLOAD.CANCEL, { id }),
  
  status: (id: string) =>
    buildApiUrl(API_ROUTES.DOWNLOAD.STATUS, { id }),
  
  queue: () =>
    buildApiUrl(API_ROUTES.DOWNLOAD.QUEUE),
};

// === Search Endpoints ===

export const searchEndpoints = {
  global: (query: string) =>
    addQueryParams(buildApiUrl(API_ROUTES.SEARCH.GLOBAL), { q: query }),
  
  media: (query: string, filters?: Record<string, any>) =>
    addQueryParams(buildApiUrl(API_ROUTES.SEARCH.MEDIA), { q: query, ...filters }),
  
  playlists: (query: string) =>
    addQueryParams(buildApiUrl(API_ROUTES.SEARCH.PLAYLISTS), { q: query }),
  
  artists: (query: string) =>
    addQueryParams(buildApiUrl(API_ROUTES.SEARCH.ARTISTS), { q: query }),
};

// === Statistics Endpoints ===

export const statsEndpoints = {
  overview: () =>
    buildApiUrl(API_ROUTES.STATS.OVERVIEW),
  
  media: (id: string) =>
    buildApiUrl(API_ROUTES.STATS.MEDIA, { id }),
  
  listening: (query?: { from?: string; to?: string }) =>
    addQueryParams(buildApiUrl(API_ROUTES.STATS.LISTENING), query),
  
  topPlayed: (limit = 10) =>
    addQueryParams(buildApiUrl(API_ROUTES.STATS.TOP_PLAYED), { limit }),
};

// Export all endpoints in one object
export const endpoints = {
  media: mediaEndpoints,
  playlist: playlistEndpoints,
  player: playerEndpoints,
  download: downloadEndpoints,
  search: searchEndpoints,
  stats: statsEndpoints,
};
```

---

### 3. **Socket Event Names** (`shared/constants/socket-events.ts`)

**Centralized Socket.io event definitions:**

```typescript
/**
 * Socket.io Event Names
 * 
 * Single source of truth for all real-time events.
 * Used by both frontend listeners and backend emitters.
 */

// Download Events
export const DOWNLOAD_EVENTS = {
  STARTED: 'download:started',
  PROGRESS: 'download:progress',
  COMPLETE: 'download:complete',
  ERROR: 'download:error',
  CANCELLED: 'download:cancelled',
} as const;

// Player Events
export const PLAYER_EVENTS = {
  SYNC: 'player:sync',
  PLAY: 'player:play',
  PAUSE: 'player:pause',
  SEEK: 'player:seek',
  VOLUME: 'player:volume',
} as const;

// Library Events
export const LIBRARY_EVENTS = {
  MEDIA_ADDED: 'library:media-added',
  MEDIA_UPDATED: 'library:media-updated',
  MEDIA_DELETED: 'library:media-deleted',
  PLAYLIST_ADDED: 'library:playlist-added',
  PLAYLIST_UPDATED: 'library:playlist-updated',
  PLAYLIST_DELETED: 'library:playlist-deleted',
} as const;

// System Events
export const SYSTEM_EVENTS = {
  HEALTH_CHECK: 'system:health',
  ERROR: 'system:error',
} as const;

// All events combined
export const SOCKET_EVENTS = {
  DOWNLOAD: DOWNLOAD_EVENTS,
  PLAYER: PLAYER_EVENTS,
  LIBRARY: LIBRARY_EVENTS,
  SYSTEM: SYSTEM_EVENTS,
} as const;

// Type helpers
export type DownloadEvent = typeof DOWNLOAD_EVENTS[keyof typeof DOWNLOAD_EVENTS];
export type PlayerEvent = typeof PLAYER_EVENTS[keyof typeof PLAYER_EVENTS];
export type LibraryEvent = typeof LIBRARY_EVENTS[keyof typeof LIBRARY_EVENTS];
export type SystemEvent = typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS];
export type SocketEvent = DownloadEvent | PlayerEvent | LibraryEvent | SystemEvent;
```

---

## 🎯 Backend Usage

### **Route Definitions** (`backend/src/routes/media.routes.ts`)

```typescript
import { Router } from 'express';
import { API_ROUTES } from '../../../shared/constants/routes';
import { mediaController } from '../controllers/media.controller';

const router = Router();

// Use shared route constants - NO hardcoded strings!
router.get(API_ROUTES.MEDIA.BASE, mediaController.list);
router.get(API_ROUTES.MEDIA.BY_ID, mediaController.getById);
router.get(API_ROUTES.MEDIA.SEARCH, mediaController.search);
router.get(API_ROUTES.MEDIA.LIKED, mediaController.getLiked);
router.get(API_ROUTES.MEDIA.FREQUENT, mediaController.getFrequent);
router.get(API_ROUTES.MEDIA.RECENT, mediaController.getRecent);
router.get(API_ROUTES.MEDIA.STREAM, mediaController.stream);
router.patch(API_ROUTES.MEDIA.BY_ID, mediaController.update);
router.delete(API_ROUTES.MEDIA.BY_ID, mediaController.delete);

export default router;
```

### **Socket Emitters** (`backend/src/services/download.service.ts`)

```typescript
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events';
import { SocketService } from './socket.service';

export class DownloadService {
  constructor(private socketService: SocketService) {}
  
  async downloadMedia(url: string, socketId: string): Promise<void> {
    // Emit using shared event constants
    this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.STARTED, {
      url,
      timestamp: new Date(),
    });
    
    // ... download logic ...
    
    this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.PROGRESS, {
      progress: 50,
      bytesDownloaded: 1024000,
      bytesTotal: 2048000,
    });
    
    // ... more logic ...
    
    this.socketService.emitTo(socketId, SOCKET_EVENTS.DOWNLOAD.COMPLETE, {
      url,
      mediaId: 'abc123',
    });
  }
}
```

---

## 🎨 Frontend Usage

### **API Client** (`frontend/src/api/client.ts`)

```typescript
import { endpoints } from '../../../shared/constants/endpoints';

class ApiClient {
  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }
    
    return response.json();
  }
  
  // Media API
  media = {
    list: (query?: { limit?: number; offset?: number; liked?: boolean }) =>
      this.request(endpoints.media.list(query)),
    
    getById: (id: string) =>
      this.request(endpoints.media.getById(id)),
    
    search: (query: string, filters?: Record<string, any>) =>
      this.request(endpoints.media.search(query, filters)),
    
    liked: () =>
      this.request(endpoints.media.liked()),
    
    update: (id: string, data: Partial<Media>) =>
      this.request(endpoints.media.update(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      this.request(endpoints.media.delete(id), { method: 'DELETE' }),
  };
  
  // Playlist API
  playlist = {
    list: () =>
      this.request(endpoints.playlist.list()),
    
    create: (data: CreatePlaylistDto) =>
      this.request(endpoints.playlist.create(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    getById: (id: string) =>
      this.request(endpoints.playlist.getById(id)),
    
    addMedia: (playlistId: string, mediaId: string) =>
      this.request(endpoints.playlist.addMedia(playlistId, mediaId), {
        method: 'POST',
      }),
  };
  
  // Player API
  player = {
    play: (id: string) =>
      this.request(endpoints.player.play(id), { method: 'POST' }),
    
    resume: (id: string, position?: number) =>
      this.request(endpoints.player.resume(id, position), { method: 'POST' }),
    
    history: (query?: { limit?: number; offset?: number }) =>
      this.request(endpoints.player.history(query)),
  };
  
  // Download API
  download = {
    start: (data: StartDownloadDto) =>
      this.request(endpoints.download.start(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    cancel: (id: string) =>
      this.request(endpoints.download.cancel(id), { method: 'POST' }),
    
    status: (id: string) =>
      this.request(endpoints.download.status(id)),
  };
}

export const api = new ApiClient();
```

### **Socket Listeners** (`frontend/src/hooks/useDownloadProgress.ts`)

```typescript
import { useEffect, useState } from 'react';
import { SOCKET_EVENTS } from '../../../shared/constants/socket-events';
import { socket } from '../api/socket';

export function useDownloadProgress(downloadId: string) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'pending' | 'downloading' | 'complete' | 'error'>('pending');
  
  useEffect(() => {
    // Use shared event constants
    socket.on(SOCKET_EVENTS.DOWNLOAD.STARTED, (data) => {
      if (data.downloadId === downloadId) {
        setStatus('downloading');
      }
    });
    
    socket.on(SOCKET_EVENTS.DOWNLOAD.PROGRESS, (data) => {
      if (data.downloadId === downloadId) {
        setProgress(data.progress);
      }
    });
    
    socket.on(SOCKET_EVENTS.DOWNLOAD.COMPLETE, (data) => {
      if (data.downloadId === downloadId) {
        setStatus('complete');
        setProgress(100);
      }
    });
    
    socket.on(SOCKET_EVENTS.DOWNLOAD.ERROR, (data) => {
      if (data.downloadId === downloadId) {
        setStatus('error');
      }
    });
    
    return () => {
      socket.off(SOCKET_EVENTS.DOWNLOAD.STARTED);
      socket.off(SOCKET_EVENTS.DOWNLOAD.PROGRESS);
      socket.off(SOCKET_EVENTS.DOWNLOAD.COMPLETE);
      socket.off(SOCKET_EVENTS.DOWNLOAD.ERROR);
    };
  }, [downloadId]);
  
  return { progress, status };
}
```

---

## 📦 Sharing Strategy

### **Option 1: Monorepo with Shared Package** (Recommended)

```
project-root/
├── packages/
│   ├── shared/           # Shared package
│   │   ├── src/
│   │   │   ├── constants/
│   │   │   └── types/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── backend/          # Backend package
│   │   └── package.json  # depends on @project/shared
│   └── frontend/         # Frontend package
│       └── package.json  # depends on @project/shared
├── package.json          # Root package
└── pnpm-workspace.yaml   # or yarn workspaces
```

**Root `package.json`:**
```json
{
  "name": "media-player",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

**Shared `package.json`:**
```json
{
  "name": "@media-player/shared",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  }
}
```

**Import in Backend/Frontend:**
```typescript
import { endpoints, API_ROUTES, SOCKET_EVENTS } from '@media-player/shared';
```

---

### **Option 2: Symlinked Directory** (Simpler for Docker)

```
project-root/
├── shared/               # Shared directory
│   ├── constants/
│   └── types/
├── backend/
│   ├── src/
│   └── shared -> ../shared   # Symlink
└── frontend/
    ├── src/
    └── shared -> ../shared   # Symlink
```

**Import:**
```typescript
import { endpoints } from '../shared/constants/endpoints';
```

**Docker Consideration:**
```dockerfile
# Copy shared directory in both Dockerfiles
COPY shared /app/shared
COPY backend /app/backend
```

---

### **Option 3: Code Generation** (Most Flexible)

Generate endpoints from OpenAPI spec:

```bash
# Generate TypeScript from OpenAPI
npm run generate:api

# Creates:
# - backend/src/generated/routes.ts
# - frontend/src/generated/endpoints.ts
```

---

## ✅ Best Practices

### 1. **Never Hardcode Routes**

```typescript
// ❌ BAD - Hardcoded string
router.get('/api/media/:id', controller.getById);
fetch('/api/media/123');

// ✅ GOOD - Use constants
router.get(API_ROUTES.MEDIA.BY_ID, controller.getById);
fetch(endpoints.media.getById('123'));
```

### 2. **Type-Safe Parameters**

```typescript
// Add type checking to endpoint builders
export function getMediaUrl(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error('Media ID must be a non-empty string');
  }
  return buildApiUrl(API_ROUTES.MEDIA.BY_ID, { id });
}
```

### 3. **Validate at Build Time**

```typescript
// Test that all routes are valid
describe('Route Definitions', () => {
  it('should not have duplicate routes', () => {
    const allRoutes = Object.values(API_ROUTES).flatMap(Object.values);
    const uniqueRoutes = new Set(allRoutes);
    expect(allRoutes.length).toBe(uniqueRoutes.size);
  });
  
  it('should match expected pattern', () => {
    Object.values(API_ROUTES).forEach(group => {
      Object.values(group).forEach(route => {
        expect(route).toMatch(/^\/[a-z0-9-/:]+$/);
      });
    });
  });
});
```

### 4. **Document Changes**

```typescript
/**
 * CHANGELOG
 * 
 * 2024-01-15: Added MEDIA.STREAM route
 * 2024-01-10: Renamed PLAYLIST.SONGS to PLAYLIST.MEDIA
 * 2024-01-05: Initial route definitions
 */
```

---

## 🔄 Migration Strategy

### Phase 1: Create Shared Constants
1. Create `shared/constants/` directory
2. Move all route strings to `routes.ts`
3. Create endpoint builders in `endpoints.ts`

### Phase 2: Update Backend
1. Replace hardcoded routes with `API_ROUTES.*`
2. Test all endpoints still work
3. Update socket emitters to use `SOCKET_EVENTS`

### Phase 3: Update Frontend
1. Replace API calls with `endpoints.*`
2. Update socket listeners with `SOCKET_EVENTS`
3. Test all features work

### Phase 4: Validation
1. Add tests for route definitions
2. Add TypeScript strict checks
3. Document all endpoints

---

## 📝 Maintenance

### Adding New Endpoint

1. **Add to routes.ts:**
```typescript
export const MEDIA_ROUTES = {
  // ... existing routes
  LYRICS: '/media/:id/lyrics',  // NEW
} as const;
```

2. **Add to endpoints.ts:**
```typescript
export const mediaEndpoints = {
  // ... existing endpoints
  getLyrics: (id: string) =>
    buildApiUrl(API_ROUTES.MEDIA.LYRICS, { id }),
};
```

3. **Use in backend:**
```typescript
router.get(API_ROUTES.MEDIA.LYRICS, mediaController.getLyrics);
```

4. **Use in frontend:**
```typescript
const lyrics = await api.media.getLyrics(mediaId);
```

### Refactoring Route

1. Update in `routes.ts` (ONE place)
2. Re-run tests
3. Both FE and BE automatically updated! ✅

---

## 🎯 Summary

**Key Files:**
- `shared/constants/routes.ts` - Route path definitions
- `shared/constants/endpoints.ts` - URL builders
- `shared/constants/socket-events.ts` - Event names

**Usage:**
- Backend: Import `API_ROUTES` and `SOCKET_EVENTS`
- Frontend: Import `endpoints` and `SOCKET_EVENTS`

**Benefits:**
- ✅ Single source of truth
- ✅ Type-safe endpoints
- ✅ No FE/BE mismatches
- ✅ Easy refactoring
- ✅ IDE autocomplete

**Never again:**
- ❌ Typos in route strings
- ❌ FE/BE route mismatches
- ❌ Forgetting to update both sides
- ❌ Copy-pasting route strings

---

## 📚 Related Instructions

- **Architecture:** `.github/instructions/architecture.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Frontend:** `.github/instructions/frontend.instructions.md`

---

**When to Reference:**
- ✅ Creating new API endpoints
- ✅ Adding socket events
- ✅ Refactoring routes
- ✅ Setting up frontend API client
- ✅ Implementing new features

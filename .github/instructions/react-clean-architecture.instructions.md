# React Clean Architecture Instructions

**Project:** YouTube Media Player - React Business Logic Separation  
**Purpose:** Enforce clean separation between UI components and business logic  
**Scope:** Frontend architecture patterns for maintainable, testable React code

---

## 🎯 Core Principle

**Business logic MUST be separated from React components.**

### Why?
✅ **Testability** - Test logic without rendering components  
✅ **Reusability** - Share logic across multiple components  
✅ **Maintainability** - Change logic without touching UI  
✅ **Performance** - Easier to optimize and memoize  
✅ **Type Safety** - Better TypeScript inference

---

## 📐 Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│              PRESENTATION LAYER                      │
│  React Components (UI only, no business logic)      │
│  ├─ Pages/        (Route containers)                │
│  ├─ Features/     (Feature containers)               │
│  └─ Common/       (Reusable UI)                      │
├─────────────────────────────────────────────────────┤
│              HOOKS LAYER                             │
│  Custom Hooks (Connect UI to logic)                 │
│  ├─ useMedia()    usePlayer()   usePlaylist()       │
│  ├─ useDownload() useSearch()   useLibrary()        │
│  └─ useDebounce() useLocalStorage() usePagination() │
├─────────────────────────────────────────────────────┤
│              STATE MANAGEMENT LAYER                  │
│  Zustand Stores (Global state + actions)            │
│  ├─ playerStore   (current media, queue, controls)  │
│  ├─ libraryStore  (filters, sorting, view mode)     │
│  └─ uiStore       (theme, modals, notifications)    │
├─────────────────────────────────────────────────────┤
│              SERVICE LAYER                           │
│  Business Logic (Pure TypeScript functions)         │
│  ├─ mediaService     (media operations)             │
│  ├─ playlistService  (playlist logic)               │
│  ├─ downloadService  (download coordination)        │
│  └─ playerService    (player behavior)              │
├─────────────────────────────────────────────────────┤
│              API LAYER                               │
│  HTTP Client (Network calls only)                   │
│  ├─ api/media.ts      (CRUD operations)             │
│  ├─ api/playlist.ts   (Playlist API)                │
│  └─ api/download.ts   (Download API)                │
├─────────────────────────────────────────────────────┤
│              UTILITIES LAYER                         │
│  Pure Helper Functions (No side effects)            │
│  ├─ formatters/    (dates, durations, file sizes)   │
│  ├─ validators/    (input validation)               │
│  └─ parsers/       (URL parsing, metadata)          │
└─────────────────────────────────────────────────────┘
```

**Rule:** Each layer only talks to adjacent layers (no skipping!)

---

## 🚫 Anti-Patterns (DON'T DO THIS)

### ❌ Fat Components with Embedded Logic

```tsx
// BAD - Everything in component
function MediaLibrary() {
  const [media, setMedia] = useState<Media[]>([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [loading, setLoading] = useState(false);

  // ❌ Business logic in component
  const filteredMedia = useMemo(() => {
    let result = media;
    
    // Search logic
    if (search) {
      result = result.filter(m => 
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.artist.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort logic
    result = result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return a.artist.localeCompare(b.artist);
      if (sortBy === 'date') return b.createdAt.getTime() - a.createdAt.getTime();
      return 0;
    });
    
    return result;
  }, [media, search, sortBy]);

  // ❌ API call in component
  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/media');
        const data = await response.json();
        setMedia(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadMedia();
  }, []);

  // ❌ Complex event handlers
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    
    setLoading(true);
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      setMedia(media.filter(m => m.id !== id));
      alert('Deleted successfully!');
    } catch (error) {
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} />
      <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
        <option value="title">Title</option>
        <option value="artist">Artist</option>
        <option value="date">Date</option>
      </select>
      
      {loading && <div>Loading...</div>}
      
      {filteredMedia.map(m => (
        <div key={m.id}>
          {m.title} - {m.artist}
          <button onClick={() => handleDelete(m.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

**Problems:**
- 🔴 Business logic mixed with UI
- 🔴 Hard to test (requires rendering)
- 🔴 Can't reuse logic elsewhere
- 🔴 Component does too much (violates SRP)
- 🔴 API calls directly in component

---

## ✅ Clean Architecture (DO THIS)

### Layer 1: Utilities (Pure Functions)

```typescript
// utils/media/filters.ts

export interface MediaFilters {
  search?: string;
  sortBy?: 'title' | 'artist' | 'date' | 'playCount';
  sortOrder?: 'asc' | 'desc';
  liked?: boolean;
}

/**
 * Filter media by search term
 * Pure function - easily testable
 */
export function filterMediaBySearch(media: Media[], search: string): Media[] {
  if (!search) return media;
  
  const term = search.toLowerCase();
  return media.filter(m =>
    m.title.toLowerCase().includes(term) ||
    m.artist.toLowerCase().includes(term) ||
    m.album?.toLowerCase().includes(term)
  );
}

/**
 * Sort media by field and order
 * Pure function - easily testable
 */
export function sortMedia(
  media: Media[],
  sortBy: MediaFilters['sortBy'],
  sortOrder: MediaFilters['sortOrder'] = 'asc'
): Media[] {
  const sorted = [...media].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.localeCompare(b.artist);
        break;
      case 'date':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'playCount':
        comparison = a.playCount - b.playCount;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

/**
 * Apply all filters to media list
 */
export function applyMediaFilters(media: Media[], filters: MediaFilters): Media[] {
  let result = media;
  
  // Apply search
  if (filters.search) {
    result = filterMediaBySearch(result, filters.search);
  }
  
  // Apply liked filter
  if (filters.liked !== undefined) {
    result = result.filter(m => m.liked === filters.liked);
  }
  
  // Apply sorting
  if (filters.sortBy) {
    result = sortMedia(result, filters.sortBy, filters.sortOrder);
  }
  
  return result;
}
```

```typescript
// utils/media/validators.ts

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[\w-]+/
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Validate media metadata
 */
export function validateMediaMetadata(data: Partial<Media>): void {
  if (!data.title || data.title.trim().length === 0) {
    throw new ValidationError('title', 'Title is required');
  }
  
  if (data.title.length > 200) {
    throw new ValidationError('title', 'Title must be less than 200 characters');
  }
  
  if (data.duration && (data.duration < 0 || data.duration > 86400)) {
    throw new ValidationError('duration', 'Invalid duration');
  }
}
```

```typescript
// utils/media/formatters.ts

/**
 * Format duration in seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
```

---

### Layer 2: API Client (Network Only)

```typescript
// api/client.ts

import axios from 'axios';
import { endpoints } from '@media-player/shared';

export const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Transform API errors to application errors
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
  }
);
```

```typescript
// api/media.ts

import { apiClient } from './client';
import { endpoints } from '@media-player/shared';
import type { Media, MediaFilters, PaginatedResponse } from '../types';

/**
 * Media API - Network calls only, no business logic
 */
export const mediaApi = {
  /**
   * Fetch all media with optional filters
   */
  async getAll(filters?: MediaFilters): Promise<Media[]> {
    const response = await apiClient.get<Media[]>(
      endpoints.media.list(),
      { params: filters }
    );
    return response.data;
  },

  /**
   * Fetch single media by ID
   */
  async getById(id: string): Promise<Media> {
    const response = await apiClient.get<Media>(
      endpoints.media.getById(id)
    );
    return response.data;
  },

  /**
   * Update media metadata
   */
  async update(id: string, data: Partial<Media>): Promise<Media> {
    const response = await apiClient.patch<Media>(
      endpoints.media.update(id),
      data
    );
    return response.data;
  },

  /**
   * Delete media
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(endpoints.media.delete(id));
  },

  /**
   * Search media
   */
  async search(query: string): Promise<Media[]> {
    const response = await apiClient.get<Media[]>(
      endpoints.media.search(),
      { params: { q: query } }
    );
    return response.data;
  },

  /**
   * Get recently played media
   */
  async getRecentlyPlayed(limit = 20): Promise<Media[]> {
    const response = await apiClient.get<Media[]>(
      endpoints.media.recentlyPlayed(limit)
    );
    return response.data;
  }
};
```

---

### Layer 3: Services (Business Logic)

```typescript
// services/mediaService.ts

import { mediaApi } from '../api/media';
import { applyMediaFilters, validateMediaMetadata } from '../utils/media';
import type { Media, MediaFilters } from '../types';

/**
 * Media Service - All business logic for media operations
 * No React, no UI, pure TypeScript
 */
export class MediaService {
  private cache = new Map<string, Media>();

  /**
   * Get all media with filters applied
   */
  async getFiltered(filters: MediaFilters): Promise<Media[]> {
    // Fetch from API
    const media = await mediaApi.getAll();
    
    // Apply client-side filters (for offline support)
    return applyMediaFilters(media, filters);
  }

  /**
   * Get media by ID with caching
   */
  async getById(id: string): Promise<Media> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }
    
    // Fetch from API
    const media = await mediaApi.getById(id);
    
    // Cache result
    this.cache.set(id, media);
    
    return media;
  }

  /**
   * Update media with validation
   */
  async update(id: string, data: Partial<Media>): Promise<Media> {
    // Validate data
    validateMediaMetadata(data);
    
    // Update via API
    const updated = await mediaApi.update(id, data);
    
    // Update cache
    this.cache.set(id, updated);
    
    return updated;
  }

  /**
   * Delete media with confirmation
   */
  async delete(id: string): Promise<void> {
    // Delete via API
    await mediaApi.delete(id);
    
    // Remove from cache
    this.cache.delete(id);
  }

  /**
   * Search with debouncing handled externally
   */
  async search(query: string): Promise<Media[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    return mediaApi.search(query.trim());
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const mediaService = new MediaService();
```

```typescript
// services/playerService.ts

import type { Media } from '../types';

/**
 * Player Service - Player behavior logic
 * Handles queue, shuffle, repeat, next/previous logic
 */
export class PlayerService {
  /**
   * Get next track based on queue, shuffle, and repeat mode
   */
  getNextTrack(
    currentMedia: Media | null,
    queue: Media[],
    repeatMode: 'off' | 'one' | 'all',
    shuffleEnabled: boolean
  ): Media | null {
    if (!currentMedia) {
      return queue[0] || null;
    }

    // Repeat one - return same track
    if (repeatMode === 'one') {
      return currentMedia;
    }

    // Find current index in queue
    const currentIndex = queue.findIndex(m => m.id === currentMedia.id);

    // Shuffle - random track
    if (shuffleEnabled && queue.length > 1) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === currentIndex);
      return queue[randomIndex];
    }

    // Normal - next in queue
    const nextIndex = currentIndex + 1;

    // If at end
    if (nextIndex >= queue.length) {
      // Repeat all - go to start
      if (repeatMode === 'all') {
        return queue[0];
      }
      // End of queue
      return null;
    }

    return queue[nextIndex];
  }

  /**
   * Get previous track
   */
  getPreviousTrack(
    currentMedia: Media | null,
    queue: Media[]
  ): Media | null {
    if (!currentMedia || queue.length === 0) {
      return null;
    }

    const currentIndex = queue.findIndex(m => m.id === currentMedia.id);
    const previousIndex = currentIndex - 1;

    // If at start, wrap to end
    if (previousIndex < 0) {
      return queue[queue.length - 1];
    }

    return queue[previousIndex];
  }

  /**
   * Shuffle queue (Fisher-Yates algorithm)
   */
  shuffleQueue(queue: Media[]): Media[] {
    const shuffled = [...queue];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Add media to queue, avoiding duplicates
   */
  addToQueue(queue: Media[], media: Media | Media[]): Media[] {
    const newQueue = [...queue];
    const toAdd = Array.isArray(media) ? media : [media];
    
    for (const m of toAdd) {
      // Skip if already in queue
      if (!newQueue.find(item => item.id === m.id)) {
        newQueue.push(m);
      }
    }
    
    return newQueue;
  }

  /**
   * Remove media from queue
   */
  removeFromQueue(queue: Media[], mediaId: string): Media[] {
    return queue.filter(m => m.id !== mediaId);
  }

  /**
   * Reorder queue (drag and drop)
   */
  reorderQueue(queue: Media[], fromIndex: number, toIndex: number): Media[] {
    const newQueue = [...queue];
    const [removed] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, removed);
    return newQueue;
  }
}

// Export singleton
export const playerService = new PlayerService();
```

---

### Layer 4: State Management (Zustand Stores)

```typescript
// stores/libraryStore.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { mediaService } from '../services/mediaService';
import type { Media, MediaFilters } from '../types';

interface LibraryState {
  // State
  media: Media[];
  isLoading: boolean;
  error: string | null;
  filters: MediaFilters;
  viewMode: 'grid' | 'list';
  selectedMedia: Set<string>;

  // Actions
  loadMedia: () => Promise<void>;
  setFilters: (filters: Partial<MediaFilters>) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  toggleMediaSelection: (id: string) => void;
  clearSelection: () => void;
  deleteSelected: () => Promise<void>;
  refreshMedia: () => Promise<void>;
}

/**
 * Library Store - Global state for media library
 * Uses mediaService for all business logic
 */
export const useLibraryStore = create<LibraryState>()(
  devtools(
    (set, get) => ({
      // Initial state
      media: [],
      isLoading: false,
      error: null,
      filters: { sortBy: 'date', sortOrder: 'desc' },
      viewMode: 'grid',
      selectedMedia: new Set(),

      // Load media with current filters
      loadMedia: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const filters = get().filters;
          // Business logic in service
          const media = await mediaService.getFiltered(filters);
          set({ media, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load media',
            isLoading: false 
          });
        }
      },

      // Update filters and reload
      setFilters: (newFilters) => {
        const filters = { ...get().filters, ...newFilters };
        set({ filters });
        get().loadMedia();
      },

      // Update view mode
      setViewMode: (viewMode) => {
        set({ viewMode });
      },

      // Toggle media selection
      toggleMediaSelection: (id) => {
        const selected = new Set(get().selectedMedia);
        if (selected.has(id)) {
          selected.delete(id);
        } else {
          selected.add(id);
        }
        set({ selectedMedia: selected });
      },

      // Clear all selections
      clearSelection: () => {
        set({ selectedMedia: new Set() });
      },

      // Delete selected media
      deleteSelected: async () => {
        const selectedIds = Array.from(get().selectedMedia);
        if (selectedIds.length === 0) return;

        set({ isLoading: true });

        try {
          // Business logic in service
          await Promise.all(
            selectedIds.map(id => mediaService.delete(id))
          );
          
          // Reload media
          await get().loadMedia();
          get().clearSelection();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete media',
            isLoading: false 
          });
        }
      },

      // Refresh media from server
      refreshMedia: async () => {
        mediaService.clearCache();
        await get().loadMedia();
      }
    }),
    { name: 'LibraryStore' }
  )
);
```

---

### Layer 5: Custom Hooks (Connect UI to Logic)

```typescript
// hooks/useMedia.ts

import { useEffect } from 'react';
import { useLibraryStore } from '../stores/libraryStore';

/**
 * Hook to access media library
 * Connects component to store, no business logic here
 */
export function useMedia() {
  const {
    media,
    isLoading,
    error,
    filters,
    viewMode,
    selectedMedia,
    loadMedia,
    setFilters,
    setViewMode,
    toggleMediaSelection,
    clearSelection,
    deleteSelected,
    refreshMedia
  } = useLibraryStore();

  // Load media on mount
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  return {
    // State
    media,
    isLoading,
    error,
    filters,
    viewMode,
    selectedMedia,
    selectedCount: selectedMedia.size,
    hasSelection: selectedMedia.size > 0,
    
    // Actions
    setFilters,
    setViewMode,
    toggleMediaSelection,
    clearSelection,
    deleteSelected,
    refreshMedia
  };
}
```

```typescript
// hooks/usePlayer.ts

import { useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { playerService } from '../services/playerService';
import type { Media } from '../types';

/**
 * Hook to control media player
 * Manages audio element and connects to store
 */
export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    repeatMode,
    shuffleEnabled,
    play,
    pause,
    seek,
    setVolume,
    setCurrentTime,
    setDuration,
    addToQueue,
    removeFromQueue,
    toggleShuffle,
    cycleRepeat
  } = usePlayerStore();

  /**
   * Play media
   */
  const playMedia = useCallback(async (media: Media) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = `/api/media/${media.id}/stream`;
    await audio.play();
    play(media);
  }, [play]);

  /**
   * Pause playback
   */
  const pausePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    pause();
  }, [pause]);

  /**
   * Seek to time
   */
  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    seek(time);
  }, [seek]);

  /**
   * Play next track (business logic in service)
   */
  const playNext = useCallback(() => {
    const nextMedia = playerService.getNextTrack(
      currentMedia,
      queue,
      repeatMode,
      shuffleEnabled
    );
    
    if (nextMedia) {
      playMedia(nextMedia);
    }
  }, [currentMedia, queue, repeatMode, shuffleEnabled, playMedia]);

  /**
   * Play previous track (business logic in service)
   */
  const playPrevious = useCallback(() => {
    const previousMedia = playerService.getPreviousTrack(currentMedia, queue);
    
    if (previousMedia) {
      playMedia(previousMedia);
    }
  }, [currentMedia, queue, playMedia]);

  /**
   * Setup audio element event listeners
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      playNext();
    };

    const handleError = (e: Event) => {
      console.error('Audio playback error:', e);
      pause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playNext, pause, setCurrentTime, setDuration]);

  /**
   * Update audio volume when store changes
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  return {
    // Ref for audio element
    audioRef,
    
    // State
    currentMedia,
    isPlaying,
    currentTime,
    duration,
    volume,
    queue,
    repeatMode,
    shuffleEnabled,
    
    // Actions
    play: playMedia,
    pause: pausePlayback,
    seek: seekTo,
    playNext,
    playPrevious,
    setVolume,
    addToQueue,
    removeFromQueue,
    toggleShuffle,
    cycleRepeat
  };
}
```

```typescript
// hooks/useDebounce.ts

import { useEffect, useState } from 'react';

/**
 * Debounce a value
 * Reusable utility hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

### Layer 6: Components (UI Only)

```tsx
// components/Library/MediaLibrary.tsx

import React from 'react';
import { useMedia } from '../../hooks/useMedia';
import { useDebounce } from '../../hooks/useDebounce';
import { MediaGrid } from './MediaGrid';
import { MediaList } from './MediaList';
import { LibraryToolbar } from './LibraryToolbar';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { ErrorMessage } from '../Common/ErrorMessage';
import styles from './MediaLibrary.module.css';

/**
 * Media Library Component - PRESENTATION ONLY
 * No business logic, just UI and event handling
 */
export const MediaLibrary: React.FC = () => {
  // ✅ Get all state and actions from hook
  const {
    media,
    isLoading,
    error,
    filters,
    viewMode,
    selectedCount,
    hasSelection,
    setFilters,
    setViewMode,
    toggleMediaSelection,
    clearSelection,
    deleteSelected,
    refreshMedia
  } = useMedia();

  // ✅ Debounce search input
  const [searchInput, setSearchInput] = React.useState(filters.search || '');
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update filters when debounced search changes
  React.useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, setFilters]);

  // ✅ Event handlers are simple - no logic
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters({ sortBy: sortBy as any });
  };

  const handleDeleteClick = async () => {
    if (!confirm(`Delete ${selectedCount} selected items?`)) return;
    await deleteSelected();
  };

  // ✅ Render logic
  if (isLoading) {
    return <LoadingSpinner message="Loading library..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={refreshMedia}
      />
    );
  }

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <LibraryToolbar
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        sortBy={filters.sortBy}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onDeleteSelected={handleDeleteClick}
      />

      {/* Content */}
      <div className={styles.content}>
        {media.length === 0 ? (
          <div className={styles.empty}>
            No media found. Try adjusting your filters.
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <MediaGrid
                media={media}
                onMediaClick={toggleMediaSelection}
              />
            ) : (
              <MediaList
                media={media}
                onMediaClick={toggleMediaSelection}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
```

```tsx
// components/Library/MediaCard.tsx

import React from 'react';
import { formatDuration } from '../../utils/media/formatters';
import type { Media } from '../../types';
import styles from './MediaCard.module.css';

interface MediaCardProps {
  media: Media;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPlay: (media: Media) => void;
}

/**
 * Media Card Component - PURE PRESENTATION
 * No hooks, no state, no logic - just props and UI
 */
export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  isSelected,
  onSelect,
  onPlay
}) => {
  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(media.id)}
    >
      {/* Thumbnail */}
      <div className={styles.thumbnail}>
        <img src={media.thumbnailUrl} alt={media.title} />
        <button
          className={styles.playButton}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(media);
          }}
        >
          ▶
        </button>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <h3 className={styles.title}>{media.title}</h3>
        <p className={styles.artist}>{media.artist}</p>
        <div className={styles.meta}>
          <span>{formatDuration(media.duration)}</span>
          {media.liked && <span className={styles.liked}>♥</span>}
        </div>
      </div>
    </div>
  );
};
```

---

## 📁 Folder Structure

```
frontend/src/
├── api/                          # API Layer (HTTP calls only)
│   ├── client.ts                 # Axios configuration
│   ├── media.ts                  # Media API
│   ├── playlist.ts               # Playlist API
│   └── download.ts               # Download API
│
├── services/                     # Business Logic Layer
│   ├── mediaService.ts           # Media operations
│   ├── playlistService.ts        # Playlist logic
│   ├── playerService.ts          # Player behavior
│   └── downloadService.ts        # Download coordination
│
├── stores/                       # State Management Layer
│   ├── playerStore.ts            # Player global state
│   ├── libraryStore.ts           # Library global state
│   └── uiStore.ts                # UI state (theme, modals)
│
├── hooks/                        # Custom Hooks Layer
│   ├── useMedia.ts               # Media hook
│   ├── usePlayer.ts              # Player hook
│   ├── usePlaylist.ts            # Playlist hook
│   ├── useDebounce.ts            # Debounce utility
│   └── useLocalStorage.ts        # LocalStorage hook
│
├── utils/                        # Pure Utilities Layer
│   ├── media/
│   │   ├── filters.ts            # Filter functions
│   │   ├── validators.ts         # Validation functions
│   │   └── formatters.ts         # Format functions
│   ├── parsers/
│   │   └── youtube.ts            # YouTube URL parsing
│   └── constants.ts              # App constants
│
├── components/                   # Presentation Layer
│   ├── Player/                   # Player feature
│   │   ├── Player.tsx            # Smart container
│   │   ├── PlayerControls.tsx   # Dumb component
│   │   └── PlayerProgress.tsx   # Dumb component
│   │
│   ├── Library/                  # Library feature
│   │   ├── MediaLibrary.tsx     # Smart container
│   │   ├── MediaGrid.tsx        # Dumb component
│   │   ├── MediaList.tsx        # Dumb component
│   │   └── MediaCard.tsx        # Dumb component
│   │
│   └── Common/                   # Shared components
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
│
├── pages/                        # Page Components
│   ├── PlayerPage.tsx
│   ├── LibraryPage.tsx
│   └── PlaylistsPage.tsx
│
└── types/                        # TypeScript types
    ├── media.ts
    ├── playlist.ts
    └── api.ts
```

---

## 🧪 Testing Benefits

### With Separated Logic

```typescript
// services/__tests__/playerService.test.ts

import { playerService } from '../playerService';
import { createMockMedia } from '../../test-utils';

describe('PlayerService', () => {
  describe('getNextTrack', () => {
    it('should return next track in queue', () => {
      const queue = [
        createMockMedia({ id: '1' }),
        createMockMedia({ id: '2' }),
        createMockMedia({ id: '3' })
      ];

      const next = playerService.getNextTrack(
        queue[0],
        queue,
        'off',
        false
      );

      expect(next?.id).toBe('2');
    });

    it('should repeat one when repeatMode is "one"', () => {
      const current = createMockMedia({ id: '1' });
      const queue = [current, createMockMedia({ id: '2' })];

      const next = playerService.getNextTrack(
        current,
        queue,
        'one',
        false
      );

      expect(next?.id).toBe('1');
    });

    it('should shuffle when shuffle is enabled', () => {
      const queue = Array.from({ length: 10 }, (_, i) =>
        createMockMedia({ id: String(i) })
      );

      const next = playerService.getNextTrack(
        queue[0],
        queue,
        'off',
        true
      );

      // Next track should be random, not index 1
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        const track = playerService.getNextTrack(
          queue[0],
          queue,
          'off',
          true
        );
        results.add(track?.id);
      }

      // Should get multiple different tracks
      expect(results.size).toBeGreaterThan(3);
    });
  });
});
```

**Benefits:**
✅ No React rendering required  
✅ Fast tests (milliseconds)  
✅ Easy to test edge cases  
✅ Clear input/output  
✅ 100% code coverage possible

---

## ✅ Checklist for Clean Components

When creating/reviewing a React component, check:

- [ ] **Component only handles UI** (JSX, styling, layout)
- [ ] **No business logic in component** (moved to service/hook)
- [ ] **No direct API calls** (uses hooks that call services)
- [ ] **No complex calculations** (uses utility functions)
- [ ] **No database queries** (uses hooks that call services)
- [ ] **Props are simple types** (strings, numbers, callbacks)
- [ ] **Event handlers are thin** (just call hook methods)
- [ ] **State is minimal** (only UI state like open/closed)
- [ ] **No useEffect for data fetching** (use custom hook instead)
- [ ] **Component is testable** (can test with React Testing Library)

---

## 📚 Quick Reference

### What Goes Where?

| What? | Where? | Example |
|-------|--------|---------|
| API calls | `api/` | `mediaApi.getAll()` |
| Business logic | `services/` | `playerService.getNextTrack()` |
| State management | `stores/` | `usePlayerStore()` |
| Connect UI to logic | `hooks/` | `useMedia()`, `usePlayer()` |
| Pure functions | `utils/` | `formatDuration()`, `validateUrl()` |
| UI rendering | `components/` | `<MediaCard />` |
| Route containers | `pages/` | `<LibraryPage />` |
| Types | `types/` | `Media`, `Playlist` |

---

## 🎓 Learning Resources

**Key Concepts:**
- **Separation of Concerns** - Each layer has one job
- **Single Responsibility** - Each function/class does one thing
- **Dependency Injection** - Pass dependencies, don't create them
- **Pure Functions** - Same input = same output (no side effects)
- **Testability** - Code should be easy to test

**Recommended Reading:**
- Clean Architecture by Robert C. Martin
- Refactoring by Martin Fowler
- React documentation on custom hooks
- Zustand documentation on state management

---

## 🚀 Migration Strategy

**If you have fat components:**

1. **Extract utilities** - Move pure functions to `utils/`
2. **Create services** - Move business logic to `services/`
3. **Create API layer** - Move API calls to `api/`
4. **Create stores** - Move global state to Zustand
5. **Create hooks** - Connect components to services/stores
6. **Simplify components** - Keep only UI logic

**Do it incrementally!** Don't refactor everything at once.

---

## ⚠️ Common Mistakes

### Mistake 1: Hooks with Business Logic

```typescript
// ❌ BAD - Business logic in hook
function useMediaFilter(media: Media[], search: string) {
  return useMemo(() => {
    // Complex filtering logic
    return media.filter(m => 
      m.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [media, search]);
}

// ✅ GOOD - Hook calls service
function useMediaFilter(media: Media[], filters: MediaFilters) {
  return useMemo(() => {
    // Service handles logic
    return mediaService.applyFilters(media, filters);
  }, [media, filters]);
}
```

### Mistake 2: Services with React Code

```typescript
// ❌ BAD - Service uses React hooks
class MediaService {
  useFilteredMedia(filters: MediaFilters) {  // Can't use hooks!
    const [media, setMedia] = useState([]);
    // ...
  }
}

// ✅ GOOD - Service is pure TypeScript
class MediaService {
  async getFiltered(filters: MediaFilters): Promise<Media[]> {
    const media = await mediaApi.getAll();
    return applyMediaFilters(media, filters);
  }
}
```

### Mistake 3: API Calls in Components

```typescript
// ❌ BAD - API call in component
function MediaLibrary() {
  useEffect(() => {
    fetch('/api/media').then(r => r.json()).then(setMedia);
  }, []);
}

// ✅ GOOD - API call in hook -> service -> API
function MediaLibrary() {
  const { media } = useMedia(); // Hook handles everything
}
```

---

## 🎯 Summary

**Golden Rules:**

1. **Components = UI only** (JSX, events, rendering)
2. **Hooks = Connect UI to logic** (bridge layer)
3. **Services = Business logic** (pure TypeScript)
4. **API = Network calls only** (HTTP requests)
5. **Utils = Pure functions** (no side effects)
6. **Stores = Global state** (Zustand for shared data)

**Remember:** If you can't easily unit test it, it's probably in the wrong place!

---

**End of Instructions**

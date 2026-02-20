import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { ENDPOINTS } from '@media-player/shared';
import { isElectron } from '../utils/electron';

// In Electron, connect to the local backend server
// In browser/Docker, use the environment variable or empty (same-origin)
const API_BASE_URL = isElectron()
  ? 'http://localhost:3000'
  : (import.meta.env.VITE_API_URL || '');

// Types
export interface Media {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  filePath: string;
  thumbnailPath: string | null;
  sourceUrl: string | null;
  sourceId: string | null;
  mimeType: string;
  fileSize: number;
  isLiked: boolean;
  playCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverPath: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithItems extends Playlist {
  items: {
    id: string;
    position: number;
    addedAt: string;
    media: Media;
  }[];
}

export interface PlayHistory {
  id: string;
  mediaId: string;
  playedAt: string;
  duration: number;
  media: Media;
}

export interface QueueItem {
  id: string;
  mediaId: string;
  position: number;
  addedAt: string;
  media: Media;
}

export interface PlaylistVideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  channel: string;
  videoCount: number;
  videos: PlaylistVideoInfo[];
}

export interface Download {
  id: string;
  url: string;
  title: string | null;
  status: 'PENDING' | 'DOWNLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  error: string | null;
  mediaId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDownloadResult {
  playlistId: string;
  playlistTitle: string;
  totalVideos: number;
  skipped: number;
  downloads: Download[];
  createdPlaylistId?: string;
}

export interface PlaylistDownloadOptions {
  videoIds?: string[];
  createPlaylist?: boolean;
  playlistName?: string;
}

export interface YouTubeSyncStatus {
  isConnected: boolean;
  authMethod: 'cookie' | null;
  email: string | null;
  lastSyncAt: string | null;
  autoSync: boolean;
  syncInterval: number;
  filterMusic: boolean;
  maxDuration: number;
}

export interface YouTubeSyncSettings {
  autoSync: boolean;
  syncInterval: number;
  filterMusic: boolean;
  maxDuration: number;
}

export interface YouTubeSyncHistory {
  id: string;
  syncedAt: string;
  videosFound: number;
  videosDownloaded: number;
  videosFailed: number;
  videosSkipped: number;
}

export interface YouTubeSyncResult {
  videosFound: number;
  videosDownloaded: number;
  videosSkipped: number;
  videosFailed: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

interface MediaSearchParams {
  query?: string;
  artist?: string;
  album?: string;
  isLiked?: boolean;
  sortBy?: 'title' | 'artist' | 'createdAt' | 'playCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.data ?? error.message);
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<{ status: string; timestamp: string }>(
      ENDPOINTS.health()
    );
    return response.data;
  }

  // Media endpoints
  media = {
    list: async (params?: MediaSearchParams): Promise<PaginatedResponse<Media>> => {
      const response = await this.client.get<PaginatedResponse<Media>>(
        ENDPOINTS.media.list(),
        { params }
      );
      return response.data;
    },

    get: async (id: string): Promise<ApiResponse<Media>> => {
      const response = await this.client.get<ApiResponse<Media>>(ENDPOINTS.media.get(id));
      return response.data;
    },

    recent: async (limit = 10): Promise<ApiResponse<Media[]>> => {
      const response = await this.client.get<ApiResponse<Media[]>>(
        `${ENDPOINTS.media.list()}/recent`,
        { params: { limit } }
      );
      return response.data;
    },

    mostPlayed: async (limit = 10): Promise<ApiResponse<Media[]>> => {
      const response = await this.client.get<ApiResponse<Media[]>>(
        `${ENDPOINTS.media.list()}/most-played`,
        { params: { limit } }
      );
      return response.data;
    },

    stats: async (): Promise<ApiResponse<{
      totalCount: number;
      totalDuration: number;
      totalSize: number;
      likedCount: number;
    }>> => {
      const response = await this.client.get(`${ENDPOINTS.media.list()}/stats`);
      return response.data as ApiResponse<{
        totalCount: number;
        totalDuration: number;
        totalSize: number;
        likedCount: number;
      }>;
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(ENDPOINTS.media.delete(id));
    },
  };

  // Likes endpoints
  likes = {
    list: async (params?: MediaSearchParams): Promise<PaginatedResponse<Media>> => {
      const response = await this.client.get<PaginatedResponse<Media>>(
        ENDPOINTS.likes.list(),
        { params }
      );
      return response.data;
    },

    toggle: async (mediaId: string): Promise<ApiResponse<Media>> => {
      const response = await this.client.post<ApiResponse<Media>>(
        ENDPOINTS.likes.toggle(mediaId)
      );
      return response.data;
    },

    count: async (): Promise<ApiResponse<{ count: number }>> => {
      const response = await this.client.get<ApiResponse<{ count: number }>>(
        `${ENDPOINTS.likes.list()}/count`
      );
      return response.data;
    },
  };

  // Playlists endpoints
  playlists = {
    list: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Playlist>> => {
      const response = await this.client.get<PaginatedResponse<Playlist>>(
        ENDPOINTS.playlists.list(),
        { params }
      );
      return response.data;
    },

    get: async (id: string): Promise<ApiResponse<PlaylistWithItems>> => {
      const response = await this.client.get<ApiResponse<PlaylistWithItems>>(
        ENDPOINTS.playlists.get(id)
      );
      return response.data;
    },

    create: async (data: { name: string; description?: string }): Promise<ApiResponse<Playlist>> => {
      const response = await this.client.post<ApiResponse<Playlist>>(
        ENDPOINTS.playlists.list(),
        data
      );
      return response.data;
    },

    update: async (id: string, data: { name?: string; description?: string }): Promise<ApiResponse<Playlist>> => {
      const response = await this.client.patch<ApiResponse<Playlist>>(
        ENDPOINTS.playlists.get(id),
        data
      );
      return response.data;
    },

    delete: async (id: string): Promise<void> => {
      await this.client.delete(ENDPOINTS.playlists.get(id));
    },

    addItem: async (playlistId: string, mediaId: string): Promise<ApiResponse<PlaylistWithItems>> => {
      const response = await this.client.post<ApiResponse<PlaylistWithItems>>(
        ENDPOINTS.playlists.items(playlistId),
        { mediaId }
      );
      return response.data;
    },

    removeItem: async (playlistId: string, mediaId: string): Promise<ApiResponse<PlaylistWithItems>> => {
      const response = await this.client.delete<ApiResponse<PlaylistWithItems>>(
        `${ENDPOINTS.playlists.items(playlistId)}/${mediaId}`
      );
      return response.data;
    },
  };

  // Queue endpoints
  queue = {
    get: async (): Promise<ApiResponse<QueueItem[]>> => {
      const response = await this.client.get<ApiResponse<QueueItem[]>>(ENDPOINTS.queue.get());
      return response.data;
    },

    add: async (mediaId: string, position?: number): Promise<ApiResponse<QueueItem[]>> => {
      const response = await this.client.post<ApiResponse<QueueItem[]>>(
        ENDPOINTS.queue.add(),
        { mediaId, position }
      );
      return response.data;
    },

    remove: async (mediaId: string): Promise<ApiResponse<QueueItem[]>> => {
      const response = await this.client.delete<ApiResponse<QueueItem[]>>(
        `${ENDPOINTS.queue.get()}/${mediaId}`
      );
      return response.data;
    },

    clear: async (): Promise<ApiResponse<QueueItem[]>> => {
      const response = await this.client.delete<ApiResponse<QueueItem[]>>(
        ENDPOINTS.queue.clear()
      );
      return response.data;
    },

    set: async (mediaIds: string[]): Promise<ApiResponse<QueueItem[]>> => {
      const response = await this.client.put<ApiResponse<QueueItem[]>>(
        ENDPOINTS.queue.get(),
        { mediaIds }
      );
      return response.data;
    },
  };

  // History endpoints
  history = {
    list: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<PlayHistory>> => {
      const response = await this.client.get<PaginatedResponse<PlayHistory>>(
        ENDPOINTS.history.list(),
        { params }
      );
      return response.data;
    },

    record: async (mediaId: string, duration: number): Promise<ApiResponse<PlayHistory>> => {
      const response = await this.client.post<ApiResponse<PlayHistory>>(
        ENDPOINTS.history.list(),
        { mediaId, duration }
      );
      return response.data;
    },

    clear: async (): Promise<void> => {
      await this.client.delete(ENDPOINTS.history.clear());
    },

    recent: async (limit = 10): Promise<ApiResponse<PlayHistory[]>> => {
      const response = await this.client.get<ApiResponse<PlayHistory[]>>(
        `${ENDPOINTS.history.list()}/recent`,
        { params: { limit } }
      );
      return response.data;
    },
  };

  // Downloads endpoints
  downloads = {
    list: async (): Promise<ApiResponse<unknown[]>> => {
      const response = await this.client.get<ApiResponse<unknown[]>>(ENDPOINTS.downloads.list());
      return response.data;
    },

    start: async (url: string): Promise<ApiResponse<unknown>> => {
      const response = await this.client.post<ApiResponse<unknown>>(
        ENDPOINTS.downloads.start(),
        { url },
        { timeout: 120000 } // 2 minutes - yt-dlp needs time to fetch video info
      );
      return response.data;
    },

    getPlaylistInfo: async (url: string): Promise<ApiResponse<PlaylistInfo>> => {
      const response = await this.client.post<ApiResponse<PlaylistInfo>>(
        ENDPOINTS.downloads.playlistInfo(),
        { url },
        { timeout: 300000 } // 5 minutes - playlists can have many videos
      );
      return response.data;
    },

    startPlaylist: async (
      url: string,
      options?: PlaylistDownloadOptions
    ): Promise<ApiResponse<PlaylistDownloadResult>> => {
      const response = await this.client.post<ApiResponse<PlaylistDownloadResult>>(
        ENDPOINTS.downloads.playlistStart(),
        { url, ...options },
        { timeout: 300000 } // 5 minutes - playlists can have many videos
      );
      return response.data;
    },
  };

  // YouTube Sync endpoints
  youtubeSync = {
    getStatus: async (): Promise<ApiResponse<YouTubeSyncStatus>> => {
      const response = await this.client.get<ApiResponse<YouTubeSyncStatus>>(
        ENDPOINTS.youtubeSync.status()
      );
      return response.data;
    },

    getSettings: async (): Promise<ApiResponse<YouTubeSyncSettings>> => {
      const response = await this.client.get<ApiResponse<YouTubeSyncSettings>>(
        ENDPOINTS.youtubeSync.settings()
      );
      return response.data;
    },

    updateSettings: async (
      settings: Partial<YouTubeSyncSettings>
    ): Promise<ApiResponse<YouTubeSyncSettings>> => {
      const response = await this.client.patch<ApiResponse<YouTubeSyncSettings>>(
        ENDPOINTS.youtubeSync.settings(),
        settings
      );
      return response.data;
    },

    getHistory: async (limit?: number): Promise<ApiResponse<YouTubeSyncHistory[]>> => {
      const response = await this.client.get<ApiResponse<YouTubeSyncHistory[]>>(
        ENDPOINTS.youtubeSync.history(),
        { params: { limit } }
      );
      return response.data;
    },

    authWithCookies: async (
      cookies: string
    ): Promise<ApiResponse<{ success: boolean; email?: string }>> => {
      const response = await this.client.post<ApiResponse<{ success: boolean; email?: string }>>(
        ENDPOINTS.youtubeSync.auth.cookie(),
        { cookies }
      );
      return response.data;
    },

    sync: async (): Promise<ApiResponse<YouTubeSyncResult>> => {
      const response = await this.client.post<ApiResponse<YouTubeSyncResult>>(
        ENDPOINTS.youtubeSync.sync(),
        {},
        { timeout: 600000 } // 10 minutes - sync can take a long time
      );
      return response.data;
    },

    disconnect: async (): Promise<ApiResponse<{ message: string }>> => {
      const response = await this.client.delete<ApiResponse<{ message: string }>>(
        ENDPOINTS.youtubeSync.disconnect()
      );
      return response.data;
    },
  };
}

export const apiClient = new ApiClient();

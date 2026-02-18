import {
  type Media,
  type Playlist,
  type PlaylistItem,
  type PlayHistory,
  type QueueItem,
  type Download,
  type DownloadStatus,
  type YouTubeSync,
  type YouTubeSyncHistory,
} from '@prisma/client';

// Re-export Prisma types
export type {
  Media,
  Playlist,
  PlaylistItem,
  PlayHistory,
  QueueItem,
  Download,
  DownloadStatus,
  YouTubeSync,
  YouTubeSyncHistory,
};

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// Media types
export interface MediaWithRelations extends Media {
  playlistItems?: PlaylistItem[];
  playHistory?: PlayHistory[];
  queueItems?: QueueItem[];
}

export interface CreateMediaInput {
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  filePath: string;
  thumbnailPath?: string;
  sourceUrl?: string;
  sourceId?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface UpdateMediaInput {
  title?: string;
  artist?: string;
  album?: string;
  thumbnailPath?: string;
}

export interface MediaSearchParams extends PaginationParams {
  query?: string;
  artist?: string;
  album?: string;
  isLiked?: boolean;
  sortBy?: 'title' | 'artist' | 'createdAt' | 'playCount';
  sortOrder?: 'asc' | 'desc';
}

// Playlist types
export interface PlaylistWithItems extends Playlist {
  items: (PlaylistItem & { media: Media })[];
}

export interface CreatePlaylistInput {
  name: string;
  description?: string;
  coverPath?: string;
}

export interface UpdatePlaylistInput {
  name?: string;
  description?: string;
  coverPath?: string;
}

// Queue types
export interface QueueItemWithMedia extends QueueItem {
  media: Media;
}

export interface AddToQueueInput {
  mediaId: string;
  position?: number;
}

// History types
export interface PlayHistoryWithMedia extends PlayHistory {
  media: Media;
}

export interface RecordPlayInput {
  mediaId: string;
  duration: number;
}

// Stream types
export interface StreamOptions {
  start?: number;
  end?: number;
}

export interface StreamResult {
  stream: NodeJS.ReadableStream;
  start: number;
  end: number;
  size: number;
  contentLength: number;
  mimeType: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginatedResult<T>['pagination'];
}

// YouTube Sync types
export type YouTubeSyncAuthMethod = 'browser' | 'cookie' | 'mount';

export interface YouTubeSyncStatus {
  isConnected: boolean;
  authMethod: YouTubeSyncAuthMethod | null;
  email: string | null;
  lastSyncAt: Date | null;
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

export interface UpdateYouTubeSyncSettingsInput {
  autoSync?: boolean;
  syncInterval?: number;
  filterMusic?: boolean;
  maxDuration?: number;
}

export interface YouTubeSyncResult {
  videosFound: number;
  videosDownloaded: number;
  videosSkipped: number;
  videosFailed: number;
}

export interface YouTubeLikedVideo {
  id: string;
  title: string;
  channel: string;
  duration: number;
  categories?: string[];
}

export interface CookieValidationResult {
  isValid: boolean;
  email?: string;
  error?: string;
}

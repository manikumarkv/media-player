import { create } from 'zustand';
import { apiClient } from '../api/client';

export type DownloadStatus = 'PENDING' | 'DOWNLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Download {
  id: string;
  url: string;
  title: string | null;
  status: DownloadStatus;
  progress: number;
  error: string | null;
  mediaId: string | null;
  createdAt: string;
  updatedAt: string;
  speed: string | null;
  eta: string | null;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
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

export interface PlaylistDownloadResult {
  playlistId: string;
  playlistTitle: string;
  totalVideos: number;
  skipped: number;
  downloads: Download[];
  createdPlaylistId?: string;
}

export type GroupBy = 'default' | 'artist' | 'album';

interface DownloadState {
  downloads: Download[];
  currentPreview: VideoInfo | null;
  currentPlaylistPreview: PlaylistInfo | null;
  isLoading: boolean;
  isLoadingPreview: boolean;
  isLoadingPlaylistPreview: boolean;
  error: string | null;

  // Playlist selection state
  selectedVideoIds: Set<string>;
  groupBy: GroupBy;
  createPlaylist: boolean;
  playlistName: string;

  // Actions
  fetchDownloads: () => Promise<void>;
  getVideoInfo: (url: string) => Promise<VideoInfo | null>;
  getPlaylistInfo: (url: string) => Promise<PlaylistInfo | null>;
  startDownload: (url: string) => Promise<Download | null>;
  startPlaylistDownload: (url: string) => Promise<PlaylistDownloadResult | null>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  clearPreview: () => void;

  // Playlist selection actions
  toggleVideoSelection: (videoId: string) => void;
  selectAllVideos: () => void;
  selectNoneVideos: () => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setCreatePlaylist: (value: boolean) => void;
  setPlaylistName: (name: string) => void;
  initializeSelectionFromPlaylist: () => void;

  // Socket event handlers
  handleDownloadStarted: (data: { downloadId: string; title: string }) => void;
  handleDownloadProgress: (data: { downloadId: string; progress: number; speed?: string; eta?: string }) => void;
  handleDownloadCompleted: (data: { downloadId: string; mediaId: string }) => void;
  handleDownloadError: (data: { downloadId: string; error: string }) => void;
  handleDownloadCancelled: (data: { downloadId: string }) => void;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  currentPreview: null,
  currentPlaylistPreview: null,
  isLoading: false,
  isLoadingPreview: false,
  isLoadingPlaylistPreview: false,
  error: null,

  // Playlist selection state
  selectedVideoIds: new Set<string>(),
  groupBy: 'default' as GroupBy,
  createPlaylist: false,
  playlistName: '',

  fetchDownloads: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.downloads.list();
      set({ downloads: response.data as Download[], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch downloads',
        isLoading: false,
      });
    }
  },

  getVideoInfo: async (url: string) => {
    set({ isLoadingPreview: true, error: null, currentPreview: null });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/downloads/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to get video info');
      }

      const data = await response.json() as { data: VideoInfo };
      set({ currentPreview: data.data, isLoadingPreview: false });
      return data.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get video info',
        isLoadingPreview: false,
      });
      return null;
    }
  },

  startDownload: async (url: string) => {
    set({ error: null });
    try {
      const response = await apiClient.downloads.start(url);
      const download = response.data as Download;
      set((state) => ({
        downloads: [download, ...state.downloads],
        currentPreview: null,
      }));
      return download;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start download',
      });
      return null;
    }
  },

  getPlaylistInfo: async (url: string) => {
    set({ isLoadingPlaylistPreview: true, error: null, currentPlaylistPreview: null });
    try {
      const response = await apiClient.downloads.getPlaylistInfo(url);
      set({ currentPlaylistPreview: response.data, isLoadingPlaylistPreview: false });
      return response.data;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to get playlist info',
        isLoadingPlaylistPreview: false,
      });
      return null;
    }
  },

  startPlaylistDownload: async (url: string) => {
    const { selectedVideoIds, createPlaylist, playlistName } = get();
    set({ error: null });
    try {
      const response = await apiClient.downloads.startPlaylist(url, {
        videoIds: selectedVideoIds.size > 0 ? Array.from(selectedVideoIds) : undefined,
        createPlaylist,
        playlistName: playlistName || undefined,
      });
      const result = response.data;
      set((state) => ({
        downloads: [...result.downloads, ...state.downloads],
        currentPlaylistPreview: null,
        // Reset selection state after successful download
        selectedVideoIds: new Set<string>(),
        createPlaylist: false,
        playlistName: '',
      }));
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start playlist download',
      });
      return null;
    }
  },

  cancelDownload: async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/downloads/${id}`, {
        method: 'DELETE',
      });
      set((state) => ({
        downloads: state.downloads.map((d) =>
          d.id === id ? { ...d, status: 'CANCELLED' as DownloadStatus } : d
        ),
      }));
    } catch (error) {
      console.error('Failed to cancel download:', error);
    }
  },

  retryDownload: async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/downloads/${id}/retry`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json() as { data: Download };
        set((state) => ({
          downloads: state.downloads.map((d) =>
            d.id === id ? data.data : d
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to retry download:', error);
    }
  },

  deleteDownload: async (id: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/downloads/${id}/delete`, {
        method: 'DELETE',
      });
      set((state) => ({
        downloads: state.downloads.filter((d) => d.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete download:', error);
    }
  },

  clearPreview: () => {
    set({
      currentPreview: null,
      currentPlaylistPreview: null,
      error: null,
      selectedVideoIds: new Set<string>(),
      groupBy: 'default',
      createPlaylist: false,
      playlistName: '',
    });
  },

  // Playlist selection actions
  toggleVideoSelection: (videoId: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedVideoIds);
      if (newSelected.has(videoId)) {
        newSelected.delete(videoId);
      } else {
        newSelected.add(videoId);
      }
      return { selectedVideoIds: newSelected };
    });
  },

  selectAllVideos: () => {
    const { currentPlaylistPreview } = get();
    if (!currentPlaylistPreview) {
      return;
    }

    const allVideoIds = new Set(currentPlaylistPreview.videos.map((v) => v.id));
    set({ selectedVideoIds: allVideoIds });
  },

  selectNoneVideos: () => {
    set({ selectedVideoIds: new Set<string>() });
  },

  setGroupBy: (groupBy: GroupBy) => {
    set({ groupBy });
  },

  setCreatePlaylist: (value: boolean) => {
    set({ createPlaylist: value });
  },

  setPlaylistName: (name: string) => {
    set({ playlistName: name });
  },

  initializeSelectionFromPlaylist: () => {
    const { currentPlaylistPreview } = get();
    if (!currentPlaylistPreview) {
      return;
    }

    const allVideoIds = new Set(currentPlaylistPreview.videos.map((v) => v.id));
    set({
      selectedVideoIds: allVideoIds,
      playlistName: currentPlaylistPreview.title,
    });
  },

  // Socket event handlers
  handleDownloadStarted: (data) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === data.downloadId
          ? { ...d, title: data.title, status: 'DOWNLOADING' as DownloadStatus }
          : d
      ),
    }));
  },

  handleDownloadProgress: (data) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === data.downloadId
          ? { ...d, progress: data.progress, speed: data.speed ?? null, eta: data.eta ?? null }
          : d
      ),
    }));
  },

  handleDownloadCompleted: (data) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === data.downloadId
          ? { ...d, status: 'COMPLETED' as DownloadStatus, progress: 100, mediaId: data.mediaId }
          : d
      ),
    }));
  },

  handleDownloadError: (data) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === data.downloadId
          ? { ...d, status: 'FAILED' as DownloadStatus, error: data.error }
          : d
      ),
    }));
  },

  handleDownloadCancelled: (data) => {
    set((state) => ({
      downloads: state.downloads.map((d) =>
        d.id === data.downloadId
          ? { ...d, status: 'CANCELLED' as DownloadStatus }
          : d
      ),
    }));
  },
}));

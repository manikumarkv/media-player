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
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channel: string;
}

interface DownloadState {
  downloads: Download[];
  currentPreview: VideoInfo | null;
  isLoading: boolean;
  isLoadingPreview: boolean;
  error: string | null;

  // Actions
  fetchDownloads: () => Promise<void>;
  getVideoInfo: (url: string) => Promise<VideoInfo | null>;
  startDownload: (url: string) => Promise<Download | null>;
  cancelDownload: (id: string) => Promise<void>;
  retryDownload: (id: string) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  clearPreview: () => void;

  // Socket event handlers
  handleDownloadStarted: (data: { downloadId: string; title: string }) => void;
  handleDownloadProgress: (data: { downloadId: string; progress: number }) => void;
  handleDownloadCompleted: (data: { downloadId: string; mediaId: string }) => void;
  handleDownloadError: (data: { downloadId: string; error: string }) => void;
  handleDownloadCancelled: (data: { downloadId: string }) => void;
}

export const useDownloadStore = create<DownloadState>((set) => ({
  downloads: [],
  currentPreview: null,
  isLoading: false,
  isLoadingPreview: false,
  error: null,

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
    set({ currentPreview: null, error: null });
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
          ? { ...d, progress: data.progress }
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

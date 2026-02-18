import { create } from 'zustand';
import {
  apiClient,
  type YouTubeSyncStatus,
  type YouTubeSyncSettings,
  type YouTubeSyncHistory,
  type YouTubeSyncResult,
} from '../api/client';

export interface YouTubeSyncState {
  // Data
  status: YouTubeSyncStatus | null;
  settings: YouTubeSyncSettings | null;
  history: YouTubeSyncHistory[];

  // Loading states
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchHistory: (limit?: number) => Promise<void>;
  updateSettings: (settings: Partial<YouTubeSyncSettings>) => Promise<void>;
  authWithCookies: (cookies: string) => Promise<boolean>;
  sync: () => Promise<YouTubeSyncResult | null>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export const useYoutubeSyncStore = create<YouTubeSyncState>((set, get) => ({
  // Initial state
  status: null,
  settings: null,
  history: [],
  isLoading: false,
  isSyncing: false,
  error: null,

  // Fetch current sync status
  fetchStatus: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.youtubeSync.getStatus();
      set({ status: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch status';
      set({ error: message, isLoading: false });
    }
  },

  // Fetch sync settings
  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.youtubeSync.getSettings();
      set({ settings: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch settings';
      set({ error: message, isLoading: false });
    }
  },

  // Fetch sync history
  fetchHistory: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.youtubeSync.getHistory(limit);
      set({ history: response.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch history';
      set({ error: message, isLoading: false });
    }
  },

  // Update sync settings
  updateSettings: async (settings) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.youtubeSync.updateSettings(settings);
      set({ settings: response.data, isLoading: false });

      // Also update status if it exists
      const currentStatus = get().status;
      if (currentStatus) {
        set({
          status: {
            ...currentStatus,
            ...response.data,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      set({ error: message, isLoading: false });
    }
  },

  // Authenticate with uploaded cookies
  authWithCookies: async (cookies) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.youtubeSync.authWithCookies(cookies);
      // Refresh status after auth
      await get().fetchStatus();
      return true;
    } catch (error: unknown) {
      // Extract error message from axios error response
      let message = 'Failed to authenticate';
      if (error && typeof error === 'object') {
        const axiosError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
        if (axiosError.response?.data?.error?.message) {
          message = axiosError.response.data.error.message;
        } else if (axiosError.message) {
          message = axiosError.message;
        }
      }
      set({ error: message, isLoading: false });
      return false;
    }
  },

  // Trigger manual sync
  sync: async () => {
    set({ isSyncing: true, error: null });
    try {
      const response = await apiClient.youtubeSync.sync();
      set({ isSyncing: false });
      // Refresh status and history after sync
      void get().fetchStatus();
      void get().fetchHistory();
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      set({ error: message, isSyncing: false });
      return null;
    }
  },

  // Disconnect YouTube account
  disconnect: async () => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.youtubeSync.disconnect();
      // Reset status to disconnected
      set({
        status: {
          isConnected: false,
          authMethod: null,
          email: null,
          lastSyncAt: null,
          autoSync: true,
          syncInterval: 60,
          filterMusic: true,
          maxDuration: 600,
        },
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect';
      set({ error: message, isLoading: false });
    }
  },

  // Clear error
  clearError: () => { set({ error: null }); },
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useYoutubeSyncStore } from './youtubeSyncStore';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    youtubeSync: {
      getStatus: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      getHistory: vi.fn(),
      authWithCookies: vi.fn(),
      verifyMount: vi.fn(),
      sync: vi.fn(),
      disconnect: vi.fn(),
    },
  },
}));

import { apiClient } from '../api/client';

describe('youtubeSyncStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useYoutubeSyncStore.setState({
      status: null,
      settings: null,
      history: [],
      isLoading: false,
      isSyncing: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useYoutubeSyncStore.getState();
      expect(state.status).toBeNull();
      expect(state.settings).toBeNull();
      expect(state.history).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.isSyncing).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchStatus', () => {
    it('should fetch and update status', async () => {
      const mockStatus = {
        isConnected: true,
        authMethod: 'cookie' as const,
        email: 'test@gmail.com',
        lastSyncAt: '2024-01-01T00:00:00Z',
        autoSync: true,
        syncInterval: 60,
        filterMusic: true,
        maxDuration: 600,
      };

      vi.mocked(apiClient.youtubeSync.getStatus).mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      await useYoutubeSyncStore.getState().fetchStatus();

      const state = useYoutubeSyncStore.getState();
      expect(state.status).toEqual(mockStatus);
      expect(state.isLoading).toBe(false);
      expect(apiClient.youtubeSync.getStatus).toHaveBeenCalled();
    });

    it('should set error on fetch failure', async () => {
      vi.mocked(apiClient.youtubeSync.getStatus).mockRejectedValue(
        new Error('Network error')
      );

      await useYoutubeSyncStore.getState().fetchStatus();

      const state = useYoutubeSyncStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const mockSettings = {
        autoSync: false,
        syncInterval: 120,
        filterMusic: true,
        maxDuration: 600,
      };

      vi.mocked(apiClient.youtubeSync.updateSettings).mockResolvedValue({
        success: true,
        data: mockSettings,
      });

      await useYoutubeSyncStore.getState().updateSettings({ autoSync: false });

      const state = useYoutubeSyncStore.getState();
      expect(state.settings).toEqual(mockSettings);
      expect(apiClient.youtubeSync.updateSettings).toHaveBeenCalledWith({
        autoSync: false,
      });
    });
  });

  describe('authWithCookies', () => {
    it('should authenticate and refresh status', async () => {
      vi.mocked(apiClient.youtubeSync.authWithCookies).mockResolvedValue({
        success: true,
        data: { success: true },
      });
      vi.mocked(apiClient.youtubeSync.getStatus).mockResolvedValue({
        success: true,
        data: {
          isConnected: true,
          authMethod: 'cookie' as const,
          email: null,
          lastSyncAt: null,
          autoSync: true,
          syncInterval: 60,
          filterMusic: true,
          maxDuration: 600,
        },
      });

      const result = await useYoutubeSyncStore
        .getState()
        .authWithCookies('cookie-content');

      expect(result).toBe(true);
      expect(apiClient.youtubeSync.authWithCookies).toHaveBeenCalledWith(
        'cookie-content'
      );
      expect(apiClient.youtubeSync.getStatus).toHaveBeenCalled();
    });

    it('should return false on auth failure', async () => {
      vi.mocked(apiClient.youtubeSync.authWithCookies).mockRejectedValue(
        new Error('Invalid cookies')
      );

      const result = await useYoutubeSyncStore
        .getState()
        .authWithCookies('invalid-cookies');

      expect(result).toBe(false);
      const state = useYoutubeSyncStore.getState();
      expect(state.error).toBe('Invalid cookies');
    });
  });

  describe('sync', () => {
    it('should trigger sync and update state', async () => {
      const mockResult = {
        videosFound: 10,
        videosDownloaded: 5,
        videosSkipped: 4,
        videosFailed: 1,
      };

      vi.mocked(apiClient.youtubeSync.sync).mockResolvedValue({
        success: true,
        data: mockResult,
      });

      const result = await useYoutubeSyncStore.getState().sync();

      expect(result).toEqual(mockResult);
      expect(useYoutubeSyncStore.getState().isSyncing).toBe(false);
    });

    it('should set isSyncing during sync', async () => {
      vi.mocked(apiClient.youtubeSync.sync).mockImplementation(
        () =>
          new Promise((resolve) => {
            // Check state while syncing
            expect(useYoutubeSyncStore.getState().isSyncing).toBe(true);
            resolve({
              success: true,
              data: {
                videosFound: 0,
                videosDownloaded: 0,
                videosSkipped: 0,
                videosFailed: 0,
              },
            });
          })
      );

      await useYoutubeSyncStore.getState().sync();
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear status', async () => {
      // Set initial connected state
      useYoutubeSyncStore.setState({
        status: {
          isConnected: true,
          authMethod: 'cookie',
          email: 'test@gmail.com',
          lastSyncAt: null,
          autoSync: true,
          syncInterval: 60,
          filterMusic: true,
          maxDuration: 600,
        },
      });

      vi.mocked(apiClient.youtubeSync.disconnect).mockResolvedValue({
        success: true,
        data: { message: 'Disconnected' },
      });

      await useYoutubeSyncStore.getState().disconnect();

      const state = useYoutubeSyncStore.getState();
      expect(state.status?.isConnected).toBe(false);
    });
  });
});

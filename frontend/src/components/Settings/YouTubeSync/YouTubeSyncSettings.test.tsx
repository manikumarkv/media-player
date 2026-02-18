import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { YouTubeSyncSettings } from './YouTubeSyncSettings';
import { useYoutubeSyncStore } from '../../../stores/youtubeSyncStore';

// Mock the store
vi.mock('../../../stores/youtubeSyncStore', () => ({
  useYoutubeSyncStore: vi.fn(),
}));

describe('YouTubeSyncSettings', () => {
  const mockFetchStatus = vi.fn();
  const mockFetchHistory = vi.fn();
  const mockAuthWithCookies = vi.fn();
  const mockSync = vi.fn();
  const mockDisconnect = vi.fn();
  const mockUpdateSettings = vi.fn();
  const mockClearError = vi.fn();

  const defaultMockState = {
    status: null,
    settings: null,
    history: [],
    isLoading: false,
    isSyncing: false,
    error: null,
    fetchStatus: mockFetchStatus,
    fetchSettings: vi.fn(),
    fetchHistory: mockFetchHistory,
    updateSettings: mockUpdateSettings,
    authWithCookies: mockAuthWithCookies,
    sync: mockSync,
    disconnect: mockDisconnect,
    clearError: mockClearError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useYoutubeSyncStore).mockReturnValue(defaultMockState);
  });

  describe('disconnected state', () => {
    it('should render auth method selector when disconnected', () => {
      render(<YouTubeSyncSettings />);

      expect(
        screen.getByText(/connect your youtube account/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/upload cookies/i)).toBeInTheDocument();
    });

    it('should fetch status on mount', () => {
      render(<YouTubeSyncSettings />);
      expect(mockFetchStatus).toHaveBeenCalled();
    });
  });

  describe('connected state', () => {
    beforeEach(() => {
      vi.mocked(useYoutubeSyncStore).mockReturnValue({
        ...defaultMockState,
        status: {
          isConnected: true,
          authMethod: 'cookie',
          email: 'test@gmail.com',
          lastSyncAt: '2024-01-01T00:00:00Z',
          autoSync: true,
          syncInterval: 60,
          filterMusic: true,
          maxDuration: 600,
        },
      });
    });

    it('should show connection status when connected', () => {
      render(<YouTubeSyncSettings />);

      expect(screen.getByText(/connected/i)).toBeInTheDocument();
      expect(screen.getByText(/test@gmail.com/i)).toBeInTheDocument();
    });

    it('should show sync button when connected', () => {
      render(<YouTubeSyncSettings />);

      expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument();
    });

    it('should show disconnect button when connected', () => {
      render(<YouTubeSyncSettings />);

      expect(screen.getByRole('button', { name: /disconnect/i })).toBeInTheDocument();
    });

    it('should trigger sync when sync button clicked', async () => {
      mockSync.mockResolvedValue({
        videosFound: 10,
        videosDownloaded: 5,
        videosSkipped: 4,
        videosFailed: 1,
      });

      render(<YouTubeSyncSettings />);

      fireEvent.click(screen.getByRole('button', { name: /sync now/i }));

      await waitFor(() => {
        expect(mockSync).toHaveBeenCalled();
      });
    });

    it('should trigger disconnect when disconnect button clicked', async () => {
      render(<YouTubeSyncSettings />);

      fireEvent.click(screen.getByRole('button', { name: /disconnect/i }));

      await waitFor(() => {
        expect(mockDisconnect).toHaveBeenCalled();
      });
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      vi.mocked(useYoutubeSyncStore).mockReturnValue({
        ...defaultMockState,
        isLoading: true,
      });

      render(<YouTubeSyncSettings />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('syncing state', () => {
    it('should show syncing indicator when syncing', () => {
      vi.mocked(useYoutubeSyncStore).mockReturnValue({
        ...defaultMockState,
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
        isSyncing: true,
      });

      render(<YouTubeSyncSettings />);

      expect(screen.getByText(/syncing/i)).toBeInTheDocument();
    });

    it('should disable sync button while syncing', () => {
      vi.mocked(useYoutubeSyncStore).mockReturnValue({
        ...defaultMockState,
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
        isSyncing: true,
      });

      render(<YouTubeSyncSettings />);

      expect(screen.getByRole('button', { name: /syncing/i })).toBeDisabled();
    });
  });

  describe('error state', () => {
    it('should display error message when error exists', () => {
      vi.mocked(useYoutubeSyncStore).mockReturnValue({
        ...defaultMockState,
        error: 'Failed to connect',
      });

      render(<YouTubeSyncSettings />);

      expect(screen.getByText(/failed to connect/i)).toBeInTheDocument();
    });
  });

  describe('cookie upload', () => {
    it('should show cookie upload form when cookie option selected', async () => {
      render(<YouTubeSyncSettings />);

      fireEvent.click(screen.getByText(/upload cookies/i));

      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });
});

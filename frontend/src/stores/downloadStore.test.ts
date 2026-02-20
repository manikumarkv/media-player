import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { useDownloadStore, type Download, type VideoInfo, type PlaylistVideoInfo } from './downloadStore';
import { apiClient } from '../api/client';

// Mock apiClient
vi.mock('../api/client', () => ({
  apiClient: {
    downloads: {
      list: vi.fn(),
      start: vi.fn(),
      getPlaylistInfo: vi.fn(),
      startPlaylist: vi.fn(),
    },
  },
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDownload: Download = {
  id: 'download-1',
  url: 'https://youtube.com/watch?v=test123',
  title: 'Test Video',
  status: 'DOWNLOADING',
  progress: 50,
  error: null,
  mediaId: null,
  createdAt: '2026-02-17T00:00:00Z',
  updatedAt: '2026-02-17T00:00:00Z',
};

const mockCompletedDownload: Download = {
  ...mockDownload,
  id: 'download-2',
  status: 'COMPLETED',
  progress: 100,
  mediaId: 'media-123',
};

const mockFailedDownload: Download = {
  ...mockDownload,
  id: 'download-3',
  status: 'FAILED',
  progress: 0,
  error: 'Network error',
};

const mockVideoInfo: VideoInfo = {
  id: 'video-123',
  title: 'Test Video Title',
  duration: 240,
  thumbnail: 'https://example.com/thumb.jpg',
  channel: 'Test Channel',
};

const mockPlaylistVideos: PlaylistVideoInfo[] = [
  { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
  { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
  { id: 'vid3', title: 'Video 3', duration: 300, thumbnail: 'thumb3.jpg' },
];

describe('downloadStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useDownloadStore.setState({
      downloads: [],
      currentPreview: null,
      currentPlaylistPreview: null,
      isLoading: false,
      isLoadingPreview: false,
      isLoadingPlaylistPreview: false,
      error: null,
      // Selection state
      selectedVideoIds: new Set<string>(),
      groupBy: 'default',
      createPlaylist: false,
      playlistName: '',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('has correct initial values', () => {
      const state = useDownloadStore.getState();

      expect(state.downloads).toEqual([]);
      expect(state.currentPreview).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isLoadingPreview).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchDownloads', () => {
    it('sets loading state while fetching', async () => {
      vi.mocked(apiClient.downloads.list).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({ success: true, data: [] });
            }, 100)
          )
      );

      const promise = useDownloadStore.getState().fetchDownloads();
      expect(useDownloadStore.getState().isLoading).toBe(true);

      await promise;
      expect(useDownloadStore.getState().isLoading).toBe(false);
    });

    it('fetches downloads successfully', async () => {
      vi.mocked(apiClient.downloads.list).mockResolvedValue({
        success: true,
        data: [mockDownload, mockCompletedDownload],
      });

      await act(async () => {
        await useDownloadStore.getState().fetchDownloads();
      });

      const state = useDownloadStore.getState();
      expect(state.downloads).toHaveLength(2);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles fetch error', async () => {
      vi.mocked(apiClient.downloads.list).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await useDownloadStore.getState().fetchDownloads();
      });

      const state = useDownloadStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('getVideoInfo', () => {
    it('sets loading preview state while fetching', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ data: mockVideoInfo }),
              });
            }, 100)
          )
      );

      const promise = useDownloadStore.getState().getVideoInfo('https://youtube.com/watch?v=test');

      expect(useDownloadStore.getState().isLoadingPreview).toBe(true);
      expect(useDownloadStore.getState().currentPreview).toBeNull();

      await promise;
      expect(useDownloadStore.getState().isLoadingPreview).toBe(false);
    });

    it('fetches video info successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockVideoInfo }),
      });

      await act(async () => {
        const result = await useDownloadStore
          .getState()
          .getVideoInfo('https://youtube.com/watch?v=test');
        expect(result).toEqual(mockVideoInfo);
      });

      const state = useDownloadStore.getState();
      expect(state.currentPreview).toEqual(mockVideoInfo);
      expect(state.isLoadingPreview).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles video info fetch error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await act(async () => {
        const result = await useDownloadStore
          .getState()
          .getVideoInfo('https://youtube.com/watch?v=test');
        expect(result).toBeNull();
      });

      const state = useDownloadStore.getState();
      expect(state.error).toBe('Failed to get video info');
      expect(state.isLoadingPreview).toBe(false);
      expect(state.currentPreview).toBeNull();
    });
  });

  describe('startDownload', () => {
    it('starts download and adds to list', async () => {
      vi.mocked(apiClient.downloads.start).mockResolvedValue({
        success: true,
        data: mockDownload,
      });

      // Set up initial preview
      useDownloadStore.setState({ currentPreview: mockVideoInfo });

      await act(async () => {
        const result = await useDownloadStore
          .getState()
          .startDownload('https://youtube.com/watch?v=test');
        expect(result).toEqual(mockDownload);
      });

      const state = useDownloadStore.getState();
      expect(state.downloads).toContain(mockDownload);
      expect(state.currentPreview).toBeNull(); // Cleared after start
      expect(state.error).toBeNull();
    });

    it('prepends new download to list', async () => {
      useDownloadStore.setState({ downloads: [mockCompletedDownload] });

      vi.mocked(apiClient.downloads.start).mockResolvedValue({
        success: true,
        data: mockDownload,
      });

      await act(async () => {
        await useDownloadStore.getState().startDownload('https://youtube.com/watch?v=test');
      });

      const state = useDownloadStore.getState();
      expect(state.downloads[0]).toEqual(mockDownload);
      expect(state.downloads[1]).toEqual(mockCompletedDownload);
    });

    it('handles start download error', async () => {
      vi.mocked(apiClient.downloads.start).mockRejectedValue(new Error('Server error'));

      await act(async () => {
        const result = await useDownloadStore
          .getState()
          .startDownload('https://youtube.com/watch?v=test');
        expect(result).toBeNull();
      });

      const state = useDownloadStore.getState();
      expect(state.error).toBe('Server error');
    });
  });

  describe('cancelDownload', () => {
    it('updates download status to CANCELLED', async () => {
      useDownloadStore.setState({ downloads: [mockDownload] });
      mockFetch.mockResolvedValue({ ok: true });

      await act(async () => {
        await useDownloadStore.getState().cancelDownload(mockDownload.id);
      });

      const state = useDownloadStore.getState();
      expect(state.downloads[0].status).toBe('CANCELLED');
    });

    it('calls correct API endpoint', async () => {
      useDownloadStore.setState({ downloads: [mockDownload] });
      mockFetch.mockResolvedValue({ ok: true });

      await act(async () => {
        await useDownloadStore.getState().cancelDownload(mockDownload.id);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/downloads/${mockDownload.id}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('retryDownload', () => {
    it('updates download with retry response', async () => {
      const retriedDownload: Download = {
        ...mockFailedDownload,
        status: 'PENDING',
        progress: 0,
        error: null,
      };

      useDownloadStore.setState({ downloads: [mockFailedDownload] });
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: retriedDownload }),
      });

      await act(async () => {
        await useDownloadStore.getState().retryDownload(mockFailedDownload.id);
      });

      const state = useDownloadStore.getState();
      expect(state.downloads[0].status).toBe('PENDING');
    });
  });

  describe('deleteDownload', () => {
    it('removes download from list', async () => {
      useDownloadStore.setState({
        downloads: [mockDownload, mockCompletedDownload],
      });
      mockFetch.mockResolvedValue({ ok: true });

      await act(async () => {
        await useDownloadStore.getState().deleteDownload(mockDownload.id);
      });

      const state = useDownloadStore.getState();
      expect(state.downloads).toHaveLength(1);
      expect(state.downloads[0]).toEqual(mockCompletedDownload);
    });
  });

  describe('clearPreview', () => {
    it('clears preview and error', () => {
      useDownloadStore.setState({
        currentPreview: mockVideoInfo,
        error: 'Some error',
      });

      act(() => {
        useDownloadStore.getState().clearPreview();
      });

      const state = useDownloadStore.getState();
      expect(state.currentPreview).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('socket handlers', () => {
    describe('handleDownloadStarted', () => {
      it('updates download status and title', () => {
        const pendingDownload: Download = {
          ...mockDownload,
          status: 'PENDING',
          title: null,
        };
        useDownloadStore.setState({ downloads: [pendingDownload] });

        act(() => {
          useDownloadStore.getState().handleDownloadStarted({
            downloadId: pendingDownload.id,
            title: 'New Title',
          });
        });

        const state = useDownloadStore.getState();
        expect(state.downloads[0].status).toBe('DOWNLOADING');
        expect(state.downloads[0].title).toBe('New Title');
      });
    });

    describe('handleDownloadProgress', () => {
      it('updates download progress', () => {
        useDownloadStore.setState({ downloads: [mockDownload] });

        act(() => {
          useDownloadStore.getState().handleDownloadProgress({
            downloadId: mockDownload.id,
            progress: 75,
          });
        });

        const state = useDownloadStore.getState();
        expect(state.downloads[0].progress).toBe(75);
      });
    });

    describe('handleDownloadCompleted', () => {
      it('updates download to completed status', () => {
        useDownloadStore.setState({ downloads: [mockDownload] });

        act(() => {
          useDownloadStore.getState().handleDownloadCompleted({
            downloadId: mockDownload.id,
            mediaId: 'new-media-id',
          });
        });

        const state = useDownloadStore.getState();
        expect(state.downloads[0].status).toBe('COMPLETED');
        expect(state.downloads[0].progress).toBe(100);
        expect(state.downloads[0].mediaId).toBe('new-media-id');
      });
    });

    describe('handleDownloadError', () => {
      it('updates download to failed status with error', () => {
        useDownloadStore.setState({ downloads: [mockDownload] });

        act(() => {
          useDownloadStore.getState().handleDownloadError({
            downloadId: mockDownload.id,
            error: 'Download failed',
          });
        });

        const state = useDownloadStore.getState();
        expect(state.downloads[0].status).toBe('FAILED');
        expect(state.downloads[0].error).toBe('Download failed');
      });
    });

    describe('handleDownloadCancelled', () => {
      it('updates download to cancelled status', () => {
        useDownloadStore.setState({ downloads: [mockDownload] });

        act(() => {
          useDownloadStore.getState().handleDownloadCancelled({
            downloadId: mockDownload.id,
          });
        });

        const state = useDownloadStore.getState();
        expect(state.downloads[0].status).toBe('CANCELLED');
      });
    });
  });

  describe('playlist selection', () => {
    describe('toggleVideoSelection', () => {
      it('adds video to selection when not selected', () => {
        act(() => {
          useDownloadStore.getState().toggleVideoSelection('vid1');
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.has('vid1')).toBe(true);
      });

      it('removes video from selection when already selected', () => {
        useDownloadStore.setState({
          selectedVideoIds: new Set(['vid1', 'vid2']),
        });

        act(() => {
          useDownloadStore.getState().toggleVideoSelection('vid1');
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.has('vid1')).toBe(false);
        expect(state.selectedVideoIds.has('vid2')).toBe(true);
      });
    });

    describe('selectAllVideos', () => {
      it('selects all videos from current playlist preview', () => {
        useDownloadStore.setState({
          currentPlaylistPreview: {
            id: 'playlist1',
            title: 'Test Playlist',
            channel: 'Test Channel',
            videoCount: 3,
            videos: mockPlaylistVideos,
          },
        });

        act(() => {
          useDownloadStore.getState().selectAllVideos();
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.size).toBe(3);
        expect(state.selectedVideoIds.has('vid1')).toBe(true);
        expect(state.selectedVideoIds.has('vid2')).toBe(true);
        expect(state.selectedVideoIds.has('vid3')).toBe(true);
      });

      it('does nothing when no playlist preview', () => {
        act(() => {
          useDownloadStore.getState().selectAllVideos();
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.size).toBe(0);
      });
    });

    describe('selectNoneVideos', () => {
      it('clears all video selections', () => {
        useDownloadStore.setState({
          selectedVideoIds: new Set(['vid1', 'vid2', 'vid3']),
        });

        act(() => {
          useDownloadStore.getState().selectNoneVideos();
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.size).toBe(0);
      });
    });

    describe('setGroupBy', () => {
      it('sets groupBy to artist', () => {
        act(() => {
          useDownloadStore.getState().setGroupBy('artist');
        });

        const state = useDownloadStore.getState();
        expect(state.groupBy).toBe('artist');
      });

      it('sets groupBy to album', () => {
        act(() => {
          useDownloadStore.getState().setGroupBy('album');
        });

        const state = useDownloadStore.getState();
        expect(state.groupBy).toBe('album');
      });

      it('sets groupBy to default', () => {
        useDownloadStore.setState({ groupBy: 'artist' });

        act(() => {
          useDownloadStore.getState().setGroupBy('default');
        });

        const state = useDownloadStore.getState();
        expect(state.groupBy).toBe('default');
      });
    });

    describe('setCreatePlaylist', () => {
      it('sets createPlaylist to true', () => {
        act(() => {
          useDownloadStore.getState().setCreatePlaylist(true);
        });

        const state = useDownloadStore.getState();
        expect(state.createPlaylist).toBe(true);
      });

      it('sets createPlaylist to false', () => {
        useDownloadStore.setState({ createPlaylist: true });

        act(() => {
          useDownloadStore.getState().setCreatePlaylist(false);
        });

        const state = useDownloadStore.getState();
        expect(state.createPlaylist).toBe(false);
      });
    });

    describe('setPlaylistName', () => {
      it('sets custom playlist name', () => {
        act(() => {
          useDownloadStore.getState().setPlaylistName('My Custom Playlist');
        });

        const state = useDownloadStore.getState();
        expect(state.playlistName).toBe('My Custom Playlist');
      });
    });

    describe('initializeSelectionFromPlaylist', () => {
      it('selects all videos when playlist preview is set', () => {
        useDownloadStore.setState({
          currentPlaylistPreview: {
            id: 'playlist1',
            title: 'Test Playlist',
            channel: 'Test Channel',
            videoCount: 3,
            videos: mockPlaylistVideos,
          },
        });

        act(() => {
          useDownloadStore.getState().initializeSelectionFromPlaylist();
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.size).toBe(3);
        expect(state.playlistName).toBe('Test Playlist');
      });
    });

    describe('startPlaylistDownload with selection', () => {
      it('passes selected video IDs to API', async () => {
        vi.mocked(apiClient.downloads.startPlaylist).mockResolvedValue({
          success: true,
          data: {
            playlistId: 'playlist1',
            playlistTitle: 'Test Playlist',
            totalVideos: 3,
            skipped: 0,
            downloads: [mockDownload],
          },
        });

        useDownloadStore.setState({
          selectedVideoIds: new Set(['vid1', 'vid3']),
          createPlaylist: true,
          playlistName: 'My Playlist',
        });

        await act(async () => {
          await useDownloadStore.getState().startPlaylistDownload(
            'https://youtube.com/playlist?list=PLxyz123'
          );
        });

        expect(apiClient.downloads.startPlaylist).toHaveBeenCalledWith(
          'https://youtube.com/playlist?list=PLxyz123',
          {
            videoIds: expect.arrayContaining(['vid1', 'vid3']),
            createPlaylist: true,
            playlistName: 'My Playlist',
          }
        );
      });

      it('resets selection state after successful download', async () => {
        vi.mocked(apiClient.downloads.startPlaylist).mockResolvedValue({
          success: true,
          data: {
            playlistId: 'playlist1',
            playlistTitle: 'Test Playlist',
            totalVideos: 3,
            skipped: 0,
            downloads: [mockDownload],
          },
        });

        useDownloadStore.setState({
          selectedVideoIds: new Set(['vid1', 'vid2']),
          createPlaylist: true,
          playlistName: 'Custom Name',
        });

        await act(async () => {
          await useDownloadStore.getState().startPlaylistDownload(
            'https://youtube.com/playlist?list=PLxyz123'
          );
        });

        const state = useDownloadStore.getState();
        expect(state.selectedVideoIds.size).toBe(0);
        expect(state.createPlaylist).toBe(false);
        expect(state.playlistName).toBe('');
        expect(state.currentPlaylistPreview).toBeNull();
      });
    });
  });
});

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadPage } from './DownloadPage';
import { useDownloadStore, type Download, type VideoInfo, type PlaylistInfo } from '../stores/downloadStore';

// Mock useSocket to prevent actual socket connections
vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(() => ({ isConnected: () => true })),
}));

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
  title: 'Completed Video',
  status: 'COMPLETED',
  progress: 100,
  mediaId: 'media-123',
};

const mockFailedDownload: Download = {
  ...mockDownload,
  id: 'download-3',
  title: 'Failed Video',
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

const mockPlaylistInfo: PlaylistInfo = {
  id: 'playlist-123',
  title: 'Test Playlist Title',
  channel: 'Test Channel',
  videoCount: 3,
  videos: [
    { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
    { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
    { id: 'vid3', title: 'Video 3', duration: 300, thumbnail: 'thumb3.jpg' },
  ],
};

describe('DownloadPage', () => {
  const mockFetchDownloads = vi.fn();
  const mockGetVideoInfo = vi.fn();
  const mockGetPlaylistInfo = vi.fn();
  const mockStartDownload = vi.fn();
  const mockStartPlaylistDownload = vi.fn();
  const mockCancelDownload = vi.fn();
  const mockRetryDownload = vi.fn();
  const mockDeleteDownload = vi.fn();
  const mockClearPreview = vi.fn();
  const mockToggleVideoSelection = vi.fn();
  const mockSelectAllVideos = vi.fn();
  const mockSelectNoneVideos = vi.fn();
  const mockSetGroupBy = vi.fn();
  const mockSetCreatePlaylist = vi.fn();
  const mockSetPlaylistName = vi.fn();
  const mockInitializeSelectionFromPlaylist = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useDownloadStore.setState({
      downloads: [],
      currentPreview: null,
      currentPlaylistPreview: null,
      isLoading: false,
      isLoadingPreview: false,
      isLoadingPlaylistPreview: false,
      error: null,
      selectedVideoIds: new Set<string>(),
      groupBy: 'default',
      createPlaylist: false,
      playlistName: '',
      fetchDownloads: mockFetchDownloads,
      getVideoInfo: mockGetVideoInfo,
      getPlaylistInfo: mockGetPlaylistInfo,
      startDownload: mockStartDownload,
      startPlaylistDownload: mockStartPlaylistDownload,
      cancelDownload: mockCancelDownload,
      retryDownload: mockRetryDownload,
      deleteDownload: mockDeleteDownload,
      clearPreview: mockClearPreview,
      toggleVideoSelection: mockToggleVideoSelection,
      selectAllVideos: mockSelectAllVideos,
      selectNoneVideos: mockSelectNoneVideos,
      setGroupBy: mockSetGroupBy,
      setCreatePlaylist: mockSetCreatePlaylist,
      setPlaylistName: mockSetPlaylistName,
      initializeSelectionFromPlaylist: mockInitializeSelectionFromPlaylist,
      handleDownloadStarted: vi.fn(),
      handleDownloadProgress: vi.fn(),
      handleDownloadCompleted: vi.fn(),
      handleDownloadError: vi.fn(),
      handleDownloadCancelled: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders correctly with empty state', () => {
      render(<DownloadPage />);

      expect(screen.getByRole('heading', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByText('Download music from YouTube')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Paste YouTube URL here...')).toBeInTheDocument();
      expect(
        screen.getByText('No downloads yet. Paste a YouTube URL above to get started.')
      ).toBeInTheDocument();
    });

    it('renders loading state', () => {
      useDownloadStore.setState({ isLoading: true });
      const { container } = render(<DownloadPage />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('calls fetchDownloads on mount', () => {
      render(<DownloadPage />);

      expect(mockFetchDownloads).toHaveBeenCalled();
    });
  });

  describe('URL validation', () => {
    it('validates correct YouTube URL', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      expect(mockGetVideoInfo).toHaveBeenCalled();
    });

    it('validates YouTube short URL', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'https://youtu.be/dQw4w9WgXcQ');

      expect(mockGetVideoInfo).toHaveBeenCalled();
    });

    it('shows error for invalid URL', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'https://invalid-url.com');

      expect(screen.getByText('Please enter a valid YouTube URL or playlist')).toBeInTheDocument();
      expect(mockGetVideoInfo).not.toHaveBeenCalled();
    });

    it('clears preview on invalid URL', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'not-a-url');

      expect(mockClearPreview).toHaveBeenCalled();
    });
  });

  describe('video preview', () => {
    it('shows loading state when fetching preview', () => {
      // Set loading state before render
      useDownloadStore.setState({ isLoadingPreview: true });
      render(<DownloadPage />);

      expect(screen.getByText('Loading video info...')).toBeInTheDocument();
    });

    it('displays video preview when available', () => {
      useDownloadStore.setState({ currentPreview: mockVideoInfo });
      render(<DownloadPage />);

      expect(screen.getByText('Test Video Title')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('4:00')).toBeInTheDocument(); // 240 seconds = 4:00
      expect(screen.getByAltText('Test Video Title')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls startDownload on form submit with valid URL', async () => {
      const user = userEvent.setup();
      mockStartDownload.mockResolvedValue(mockDownload);

      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'https://www.youtube.com/watch?v=test123');

      const submitButton = screen.getByRole('button', { name: /download/i });
      await user.click(submitButton);

      expect(mockStartDownload).toHaveBeenCalledWith('https://www.youtube.com/watch?v=test123');
    });

    it('clears input after successful submission', async () => {
      const user = userEvent.setup();
      mockStartDownload.mockResolvedValue(mockDownload);

      render(<DownloadPage />);

      const input = screen.getByPlaceholderText<HTMLInputElement>('Paste YouTube URL here...');
      await user.type(input, 'https://www.youtube.com/watch?v=test123');

      const submitButton = screen.getByRole('button', { name: /download/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('disables submit button for invalid URL', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'invalid-url');

      const submitButton = screen.getByRole('button', { name: /download/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button while loading preview', () => {
      useDownloadStore.setState({ isLoadingPreview: true });
      render(<DownloadPage />);

      const submitButton = screen.getByRole('button', { name: /download/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('download sections', () => {
    it('renders active downloads section', () => {
      useDownloadStore.setState({
        downloads: [mockDownload],
      });
      render(<DownloadPage />);

      expect(screen.getByText('Active Downloads')).toBeInTheDocument();
      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('Downloading 50%')).toBeInTheDocument();
    });

    it('renders completed downloads section', () => {
      useDownloadStore.setState({
        downloads: [mockCompletedDownload],
      });
      render(<DownloadPage />);

      // "Completed" appears as both heading and status
      expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
      expect(screen.getByText('Completed Video')).toBeInTheDocument();
    });

    it('renders failed downloads section', () => {
      useDownloadStore.setState({
        downloads: [mockFailedDownload],
      });
      render(<DownloadPage />);

      // "Failed" appears as both heading and status
      expect(screen.getByRole('heading', { name: 'Failed' })).toBeInTheDocument();
      expect(screen.getByText('Failed Video')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('filters downloads correctly into sections', () => {
      useDownloadStore.setState({
        downloads: [mockDownload, mockCompletedDownload, mockFailedDownload],
      });
      render(<DownloadPage />);

      expect(screen.getByText('Active Downloads')).toBeInTheDocument();
      // "Completed" appears both as section header and status text
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
      // "Failed" appears both as section header and status text
      expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('download item actions', () => {
    it('calls cancelDownload when cancel button is clicked', async () => {
      const user = userEvent.setup();
      useDownloadStore.setState({
        downloads: [mockDownload],
      });
      render(<DownloadPage />);

      const cancelButton = screen.getByRole('button', { name: /cancel download/i });
      await user.click(cancelButton);

      expect(mockCancelDownload).toHaveBeenCalledWith(mockDownload.id);
    });

    it('calls retryDownload when retry button is clicked', async () => {
      const user = userEvent.setup();
      useDownloadStore.setState({
        downloads: [mockFailedDownload],
      });
      render(<DownloadPage />);

      const retryButton = screen.getByRole('button', { name: /retry download/i });
      await user.click(retryButton);

      expect(mockRetryDownload).toHaveBeenCalledWith(mockFailedDownload.id);
    });

    it('calls deleteDownload when delete button is clicked on completed', async () => {
      const user = userEvent.setup();
      useDownloadStore.setState({
        downloads: [mockCompletedDownload],
      });
      render(<DownloadPage />);

      const deleteButton = screen.getByRole('button', { name: /delete download/i });
      await user.click(deleteButton);

      expect(mockDeleteDownload).toHaveBeenCalledWith(mockCompletedDownload.id);
    });
  });

  describe('clear URL button', () => {
    it('shows clear button when URL is entered', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText('Paste YouTube URL here...');
      await user.type(input, 'some text');

      expect(screen.getByRole('button', { name: /clear url/i })).toBeInTheDocument();
    });

    it('clears URL when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText<HTMLInputElement>('Paste YouTube URL here...');
      await user.type(input, 'https://youtube.com/test');

      const clearButton = screen.getByRole('button', { name: /clear url/i });
      await user.click(clearButton);

      expect(input.value).toBe('');
      expect(mockClearPreview).toHaveBeenCalled();
    });
  });

  describe('error display', () => {
    it('displays error message', () => {
      useDownloadStore.setState({ error: 'Something went wrong' });
      render(<DownloadPage />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('playlist selection', () => {
    beforeEach(() => {
      useDownloadStore.setState({
        currentPlaylistPreview: mockPlaylistInfo,
        selectedVideoIds: new Set(['vid1', 'vid2', 'vid3']),
      });
    });

    it('displays playlist preview with checkboxes', () => {
      render(<DownloadPage />);

      expect(screen.getByText('Test Playlist Title')).toBeInTheDocument();
      expect(screen.getByText('Video 1')).toBeInTheDocument();
      expect(screen.getByText('Video 2')).toBeInTheDocument();
      expect(screen.getByText('Video 3')).toBeInTheDocument();
    });

    it('displays Select All and Select None buttons', () => {
      render(<DownloadPage />);

      expect(screen.getByRole('button', { name: /select all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select none/i })).toBeInTheDocument();
    });

    it('calls selectAllVideos when Select All is clicked', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      await user.click(screen.getByRole('button', { name: /select all/i }));

      expect(mockSelectAllVideos).toHaveBeenCalled();
    });

    it('calls selectNoneVideos when Select None is clicked', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      await user.click(screen.getByRole('button', { name: /select none/i }));

      expect(mockSelectNoneVideos).toHaveBeenCalled();
    });

    it('calls toggleVideoSelection when video checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select video/i });
      await user.click(checkboxes[0]);

      expect(mockToggleVideoSelection).toHaveBeenCalledWith('vid1');
    });

    it('displays download button with selected count', () => {
      useDownloadStore.setState({
        currentPlaylistPreview: mockPlaylistInfo,
        selectedVideoIds: new Set(['vid1', 'vid2']),
      });
      render(<DownloadPage />);

      expect(screen.getByRole('button', { name: /download.*2.*3/i })).toBeInTheDocument();
    });

    it('disables download button when no videos selected', () => {
      useDownloadStore.setState({
        currentPlaylistPreview: mockPlaylistInfo,
        selectedVideoIds: new Set(),
      });
      render(<DownloadPage />);

      const downloadButton = screen.getByRole('button', { name: /download playlist/i });
      expect(downloadButton).toBeDisabled();
    });

    it('displays create playlist checkbox', () => {
      render(<DownloadPage />);

      expect(screen.getByRole('checkbox', { name: /create playlist/i })).toBeInTheDocument();
    });

    it('calls setCreatePlaylist when create playlist checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      await user.click(screen.getByRole('checkbox', { name: /create playlist/i }));

      expect(mockSetCreatePlaylist).toHaveBeenCalledWith(true);
    });

    it('displays playlist name input when create playlist is checked', () => {
      useDownloadStore.setState({
        currentPlaylistPreview: mockPlaylistInfo,
        selectedVideoIds: new Set(['vid1']),
        createPlaylist: true,
        playlistName: 'Test Playlist Title',
      });
      render(<DownloadPage />);

      expect(screen.getByDisplayValue('Test Playlist Title')).toBeInTheDocument();
    });

    it('calls setPlaylistName when playlist name is changed', async () => {
      const user = userEvent.setup();
      useDownloadStore.setState({
        currentPlaylistPreview: mockPlaylistInfo,
        selectedVideoIds: new Set(['vid1']),
        createPlaylist: true,
        playlistName: '',
      });
      render(<DownloadPage />);

      const input = screen.getByPlaceholderText(/playlist name/i);
      await user.type(input, 'My Custom Playlist');

      expect(mockSetPlaylistName).toHaveBeenCalled();
    });

    it('displays grouping dropdown', () => {
      render(<DownloadPage />);

      expect(screen.getByRole('combobox', { name: /group by/i })).toBeInTheDocument();
    });

    it('calls setGroupBy when grouping option is changed', async () => {
      const user = userEvent.setup();
      render(<DownloadPage />);

      const dropdown = screen.getByRole('combobox', { name: /group by/i });
      await user.selectOptions(dropdown, 'artist');

      expect(mockSetGroupBy).toHaveBeenCalledWith('artist');
    });
  });
});

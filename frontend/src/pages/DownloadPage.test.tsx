/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DownloadPage } from './DownloadPage';
import { useDownloadStore, type Download, type VideoInfo } from '../stores/downloadStore';

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

describe('DownloadPage', () => {
  const mockFetchDownloads = vi.fn();
  const mockGetVideoInfo = vi.fn();
  const mockStartDownload = vi.fn();
  const mockCancelDownload = vi.fn();
  const mockRetryDownload = vi.fn();
  const mockDeleteDownload = vi.fn();
  const mockClearPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store
    useDownloadStore.setState({
      downloads: [],
      currentPreview: null,
      isLoading: false,
      isLoadingPreview: false,
      error: null,
      fetchDownloads: mockFetchDownloads,
      getVideoInfo: mockGetVideoInfo,
      startDownload: mockStartDownload,
      cancelDownload: mockCancelDownload,
      retryDownload: mockRetryDownload,
      deleteDownload: mockDeleteDownload,
      clearPreview: mockClearPreview,
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

      expect(screen.getByText('Please enter a valid YouTube URL')).toBeInTheDocument();
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
});

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AlbumsPage } from './AlbumsPage';
import { apiClient, type Album } from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    media: {
      albums: vi.fn(),
    },
  },
}));

const mockAlbums: Album[] = [
  {
    name: 'Album One',
    artist: 'Artist A',
    trackCount: 10,
    totalDuration: 2400,
    coverMediaId: 'media-1',
  },
  {
    name: 'Album Two',
    artist: 'Artist B',
    trackCount: 8,
    totalDuration: 1800,
    coverMediaId: null,
  },
];

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('AlbumsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders page title correctly', () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      expect(screen.getByRole('heading', { name: 'Albums' })).toBeInTheDocument();
    });

    it('renders loading state', () => {
      vi.mocked(apiClient.media.albums).mockImplementation(
        () => new Promise(() => { /* pending promise */ })
      );

      const { container } = renderWithRouter(<AlbumsPage />);

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('calls albums API on mount', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(apiClient.media.albums).toHaveBeenCalled();
      });
    });
  });

  describe('album display', () => {
    it('displays albums when loaded', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(screen.getByText('Album One')).toBeInTheDocument();
        expect(screen.getByText('Album Two')).toBeInTheDocument();
      });
    });

    it('displays artist name for each album', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(screen.getByText('Artist A')).toBeInTheDocument();
        expect(screen.getByText('Artist B')).toBeInTheDocument();
      });
    });

    it('displays track count for each album', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(screen.getByText('10 tracks')).toBeInTheDocument();
        expect(screen.getByText('8 tracks')).toBeInTheDocument();
      });
    });

    it('renders album cards as links', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: mockAlbums,
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.some((link) => link.getAttribute('href')?.includes('/albums/'))).toBe(true);
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when no albums exist', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(screen.getByText('No albums yet')).toBeInTheDocument();
      });
    });

    it('shows description in empty state', async () => {
      vi.mocked(apiClient.media.albums).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Albums will appear here when you download music with album metadata')
        ).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('handles API error gracefully', async () => {
      vi.mocked(apiClient.media.albums).mockRejectedValue(new Error('Network error'));

      renderWithRouter(<AlbumsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Album One')).not.toBeInTheDocument();
      });
    });
  });
});

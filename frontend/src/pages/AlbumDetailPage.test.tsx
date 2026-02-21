/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AlbumDetailPage } from './AlbumDetailPage';
import { apiClient, type Media } from '../api/client';
import { usePlayerStore } from '../stores/playerStore';

vi.mock('../api/client', () => ({
  apiClient: {
    media: {
      albumTracks: vi.fn(),
    },
  },
}));

const mockTracks: Media[] = [
  {
    id: '1',
    title: 'Track One',
    artist: 'Artist A',
    album: 'Test Album',
    duration: 180,
    filePath: '/media/track1.opus',
    thumbnailPath: '/thumb/1.jpg',
    sourceUrl: null,
    sourceId: null,
    mimeType: 'audio/opus',
    fileSize: 5000000,
    isLiked: false,
    playCount: 5,
    createdAt: '2026-02-17T00:00:00Z',
    updatedAt: '2026-02-17T00:00:00Z',
  },
  {
    id: '2',
    title: 'Track Two',
    artist: 'Artist A',
    album: 'Test Album',
    duration: 240,
    filePath: '/media/track2.opus',
    thumbnailPath: '/thumb/2.jpg',
    sourceUrl: null,
    sourceId: null,
    mimeType: 'audio/opus',
    fileSize: 6000000,
    isLiked: true,
    playCount: 10,
    createdAt: '2026-02-17T00:00:00Z',
    updatedAt: '2026-02-17T00:00:00Z',
  },
];

function renderWithRouter(albumName: string) {
  return render(
    <MemoryRouter initialEntries={[`/albums/${encodeURIComponent(albumName)}`]}>
      <Routes>
        <Route path="/albums/:albumName" element={<AlbumDetailPage />} />
        <Route path="/albums" element={<div>Albums Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AlbumDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePlayerStore.setState({
      queue: [],
      currentTrack: null,
      isPlaying: false,
    });
  });

  describe('rendering', () => {
    it('renders album name as title', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Test Album' })).toBeInTheDocument();
      });
    });

    it('renders loading state', () => {
      vi.mocked(apiClient.media.albumTracks).mockImplementation(
        () => new Promise(() => { /* pending promise */ })
      );

      const { container } = renderWithRouter('Test Album');

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('calls albumTracks API on mount with correct album name', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(apiClient.media.albumTracks).toHaveBeenCalledWith('Test Album');
      });
    });

    it('decodes URL-encoded album names', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      render(
        <MemoryRouter initialEntries={['/albums/Test%20Album%20%26%20More']}>
          <Routes>
            <Route path="/albums/:albumName" element={<AlbumDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.media.albumTracks).toHaveBeenCalledWith('Test Album & More');
      });
    });
  });

  describe('track display', () => {
    it('displays tracks when loaded', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByText('Track One')).toBeInTheDocument();
        expect(screen.getByText('Track Two')).toBeInTheDocument();
      });
    });

    it('displays track count and total duration', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByText(/2 songs/)).toBeInTheDocument();
        expect(screen.getByText(/7 min/)).toBeInTheDocument();
      });
    });

    it('displays artist name in header', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        const artistElement = document.querySelector('.album-artist');
        expect(artistElement).toHaveTextContent('Artist A');
      });
    });
  });

  describe('play all functionality', () => {
    it('renders Play All button', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Play all' })).toBeInTheDocument();
      });
    });

    it('sets queue and plays when Play All is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByText('Track One')).toBeInTheDocument();
      });

      const playButton = screen.getByRole('button', { name: 'Play all' });
      await user.click(playButton);

      const state = usePlayerStore.getState();
      expect(state.queue).toHaveLength(2);
      expect(state.currentTrack?.id).toBe('1');
    });

    it('disables Play All button when no tracks', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        const playButton = screen.getByRole('button', { name: 'Play all' });
        expect(playButton).toBeDisabled();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty state when album has no tracks', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: [],
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByText('This album is empty')).toBeInTheDocument();
      });
    });
  });

  describe('navigation', () => {
    it('shows back button', async () => {
      vi.mocked(apiClient.media.albumTracks).mockResolvedValue({
        success: true,
        data: mockTracks,
      });

      renderWithRouter('Test Album');

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument();
      });
    });
  });
});

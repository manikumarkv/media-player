import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaRow } from './MediaRow';
import type { Media } from '../../api/client';

// Mock the stores
vi.mock('../../stores/playerStore', () => ({
  usePlayerStore: vi.fn(() => ({
    currentTrack: null,
    isPlaying: false,
    setCurrentTrack: vi.fn(),
    play: vi.fn(),
    addToQueue: vi.fn(),
  })),
}));

vi.mock('../../stores/libraryStore', () => ({
  useLibraryStore: vi.fn(() => ({
    toggleLike: vi.fn(),
  })),
}));

vi.mock('../../stores/playlistStore', () => ({
  usePlaylistStore: vi.fn(() => ({
    openAddToPlaylistModal: vi.fn(),
  })),
}));

// Mock the utils
vi.mock('../../utils/electron', () => ({
  getMediaUrl: vi.fn((url: string) => url),
}));

describe('MediaRow', () => {
  const baseMedia: Media = {
    id: 'media-1',
    title: 'Test Song',
    artist: 'Test Artist',
    album: 'Test Album',
    duration: 180,
    filePath: '/path/to/song.mp3',
    thumbnailPath: '/path/to/thumb.jpg',
    sourceUrl: 'https://youtube.com/watch?v=abc',
    sourceId: 'abc',
    mimeType: 'audio/mpeg',
    fileSize: 1000000,
    isLiked: false,
    playCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render title and artist', () => {
    render(<MediaRow media={baseMedia} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should render album', () => {
    render(<MediaRow media={baseMedia} />);

    expect(screen.getByText('Test Album')).toBeInTheDocument();
  });

  it('should render duration formatted as mm:ss', () => {
    render(<MediaRow media={baseMedia} />);

    // 180 seconds = 3:00
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  it('should show "Unknown Artist" when artist is null', () => {
    const mediaWithoutArtist = { ...baseMedia, artist: null };
    render(<MediaRow media={mediaWithoutArtist} />);

    expect(screen.getByText('Unknown Artist')).toBeInTheDocument();
  });

  it('should show play count when playCount is greater than 0', () => {
    const mediaWithPlays = { ...baseMedia, playCount: 42 };
    render(<MediaRow media={mediaWithPlays} />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('should show 0 for play count when playCount is 0', () => {
    render(<MediaRow media={baseMedia} />);

    // In list view, we show the count even if 0
    expect(screen.getByTestId('play-count')).toHaveTextContent('0');
  });

  it('should render index when provided', () => {
    render(<MediaRow media={baseMedia} index={4} />);

    // Index is 0-based, displayed as index + 1
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should have like button', () => {
    render(<MediaRow media={baseMedia} />);

    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
  });
});

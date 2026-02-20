import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MediaCard } from './MediaCard';
import type { Media } from '../../api/client';

// Mock the stores
vi.mock('../../stores/playerStore', () => ({
  usePlayerStore: vi.fn(() => ({
    setCurrentTrack: vi.fn(),
    play: vi.fn(),
    addToQueue: vi.fn(),
    currentTrack: null,
    pause: vi.fn(),
  })),
}));

vi.mock('../../stores/libraryStore', () => ({
  useLibraryStore: vi.fn(() => ({
    toggleLike: vi.fn(),
    deleteMedia: vi.fn(),
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

describe('MediaCard', () => {
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
    render(<MediaCard media={baseMedia} />);

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('should show "Unknown Artist" when artist is null', () => {
    const mediaWithoutArtist = { ...baseMedia, artist: null };
    render(<MediaCard media={mediaWithoutArtist} />);

    expect(screen.getByText('Unknown Artist')).toBeInTheDocument();
  });

  it('should not show play count when playCount is 0', () => {
    render(<MediaCard media={baseMedia} />);

    expect(screen.queryByText('0 plays')).not.toBeInTheDocument();
    expect(screen.queryByTestId('play-count')).not.toBeInTheDocument();
  });

  it('should show play count when playCount is greater than 0', () => {
    const mediaWithPlays = { ...baseMedia, playCount: 15 };
    render(<MediaCard media={mediaWithPlays} />);

    expect(screen.getByText('15 plays')).toBeInTheDocument();
  });

  it('should show singular "play" for playCount of 1', () => {
    const mediaWithOnePlay = { ...baseMedia, playCount: 1 };
    render(<MediaCard media={mediaWithOnePlay} />);

    expect(screen.getByText('1 play')).toBeInTheDocument();
  });

  it('should not show artist when showArtist is false', () => {
    render(<MediaCard media={baseMedia} showArtist={false} />);

    expect(screen.queryByText('Test Artist')).not.toBeInTheDocument();
  });

  it('should have accessible buttons for actions', () => {
    render(<MediaCard media={baseMedia} />);

    // Check that play button has proper aria-label
    expect(screen.getByRole('button', { name: /play test song/i })).toBeInTheDocument();
    // Check like button exists
    expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
  });
});

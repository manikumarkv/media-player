import { usePlayerStore, type Track } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { ENDPOINTS } from '@media-player/shared';
import { type Media } from '../../api/client';
import './Library.css';

interface MediaRowProps {
  media: Media;
  index?: number;
}

export function MediaRow({ media, index }: MediaRowProps) {
  const { currentTrack, isPlaying, setCurrentTrack, play, addToQueue } = usePlayerStore();
  const { toggleLike } = useLibraryStore();

  const isCurrentTrack = currentTrack?.id === media.id;
  const thumbnailUrl = media.thumbnailPath
    ? ENDPOINTS.media.thumbnail(media.id)
    : null;

  const handlePlay = () => {
    const track: Track = {
      id: media.id,
      title: media.title,
      artist: media.artist ?? undefined,
      album: media.album ?? undefined,
      duration: media.duration,
      filePath: media.filePath,
      thumbnailPath: media.thumbnailPath ?? undefined,
    };
    setCurrentTrack(track);
    play();
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const track: Track = {
      id: media.id,
      title: media.title,
      artist: media.artist ?? undefined,
      album: media.album ?? undefined,
      duration: media.duration,
      filePath: media.filePath,
      thumbnailPath: media.thumbnailPath ?? undefined,
    };
    addToQueue(track);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleLike(media.id);
  };

  return (
    <div
      className={`media-row ${isCurrentTrack ? 'playing' : ''}`}
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handlePlay();
        }
      }}
    >
      <div className="media-row-index">
        {isCurrentTrack && isPlaying ? (
          <div className="playing-indicator">
            <span /><span /><span />
          </div>
        ) : (
          <span className="index-number">{index !== undefined ? index + 1 : ''}</span>
        )}
        <button className="play-icon" aria-label={`Play ${media.title}`}>
          <PlayIcon />
        </button>
      </div>

      <div className="media-row-thumbnail">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="thumbnail-placeholder small">
            <MusicNoteIcon />
          </div>
        )}
      </div>

      <div className="media-row-info">
        <span className={`media-row-title ${isCurrentTrack ? 'active' : ''}`}>
          {media.title}
        </span>
        <span className="media-row-artist">
          {media.artist ?? 'Unknown Artist'}
        </span>
      </div>

      <div className="media-row-album">
        {media.album ?? ''}
      </div>

      <div className="media-row-actions">
        <button
          className={`action-button like-button ${media.isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          aria-label={media.isLiked ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={media.isLiked} />
        </button>
      </div>

      <div className="media-row-duration">
        {formatDuration(media.duration)}
      </div>

      <button
        className="action-button add-queue-button"
        onClick={handleAddToQueue}
        aria-label="Add to queue"
      >
        <MoreIcon />
      </button>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

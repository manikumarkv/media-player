import { usePlayerStore, type Track } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { ENDPOINTS } from '@media-player/shared';
import { type Media } from '../../api/client';
import './Library.css';

interface MediaCardProps {
  media: Media;
  showArtist?: boolean;
}

export function MediaCard({ media, showArtist = true }: MediaCardProps) {
  const { setCurrentTrack, play, addToQueue } = usePlayerStore();
  const { toggleLike } = useLibraryStore();

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
    <article
      className="media-card"
      onClick={handlePlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handlePlay();
        }
      }}
    >
      <div className="media-card-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="media-card-placeholder">
            <MusicNoteIcon />
          </div>
        )}
        <div className="media-card-overlay">
          <button
            className="play-button"
            onClick={handlePlay}
            aria-label={`Play ${media.title}`}
          >
            <PlayIcon />
          </button>
        </div>
      </div>
      <div className="media-card-info">
        <h3 className="media-card-title" title={media.title}>
          {media.title}
        </h3>
        {showArtist && (
          <p className="media-card-artist" title={media.artist ?? 'Unknown Artist'}>
            {media.artist ?? 'Unknown Artist'}
          </p>
        )}
      </div>
      <div className="media-card-actions">
        <button
          className={`action-button like-button ${media.isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          aria-label={media.isLiked ? 'Unlike' : 'Like'}
        >
          <HeartIcon filled={media.isLiked} />
        </button>
        <button
          className="action-button"
          onClick={handleAddToQueue}
          aria-label="Add to queue"
        >
          <AddToQueueIcon />
        </button>
      </div>
    </article>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
    </svg>
  );
}

function AddToQueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

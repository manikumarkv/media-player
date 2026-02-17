import { usePlayerStore, type Track } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlaylistStore } from '../../stores/playlistStore';
import { ENDPOINTS } from '@media-player/shared';
import type { Media } from '../../api/client';
import { PlayIcon, MusicNoteIcon, HeartIcon, QueueIcon, PlaylistAddIcon } from '../Icons';
import './Library.css';

interface MediaCardProps {
  media: Media;
  showArtist?: boolean;
}

export function MediaCard({ media, showArtist = true }: MediaCardProps) {
  const { setCurrentTrack, play, addToQueue } = usePlayerStore();
  const { toggleLike } = useLibraryStore();
  const { openAddToPlaylistModal } = usePlaylistStore();

  const thumbnailUrl = media.thumbnailPath ? ENDPOINTS.media.thumbnail(media.id) : null;

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

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAddToPlaylistModal(media.id);
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
            <MusicNoteIcon size={48} />
          </div>
        )}
        <div className="media-card-overlay">
          <button className="play-button" onClick={handlePlay} aria-label={`Play ${media.title}`}>
            <PlayIcon size={24} />
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
          <HeartIcon size={18} fill={media.isLiked ? 'currentColor' : 'none'} />
        </button>
        <button
          className="action-button"
          onClick={handleAddToPlaylist}
          aria-label="Add to playlist"
        >
          <PlaylistAddIcon size={18} />
        </button>
        <button className="action-button" onClick={handleAddToQueue} aria-label="Add to queue">
          <QueueIcon size={18} />
        </button>
      </div>
    </article>
  );
}

import { useState, useRef, useEffect } from 'react';
import { usePlayerStore, type Track } from '../../stores/playerStore';
import { useLibraryStore } from '../../stores/libraryStore';
import { usePlaylistStore } from '../../stores/playlistStore';
import { ENDPOINTS } from '@media-player/shared';
import type { Media } from '../../api/client';
import {
  PlayIcon,
  MusicNoteIcon,
  HeartIcon,
  MoreIcon,
  QueueIcon,
  PlaylistAddIcon,
  RemoveIcon,
} from '../Icons';
import './Library.css';

interface MediaRowProps {
  media: Media;
  index?: number;
  onRemove?: (mediaId: string) => void;
}

export function MediaRow({ media, index, onRemove }: MediaRowProps) {
  const { currentTrack, isPlaying, setCurrentTrack, play, addToQueue } = usePlayerStore();
  const { toggleLike } = useLibraryStore();
  const { openAddToPlaylistModal } = usePlaylistStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isCurrentTrack = currentTrack?.id === media.id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
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

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    openAddToPlaylistModal(media.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onRemove?.(media.id);
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
            <span />
            <span />
            <span />
          </div>
        ) : (
          <span className="index-number">{index !== undefined ? index + 1 : ''}</span>
        )}
        <button className="play-icon" aria-label={`Play ${media.title}`}>
          <PlayIcon size={16} />
        </button>
      </div>

      <div className="media-row-thumbnail">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className="thumbnail-placeholder small">
            <MusicNoteIcon size={16} />
          </div>
        )}
      </div>

      <div className="media-row-info">
        <span className={`media-row-title ${isCurrentTrack ? 'active' : ''}`}>{media.title}</span>
        <span className="media-row-artist">{media.artist ?? 'Unknown Artist'}</span>
      </div>

      <div className="media-row-album">{media.album ?? ''}</div>

      <div className="media-row-actions">
        <button
          className={`action-button like-button ${media.isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          aria-label={media.isLiked ? 'Unlike' : 'Like'}
        >
          <HeartIcon size={16} fill={media.isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="media-row-duration">{formatDuration(media.duration)}</div>

      <div className="media-row-menu" ref={menuRef}>
        <button
          className="action-button menu-button"
          onClick={handleMenuToggle}
          aria-label="More options"
        >
          <MoreIcon size={16} />
        </button>
        {showMenu && (
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={handleAddToQueue}>
              <QueueIcon size={16} />
              <span>Add to Queue</span>
            </button>
            <button className="dropdown-item" onClick={handleAddToPlaylist}>
              <PlaylistAddIcon size={16} />
              <span>Add to Playlist</span>
            </button>
            {onRemove && (
              <button className="dropdown-item remove-item" onClick={handleRemove}>
                <RemoveIcon size={16} />
                <span>Remove from Playlist</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString()}:${secs.toString().padStart(2, '0')}`;
}

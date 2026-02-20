import { usePlayerStore } from '../../stores/playerStore';
import { ENDPOINTS } from '@media-player/shared';
import { getMediaUrl } from '../../utils/electron';
import { MusicNoteIcon } from '../Icons';
import './Player.css';

export function NowPlaying() {
  const { currentTrack } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="now-playing empty">
        <div className="thumbnail-placeholder">
          <MusicNoteIcon size={24} />
        </div>
        <div className="track-info">
          <span className="track-title">No track selected</span>
          <span className="track-artist">Select a track to play</span>
        </div>
      </div>
    );
  }

  const thumbnailUrl = currentTrack.thumbnailPath
    ? getMediaUrl(ENDPOINTS.media.thumbnail(currentTrack.id))
    : null;

  return (
    <div className="now-playing">
      <div className="thumbnail">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${currentTrack.title} thumbnail`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement?.classList.add('no-image');
            }}
          />
        ) : (
          <div className="thumbnail-placeholder">
            <MusicNoteIcon size={24} />
          </div>
        )}
      </div>
      <div className="track-info">
        <span className="track-title" title={currentTrack.title}>
          {currentTrack.title}
        </span>
        <span className="track-artist" title={currentTrack.artist ?? 'Unknown Artist'}>
          {currentTrack.artist ?? 'Unknown Artist'}
        </span>
      </div>
    </div>
  );
}

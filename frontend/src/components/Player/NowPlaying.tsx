import { usePlayerStore } from '../../stores/playerStore';
import { ENDPOINTS } from '@media-player/shared';
import './Player.css';

export function NowPlaying() {
  const { currentTrack } = usePlayerStore();

  if (!currentTrack) {
    return (
      <div className="now-playing empty">
        <div className="thumbnail-placeholder">
          <MusicNoteIcon />
        </div>
        <div className="track-info">
          <span className="track-title">No track selected</span>
          <span className="track-artist">Select a track to play</span>
        </div>
      </div>
    );
  }

  const thumbnailUrl = currentTrack.thumbnailPath
    ? ENDPOINTS.media.thumbnail(currentTrack.id)
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
            <MusicNoteIcon />
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

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

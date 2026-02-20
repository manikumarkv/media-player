import { usePlayerStore, type Track } from '../../stores/playerStore';
import { ENDPOINTS } from '@media-player/shared';
import { getMediaUrl } from '../../utils/electron';
import { CloseIcon, MusicNoteIcon } from '../Icons';
import './Player.css';

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const { queue, queueIndex, currentTrack, removeFromQueue, clearQueue } = usePlayerStore();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="queue-panel-overlay" onClick={onClose}>
      <div
        className="queue-panel"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="queue-header">
          <h3>Queue</h3>
          <div className="queue-actions">
            {queue.length > 0 && (
              <button className="clear-queue-button" onClick={clearQueue} aria-label="Clear queue">
                Clear
              </button>
            )}
            <button className="close-button" onClick={onClose} aria-label="Close queue">
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        <div className="queue-content">
          {currentTrack && (
            <div className="now-playing-section">
              <h4>Now Playing</h4>
              <QueueItem track={currentTrack} isCurrent />
            </div>
          )}

          {queue.length > 0 && (
            <div className="up-next-section">
              <h4>Up Next</h4>
              <ul className="queue-list" role="list">
                {queue.map((track, index) => (
                  <li key={`${track.id}-${index.toString()}`}>
                    <QueueItem
                      track={track}
                      isCurrent={index === queueIndex}
                      onRemove={() => {
                        removeFromQueue(index);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {queue.length === 0 && !currentTrack && (
            <div className="empty-queue">
              <p>Your queue is empty</p>
              <p className="empty-hint">Add tracks from the library to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface QueueItemProps {
  track: Track;
  isCurrent?: boolean;
  onRemove?: () => void;
}

function QueueItem({ track, isCurrent, onRemove }: QueueItemProps) {
  const { setCurrentTrack, play } = usePlayerStore();

  const handleClick = () => {
    setCurrentTrack(track);
    play();
  };

  const thumbnailUrl = track.thumbnailPath ? getMediaUrl(ENDPOINTS.media.thumbnail(track.id)) : null;

  return (
    <div
      className={`queue-item ${isCurrent ? 'current' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="queue-item-thumbnail">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" />
        ) : (
          <div className="thumbnail-placeholder small">
            <MusicNoteIcon size={16} />
          </div>
        )}
      </div>
      <div className="queue-item-info">
        <span className="queue-item-title">{track.title}</span>
        <span className="queue-item-artist">{track.artist ?? 'Unknown Artist'}</span>
      </div>
      <span className="queue-item-duration">{formatDuration(track.duration)}</span>
      {onRemove && (
        <button
          className="remove-button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${track.title} from queue`}
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString()}:${secs.toString().padStart(2, '0')}`;
}

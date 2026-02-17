import { useRef, useCallback, type MouseEvent } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import './Player.css';

export function ProgressBar() {
  const { currentTime, duration, currentTrack } = usePlayerStore();
  const { seek } = useAudioPlayer();
  const progressRef = useRef<HTMLDivElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !duration) {
        return;
      }

      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      seek(newTime);
    },
    [duration, seek]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!duration) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
        case 'Home':
          e.preventDefault();
          seek(0);
          break;
        case 'End':
          e.preventDefault();
          seek(duration);
          break;
      }
    },
    [currentTime, duration, seek]
  );

  return (
    <div className="progress-container">
      <span className="time-display">{formatTime(currentTime)}</span>
      <div
        ref={progressRef}
        className="progress-bar"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={currentTrack ? 0 : -1}
      >
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
          <div
            className="progress-thumb"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>
      <span className="time-display">{formatTime(duration)}</span>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

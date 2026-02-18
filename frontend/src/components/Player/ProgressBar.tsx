import { useRef, useCallback, useState, useEffect, type MouseEvent } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import './Player.css';

export function ProgressBar() {
  const { currentTime, duration, currentTrack } = usePlayerStore();
  const { seek } = useAudioPlayer();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [pendingSeekProgress, setPendingSeekProgress] = useState<number | null>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Clear pending seek once currentTime catches up
  useEffect(() => {
    if (pendingSeekProgress !== null && Math.abs(progress - pendingSeekProgress) < 1) {
      setPendingSeekProgress(null);
    }
  }, [progress, pendingSeekProgress]);

  // Show drag position while dragging, pending seek position after release, or actual position
  const displayProgress = isDragging ? dragProgress : (pendingSeekProgress ?? progress);

  const calculateProgress = useCallback((clientX: number) => {
    if (!progressRef.current) {
      return 0;
    }
    const rect = progressRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!duration) {
        return;
      }
      e.preventDefault();
      setIsDragging(true);
      const newProgress = calculateProgress(e.clientX);
      setDragProgress(newProgress);
    },
    [duration, calculateProgress]
  );

  // Handle mouse move and mouse up globally when dragging
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newProgress = calculateProgress(e.clientX);
      setDragProgress(newProgress);
    };

    const handleMouseUp = (e: globalThis.MouseEvent) => {
      const finalProgress = calculateProgress(e.clientX);
      const newTime = (finalProgress / 100) * duration;
      setPendingSeekProgress(finalProgress);
      seek(newTime);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateProgress, duration, seek]);


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
      <span className="time-display">
        {formatTime((displayProgress / 100) * duration)}
      </span>
      <div
        ref={progressRef}
        className={`progress-bar ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
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
            style={{ width: `${String(displayProgress)}%` }}
          />
          <div
            className="progress-thumb"
            style={{ left: `${String(displayProgress)}%` }}
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
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}

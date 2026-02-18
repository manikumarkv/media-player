import { useRef, useCallback, useState, useEffect, type MouseEvent } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { VolumeHighIcon, VolumeLowIcon, VolumeMuteIcon } from '../Icons';
import './Player.css';

export function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayerStore();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayVolume = isMuted ? 0 : volume;

  const calculateVolume = useCallback((clientX: number) => {
    if (!sliderRef.current) {
      return volume;
    }
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(1, x / rect.width));
  }, [volume]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      const newVolume = calculateVolume(e.clientX);
      setVolume(newVolume);
    },
    [calculateVolume, setVolume]
  );

  // Handle mouse move and mouse up globally when dragging
  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (e: globalThis.MouseEvent) => {
      const newVolume = calculateVolume(e.clientX);
      setVolume(newVolume);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateVolume, setVolume]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!sliderRef.current) {
        return;
      }

      const rect = sliderRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      setVolume(percentage);
    },
    [setVolume]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'Home':
          e.preventDefault();
          setVolume(0);
          break;
        case 'End':
          e.preventDefault();
          setVolume(1);
          break;
      }
    },
    [volume, setVolume]
  );

  return (
    <div className="volume-control">
      <button
        className="volume-button"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {displayVolume === 0 ? (
          <VolumeMuteIcon size={20} />
        ) : displayVolume < 0.5 ? (
          <VolumeLowIcon size={20} />
        ) : (
          <VolumeHighIcon size={20} />
        )}
      </button>
      <div
        ref={sliderRef}
        className={`volume-slider ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayVolume * 100)}
        tabIndex={0}
      >
        <div className="volume-track">
          <div className="volume-fill" style={{ width: `${(displayVolume * 100).toString()}%` }} />
          <div className="volume-thumb" style={{ left: `${(displayVolume * 100).toString()}%` }} />
        </div>
      </div>
    </div>
  );
}

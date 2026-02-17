import { usePlayerStore } from '../../stores/playerStore';
import './Player.css';

export function PlayerControls() {
  const {
    isPlaying,
    repeatMode,
    isShuffled,
    togglePlay,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
    currentTrack,
  } = usePlayerStore();

  const disabled = !currentTrack;

  return (
    <div className="player-controls">
      <button
        className={`control-button shuffle ${isShuffled ? 'active' : ''}`}
        onClick={toggleShuffle}
        disabled={disabled}
        aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
        title="Shuffle"
      >
        <ShuffleIcon />
      </button>

      <button
        className="control-button"
        onClick={playPrevious}
        disabled={disabled}
        aria-label="Previous track"
        title="Previous"
      >
        <PreviousIcon />
      </button>

      <button
        className="control-button play-pause"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        className="control-button"
        onClick={playNext}
        disabled={disabled}
        aria-label="Next track"
        title="Next"
      >
        <NextIcon />
      </button>

      <button
        className={`control-button repeat ${repeatMode !== 'off' ? 'active' : ''}`}
        onClick={toggleRepeat}
        disabled={disabled}
        aria-label={`Repeat: ${repeatMode}`}
        title={`Repeat: ${repeatMode}`}
      >
        {repeatMode === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
      </button>
    </div>
  );
}

// SVG Icons
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function PreviousIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
    </svg>
  );
}

function RepeatOneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
    </svg>
  );
}

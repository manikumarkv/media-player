import { usePlayerStore } from '../../stores/playerStore';
import {
  PlayIcon,
  PauseIcon,
  PreviousIcon,
  NextIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
} from '../Icons';
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
        <ShuffleIcon size={18} />
      </button>

      <button
        className="control-button"
        onClick={playPrevious}
        disabled={disabled}
        aria-label="Previous track"
        title="Previous"
      >
        <PreviousIcon size={20} />
      </button>

      <button
        className="control-button play-pause"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
      </button>

      <button
        className="control-button"
        onClick={playNext}
        disabled={disabled}
        aria-label="Next track"
        title="Next"
      >
        <NextIcon size={20} />
      </button>

      <button
        className={`control-button repeat ${repeatMode !== 'off' ? 'active' : ''}`}
        onClick={toggleRepeat}
        disabled={disabled}
        aria-label={`Repeat: ${repeatMode}`}
        title={`Repeat: ${repeatMode}`}
      >
        {repeatMode === 'one' ? <RepeatOneIcon size={18} /> : <RepeatIcon size={18} />}
      </button>
    </div>
  );
}

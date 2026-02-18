import { useState } from 'react';
import { useAudioPlayer, usePlayerKeyboardShortcuts } from '../../hooks/useAudioPlayer';
import { usePlayTracking } from '../../hooks/usePlayTracking';
import { usePlayerStore } from '../../stores/playerStore';
import { NowPlaying } from './NowPlaying';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { VolumeControl } from './VolumeControl';
import { QueuePanel } from './QueuePanel';
import './Player.css';

export function Player() {
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const currentTrack = usePlayerStore((state) => state.currentTrack);

  // Initialize audio player, keyboard shortcuts, and play tracking
  useAudioPlayer();
  usePlayerKeyboardShortcuts();
  usePlayTracking();

  // Hide player when nothing is selected
  if (!currentTrack) {
    return null;
  }

  return (
    <>
      <footer className="player" role="region" aria-label="Audio player">
        <NowPlaying />

        <div className="player-center">
          <PlayerControls />
          <ProgressBar />
        </div>

        <div className="player-right">
          <VolumeControl />
          <button
            className={`queue-toggle ${isQueueOpen ? 'active' : ''}`}
            onClick={() => {
              setIsQueueOpen(!isQueueOpen);
            }}
            aria-label={isQueueOpen ? 'Close queue' : 'Open queue'}
            aria-expanded={isQueueOpen}
            title="Queue"
          >
            <QueueIcon />
          </button>
        </div>
      </footer>

      <QueuePanel
        isOpen={isQueueOpen}
        onClose={() => {
          setIsQueueOpen(false);
        }}
      />
    </>
  );
}

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

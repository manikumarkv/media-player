import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { ENDPOINTS } from '@media-player/shared';

// Duration for fade effects in milliseconds
const FADE_DURATION = 150;
const VOLUME_FADE_DURATION = 100;

// Singleton audio element - shared across all hook instances
let audioElement: HTMLAudioElement | null = null;
let targetVolume = 1;
let isFading = false;

function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'metadata';
  }
  return audioElement;
}

/**
 * Smoothly fade audio volume from current to target value
 */
function fadeVolume(
  audio: HTMLAudioElement,
  newTargetVolume: number,
  duration: number = VOLUME_FADE_DURATION
): Promise<void> {
  return new Promise((resolve) => {
    const startVolume = audio.volume;
    const volumeDiff = newTargetVolume - startVolume;

    if (Math.abs(volumeDiff) < 0.01) {
      audio.volume = newTargetVolume;
      resolve();
      return;
    }

    const startTime = performance.now();

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easeOutQuad for smooth deceleration
      const eased = 1 - (1 - progress) * (1 - progress);
      audio.volume = startVolume + volumeDiff * eased;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        audio.volume = newTargetVolume;
        resolve();
      }
    }

    requestAnimationFrame(tick);
  });
}

export function useAudioPlayer() {
  const isInitialized = useRef(false);
  const { currentTrack, isPlaying, volume, isMuted, setCurrentTime, setDuration } =
    usePlayerStore();

  // Initialize audio element and event listeners (only once per app)
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    const audio = getAudioElement();

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      const { repeatMode: currentRepeatMode } = usePlayerStore.getState();
      if (currentRepeatMode === 'one') {
        audio.currentTime = 0;
        void audio.play();
      } else {
        usePlayerStore.getState().playNext();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      usePlayerStore.getState().pause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // No cleanup - singleton persists for app lifetime
  }, [setCurrentTime, setDuration]);

  // Handle track changes (only when track changes, not when isPlaying changes)
  useEffect(() => {
    const audio = getAudioElement();

    if (currentTrack) {
      const streamUrl = ENDPOINTS.media.stream(currentTrack.id);
      // Compare using endsWith since audio.src is absolute and streamUrl is relative
      if (!audio.src.endsWith(streamUrl)) {
        audio.src = streamUrl;
        audio.load();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentTrack]);

  // Handle play/pause
  useEffect(() => {
    const audio = getAudioElement();
    if (!currentTrack) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes with smooth fade
  useEffect(() => {
    const audio = getAudioElement();

    const newVolume = isMuted ? 0 : volume;
    targetVolume = newVolume;

    // Don't fade if we're in the middle of a seek fade
    if (isFading) {
      return;
    }

    // Smooth fade to new volume
    void fadeVolume(audio, newVolume, VOLUME_FADE_DURATION);
  }, [volume, isMuted]);

  // Seek to position with smooth fade out/in
  const seek = useCallback((time: number) => {
    const audio = getAudioElement();
    if (!isFinite(time)) {
      return;
    }

    const targetTime = Math.max(0, Math.min(time, audio.duration || 0));
    const currentVolume = targetVolume;

    // If the seek is small (< 2 seconds), just seek without fade
    if (Math.abs(targetTime - audio.currentTime) < 2) {
      audio.currentTime = targetTime;
      return;
    }

    // Mark that we're fading to prevent volume effect interference
    isFading = true;

    // Fade out -> seek -> fade in
    void fadeVolume(audio, 0, FADE_DURATION)
      .then(() => {
        audio.currentTime = targetTime;
        return fadeVolume(audio, currentVolume, FADE_DURATION);
      })
      .then(() => {
        isFading = false;
      });
  }, []);

  // Play a track
  const playTrack = useCallback((track: Track, queue?: Track[], index?: number) => {
    const { setCurrentTrack, setQueue, play } = usePlayerStore.getState();

    if (queue && typeof index === 'number') {
      setQueue(queue);
      usePlayerStore.setState({ queueIndex: index });
    }

    setCurrentTrack(track);
    play();
  }, []);

  return {
    seek,
    playTrack,
  };
}

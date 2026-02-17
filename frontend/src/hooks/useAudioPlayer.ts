import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { ENDPOINTS } from '@media-player/shared';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    repeatMode,
    setCurrentTime,
    setDuration,
    playNext,
    pause,
  } = usePlayerStore();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        void audio.play();
      } else {
        playNext();
      }
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      pause();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [setCurrentTime, setDuration, playNext, pause, repeatMode]);

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (currentTrack) {
      const streamUrl = ENDPOINTS.media.stream(currentTrack.id);
      audio.src = streamUrl;
      audio.load();
      if (isPlaying) {
        void audio.play().catch(console.error);
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentTrack, isPlaying]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Seek to position
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time)) {
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
    }
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
    audioRef,
    seek,
    playTrack,
  };
}

// Keyboard shortcuts hook
export function usePlayerKeyboardShortcuts() {
  const { togglePlay, playNext, playPrevious, toggleMute } = usePlayerStore();
  const { seek } = useAudioPlayer();
  const currentTime = usePlayerStore((state) => state.currentTime);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            playNext();
          } else {
            seek(currentTime + 10);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            playPrevious();
          } else {
            seek(currentTime - 10);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          {
            const { volume, setVolume } = usePlayerStore.getState();
            setVolume(Math.min(1, volume + 0.1));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          {
            const { volume, setVolume } = usePlayerStore.getState();
            setVolume(Math.max(0, volume - 0.1));
          }
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, playNext, playPrevious, toggleMute, seek, currentTime]);
}

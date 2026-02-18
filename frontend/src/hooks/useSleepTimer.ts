import { useEffect, useCallback, useRef } from 'react';
import { useSleepTimerStore } from '../stores/sleepTimerStore';
import { usePlayerStore } from '../stores/playerStore';

/**
 * Hook for managing the sleep timer functionality.
 * Handles timer countdown, volume fade-out, and playback pause.
 */
export function useSleepTimer() {
  const {
    isActive,
    endTime,
    remainingMs,
    isInFadeOut,
    fadeOutProgress,
    setTimer,
    clearTimer,
    updateRemaining,
  } = useSleepTimerStore();

  const { pause, volume } = usePlayerStore();
  const originalVolumeRef = useRef(volume);
  const hasExpiredRef = useRef(false);

  // Store original volume when timer starts
  useEffect(() => {
    if (isActive && !isInFadeOut) {
      originalVolumeRef.current = volume;
    }
  }, [isActive, isInFadeOut, volume]);

  // Timer tick effect
  useEffect(() => {
    if (!isActive) {
      hasExpiredRef.current = false;
      return;
    }

    const interval = setInterval(() => {
      updateRemaining();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, updateRemaining]);

  // Handle timer expiration and fade-out
  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Timer expired
    if (remainingMs === 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      pause();
      clearTimer();
    }
  }, [isActive, remainingMs, pause, clearTimer]);

  const startTimer = useCallback(
    (minutes: number) => {
      originalVolumeRef.current = volume;
      hasExpiredRef.current = false;
      setTimer(minutes);
    },
    [setTimer, volume]
  );

  const cancelTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const formatRemaining = useCallback((): string => {
    if (!isActive || remainingMs === 0) {
      return '0:00';
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes)}:${seconds.toString().padStart(2, '0')}`;
  }, [isActive, remainingMs]);

  return {
    isActive,
    endTime,
    remainingMs,
    isInFadeOut,
    fadeOutProgress,
    startTimer,
    cancelTimer,
    formatRemaining,
  };
}

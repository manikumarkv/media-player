import { useEffect, useRef } from 'react';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { apiClient } from '../api/client';

/**
 * Minimum play time in seconds before recording a play.
 * Prevents recording accidental plays or quick skips.
 */
const MIN_PLAY_DURATION = 5;

/**
 * Hook to track play history and record to the backend.
 * Monitors track changes and records the play duration when:
 * - A track changes to another track
 * - A track ends (becomes null)
 * - Only records if played for at least MIN_PLAY_DURATION seconds
 */
export function usePlayTracking() {
  // Store the previous track info and accumulated time
  const trackInfoRef = useRef<{
    track: Track | null;
    accumulatedTime: number;
  }>({
    track: null,
    accumulatedTime: 0,
  });
  const isInitializedRef = useRef(false);

  // Subscribe to store via selector for efficient re-renders
  useEffect(() => {
    // Initialize ref with current state
    const initialState = usePlayerStore.getState();
    trackInfoRef.current = {
      track: initialState.currentTrack,
      accumulatedTime: initialState.currentTime,
    };
    isInitializedRef.current = true;

    // Subscribe to the store
    const unsubscribe = usePlayerStore.subscribe((state) => {
      const { currentTrack, currentTime } = state;
      const prevInfo = trackInfoRef.current;

      // Track the same - just update accumulated time
      if (prevInfo.track?.id === currentTrack?.id) {
        trackInfoRef.current.accumulatedTime = currentTime;
        return;
      }

      // Track changed - record the previous track's play if applicable
      if (prevInfo.track && prevInfo.accumulatedTime >= MIN_PLAY_DURATION) {
        void recordPlay(prevInfo.track.id, prevInfo.accumulatedTime);
      }

      // Update to new track
      trackInfoRef.current = {
        track: currentTrack,
        accumulatedTime: currentTime,
      };
    });

    return unsubscribe;
  }, []);
}

/**
 * Record a play to the backend API.
 */
async function recordPlay(mediaId: string, duration: number): Promise<void> {
  try {
    await apiClient.history.record(mediaId, Math.floor(duration));
  } catch (error) {
    console.error('Failed to record play history:', error);
  }
}

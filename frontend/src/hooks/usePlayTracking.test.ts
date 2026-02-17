import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePlayTracking } from './usePlayTracking';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { apiClient } from '../api/client';

// Mock apiClient
vi.mock('../api/client', () => ({
  apiClient: {
    history: {
      record: vi.fn().mockResolvedValue({ success: true, data: {} }),
    },
  },
}));

const mockTrack: Track = {
  id: 'track-1',
  title: 'Test Song',
  artist: 'Test Artist',
  duration: 180,
  filePath: '/music/test.mp3',
};

const mockTrack2: Track = {
  id: 'track-2',
  title: 'Another Song',
  artist: 'Another Artist',
  duration: 240,
  filePath: '/music/another.mp3',
};

describe('usePlayTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset playerStore to initial state
    usePlayerStore.setState({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('does not record anything on mount with no track', () => {
      renderHook(() => {
        usePlayTracking();
      });

      expect(apiClient.history.record).not.toHaveBeenCalled();
    });

    it('does not record when track is set but not playing', () => {
      // First render with no track
      renderHook(() => {
        usePlayTracking();
      });

      // Then set track (simulating user selecting a track but not playing)
      act(() => {
        usePlayerStore.setState({ currentTrack: mockTrack, isPlaying: false });
      });

      expect(apiClient.history.record).not.toHaveBeenCalled();
    });
  });

  describe('play tracking', () => {
    it('records play when track changes while playing', async () => {
      // Render hook first with no track
      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track 1
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate time passing (user played the song for 60 seconds)
      act(() => {
        usePlayerStore.setState({
          currentTime: 60,
        });
      });

      // Change to track 2
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack2,
          isPlaying: true,
          currentTime: 0,
        });
      });

      await waitFor(() => {
        expect(apiClient.history.record).toHaveBeenCalledWith(mockTrack.id, expect.any(Number));
      });
    });

    it('records duration played when track changes', async () => {
      const playDuration = 45;

      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track 1
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate time passing
      act(() => {
        usePlayerStore.setState({
          currentTime: playDuration,
        });
      });

      // Change to track 2
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack2,
          isPlaying: true,
          currentTime: 0,
        });
      });

      await waitFor(() => {
        expect(apiClient.history.record).toHaveBeenCalledWith(mockTrack.id, playDuration);
      });
    });

    it('does not record when pausing without track change', async () => {
      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 30,
        });
      });

      // Pause the track (same track, just paused)
      act(() => {
        usePlayerStore.setState({
          isPlaying: false,
        });
      });

      // Wait a bit to ensure no call was made
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(apiClient.history.record).not.toHaveBeenCalled();
    });

    it('records when track ends (track becomes null)', async () => {
      const playDuration = 180;

      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate track playing to completion
      act(() => {
        usePlayerStore.setState({
          currentTime: playDuration,
        });
      });

      // Track ends
      act(() => {
        usePlayerStore.setState({
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
        });
      });

      await waitFor(() => {
        expect(apiClient.history.record).toHaveBeenCalledWith(mockTrack.id, playDuration);
      });
    });
  });

  describe('minimum play time', () => {
    it('does not record if played less than minimum threshold', async () => {
      const shortPlayTime = 2; // Less than minimum (5 seconds)

      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate short play time
      act(() => {
        usePlayerStore.setState({
          currentTime: shortPlayTime,
        });
      });

      // Change to track 2
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack2,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Wait a bit to ensure no call was made
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(apiClient.history.record).not.toHaveBeenCalled();
    });

    it('records if played more than minimum threshold', async () => {
      const longPlayTime = 10; // More than minimum (5 seconds)

      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate longer play time
      act(() => {
        usePlayerStore.setState({
          currentTime: longPlayTime,
        });
      });

      // Change to track 2
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack2,
          isPlaying: true,
          currentTime: 0,
        });
      });

      await waitFor(() => {
        expect(apiClient.history.record).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('handles API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      vi.mocked(apiClient.history.record).mockRejectedValueOnce(new Error('Network error'));

      renderHook(() => {
        usePlayTracking();
      });

      // Start playing track
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack,
          isPlaying: true,
          currentTime: 0,
        });
      });

      // Simulate play time > minimum
      act(() => {
        usePlayerStore.setState({
          currentTime: 30,
        });
      });

      // Change to track 2 (triggers record)
      act(() => {
        usePlayerStore.setState({
          currentTrack: mockTrack2,
          isPlaying: true,
          currentTime: 0,
        });
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });
});

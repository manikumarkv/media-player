import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSleepTimer } from './useSleepTimer';
import { useSleepTimerStore } from '../stores/sleepTimerStore';
import { usePlayerStore } from '../stores/playerStore';

// Mock the player store
vi.mock('../stores/playerStore', () => ({
  usePlayerStore: vi.fn(),
}));

describe('useSleepTimer', () => {
  const mockPause = vi.fn();
  const mockSetVolume = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    useSleepTimerStore.getState().clearTimer();
    mockPause.mockClear();
    mockSetVolume.mockClear();

    (usePlayerStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      pause: mockPause,
      volume: 1,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startTimer', () => {
    it('starts a timer with given minutes', () => {
      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(30);
      });

      expect(result.current.isActive).toBe(true);
    });
  });

  describe('cancelTimer', () => {
    it('cancels an active timer', () => {
      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(30);
      });
      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.cancelTimer();
      });
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('formatRemaining', () => {
    it('formats time correctly', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(30);
      });

      // Should show 30:00
      expect(result.current.formatRemaining()).toBe('30:00');
    });

    it('updates format as time passes', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(30);
      });

      // Advance 10 minutes
      // Set time to 1 second before target so advanceTimersByTime(1000) lands exactly at 10 min
      act(() => {
        vi.setSystemTime(now + 10 * 60 * 1000 - 1000);
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.formatRemaining()).toBe('20:00');
    });
  });

  describe('timer expiration', () => {
    it('pauses playback when timer expires', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(1); // 1 minute
      });

      // Advance past the timer
      act(() => {
        vi.setSystemTime(now + 61 * 1000);
        vi.advanceTimersByTime(1000);
      });

      expect(mockPause).toHaveBeenCalled();
    });

    it('clears timer when expired', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const { result } = renderHook(() => useSleepTimer());

      act(() => {
        result.current.startTimer(1);
      });

      act(() => {
        vi.setSystemTime(now + 61 * 1000);
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isActive).toBe(false);
    });
  });
});

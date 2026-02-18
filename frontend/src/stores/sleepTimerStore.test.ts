import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useSleepTimerStore } from './sleepTimerStore';

describe('sleepTimerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSleepTimerStore.getState().clearTimer();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('has no active timer', () => {
      const state = useSleepTimerStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.endTime).toBeNull();
      expect(state.remainingMs).toBe(0);
    });
  });

  describe('setTimer', () => {
    it('sets a timer with given minutes', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(30);

      const state = useSleepTimerStore.getState();
      expect(state.isActive).toBe(true);
      expect(state.endTime).toBe(now + 30 * 60 * 1000);
      expect(state.durationMs).toBe(30 * 60 * 1000);
    });

    it('supports custom durations', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(45);

      const state = useSleepTimerStore.getState();
      expect(state.endTime).toBe(now + 45 * 60 * 1000);
    });
  });

  describe('clearTimer', () => {
    it('clears an active timer', () => {
      useSleepTimerStore.getState().setTimer(30);
      expect(useSleepTimerStore.getState().isActive).toBe(true);

      useSleepTimerStore.getState().clearTimer();

      const state = useSleepTimerStore.getState();
      expect(state.isActive).toBe(false);
      expect(state.endTime).toBeNull();
    });
  });

  describe('updateRemaining', () => {
    it('updates remaining time correctly', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(30);

      // Advance 10 minutes
      vi.setSystemTime(now + 10 * 60 * 1000);
      useSleepTimerStore.getState().updateRemaining();

      const state = useSleepTimerStore.getState();
      expect(state.remainingMs).toBe(20 * 60 * 1000);
    });

    it('sets remaining to 0 when timer expires', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(30);

      // Advance past end time
      vi.setSystemTime(now + 31 * 60 * 1000);
      useSleepTimerStore.getState().updateRemaining();

      expect(useSleepTimerStore.getState().remainingMs).toBe(0);
    });
  });

  describe('isInFadeOut', () => {
    it('returns false when not in fade out period', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(30);
      useSleepTimerStore.getState().updateRemaining();

      expect(useSleepTimerStore.getState().isInFadeOut).toBe(false);
    });

    it('returns true when in final 60 seconds', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(1); // 1 minute

      // Advance to 30 seconds remaining
      vi.setSystemTime(now + 30 * 1000);
      useSleepTimerStore.getState().updateRemaining();

      expect(useSleepTimerStore.getState().isInFadeOut).toBe(true);
    });
  });

  describe('fadeOutProgress', () => {
    it('returns 1 at start of fade out', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(1); // 1 minute
      useSleepTimerStore.getState().updateRemaining();

      // At exactly 60 seconds remaining, progress should be 1
      expect(useSleepTimerStore.getState().fadeOutProgress).toBe(1);
    });

    it('returns 0.5 at halfway through fade out', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(1); // 1 minute

      // Advance to 30 seconds remaining (halfway through 60s fade)
      vi.setSystemTime(now + 30 * 1000);
      useSleepTimerStore.getState().updateRemaining();

      expect(useSleepTimerStore.getState().fadeOutProgress).toBeCloseTo(0.5, 1);
    });

    it('returns 0 when timer expires', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      useSleepTimerStore.getState().setTimer(1);

      vi.setSystemTime(now + 61 * 1000);
      useSleepTimerStore.getState().updateRemaining();

      expect(useSleepTimerStore.getState().fadeOutProgress).toBe(0);
    });
  });
});

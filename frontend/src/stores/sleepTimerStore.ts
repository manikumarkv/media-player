import { create } from 'zustand';

const FADE_OUT_DURATION_MS = 60 * 1000; // 60 seconds

export interface SleepTimerState {
  isActive: boolean;
  endTime: number | null;
  durationMs: number;
  remainingMs: number;
  isInFadeOut: boolean;
  fadeOutProgress: number; // 1 = full volume, 0 = silent

  setTimer: (minutes: number) => void;
  clearTimer: () => void;
  updateRemaining: () => void;
}

export const useSleepTimerStore = create<SleepTimerState>((set, get) => ({
  isActive: false,
  endTime: null,
  durationMs: 0,
  remainingMs: 0,
  isInFadeOut: false,
  fadeOutProgress: 1,

  setTimer: (minutes: number) => {
    const durationMs = minutes * 60 * 1000;
    const endTime = Date.now() + durationMs;

    set({
      isActive: true,
      endTime,
      durationMs,
      remainingMs: durationMs,
      isInFadeOut: durationMs <= FADE_OUT_DURATION_MS,
      fadeOutProgress: 1,
    });
  },

  clearTimer: () => {
    set({
      isActive: false,
      endTime: null,
      durationMs: 0,
      remainingMs: 0,
      isInFadeOut: false,
      fadeOutProgress: 1,
    });
  },

  updateRemaining: () => {
    const { endTime, isActive } = get();

    if (!isActive || endTime === null) {
      return;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, endTime - now);
    const isInFadeOut = remainingMs <= FADE_OUT_DURATION_MS && remainingMs > 0;
    const fadeOutProgress = isInFadeOut
      ? remainingMs / FADE_OUT_DURATION_MS
      : remainingMs > FADE_OUT_DURATION_MS
        ? 1
        : 0;

    set({
      remainingMs,
      isInFadeOut,
      fadeOutProgress,
    });
  },
}));

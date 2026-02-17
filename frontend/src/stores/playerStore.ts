import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration: number;
  filePath: string;
  thumbnailPath?: string;
}

export interface PlayerState {
  // Current track
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;

  // Queue
  queue: Track[];
  queueIndex: number;

  // Repeat/Shuffle
  repeatMode: 'off' | 'one' | 'all';
  isShuffled: boolean;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;

  // Queue actions
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;

  // Mode actions
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  queue: [],
  queueIndex: -1,
  repeatMode: 'off',
  isShuffled: false,

  // Track actions
  setCurrentTrack: (track) => set({ currentTrack: track, currentTime: 0 }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

  toggleMute: () =>
    set((state) => ({
      isMuted: !state.isMuted,
      volume: state.isMuted ? (state.volume || 1) : 0,
    })),

  // Queue actions
  setQueue: (tracks) => set({ queue: tracks }),

  addToQueue: (track) =>
    set((state) => ({ queue: [...state.queue, track] })),

  removeFromQueue: (index) =>
    set((state) => ({
      queue: state.queue.filter((_, i) => i !== index),
      queueIndex:
        index < state.queueIndex
          ? state.queueIndex - 1
          : state.queueIndex,
    })),

  clearQueue: () => set({ queue: [], queueIndex: -1 }),

  playNext: () => {
    const { queue, queueIndex, repeatMode } = get();
    if (queue.length === 0) return;

    let nextIndex = queueIndex + 1;

    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  playPrevious: () => {
    const { queue, queueIndex, currentTime } = get();
    if (queue.length === 0) return;

    // If more than 3 seconds in, restart current track
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : 0;

    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      currentTime: 0,
      isPlaying: true,
    });
  },

  // Mode actions
  toggleRepeat: () =>
    set((state) => ({
      repeatMode:
        state.repeatMode === 'off'
          ? 'all'
          : state.repeatMode === 'all'
            ? 'one'
            : 'off',
    })),

  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
}));

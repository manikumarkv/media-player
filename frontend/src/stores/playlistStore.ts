import { create } from 'zustand';
import { apiClient, type Playlist, type PlaylistWithItems } from '../api/client';

interface PlaylistState {
  playlists: Playlist[];
  currentPlaylist: PlaylistWithItems | null;
  isLoading: boolean;
  error: string | null;

  // Modal state
  addToPlaylistModal: {
    isOpen: boolean;
    mediaId: string | null;
  };

  // Actions
  fetchPlaylists: () => Promise<void>;
  fetchPlaylist: (id: string) => Promise<void>;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addItemToPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  removeItemFromPlaylist: (playlistId: string, mediaId: string) => Promise<void>;

  // Modal actions
  openAddToPlaylistModal: (mediaId: string) => void;
  closeAddToPlaylistModal: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  currentPlaylist: null,
  isLoading: false,
  error: null,

  addToPlaylistModal: {
    isOpen: false,
    mediaId: null,
  },

  fetchPlaylists: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.playlists.list();
      set({ playlists: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch playlists', isLoading: false });
      console.error('Failed to fetch playlists:', error);
    }
  },

  fetchPlaylist: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.playlists.get(id);
      set({ currentPlaylist: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch playlist', isLoading: false });
      console.error('Failed to fetch playlist:', error);
    }
  },

  createPlaylist: async (name: string, description?: string) => {
    try {
      const response = await apiClient.playlists.create({ name, description });
      set((state) => ({
        playlists: [response.data, ...state.playlists],
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw error;
    }
  },

  updatePlaylist: async (id: string, data: { name?: string; description?: string }) => {
    try {
      const response = await apiClient.playlists.update(id, data);
      set((state) => ({
        playlists: state.playlists.map((p) => (p.id === id ? { ...p, ...response.data } : p)),
        currentPlaylist:
          state.currentPlaylist?.id === id
            ? { ...state.currentPlaylist, ...response.data }
            : state.currentPlaylist,
      }));
    } catch (error) {
      console.error('Failed to update playlist:', error);
      throw error;
    }
  },

  deletePlaylist: async (id: string) => {
    try {
      await apiClient.playlists.delete(id);
      set((state) => ({
        playlists: state.playlists.filter((p) => p.id !== id),
        currentPlaylist: state.currentPlaylist?.id === id ? null : state.currentPlaylist,
      }));
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      throw error;
    }
  },

  addItemToPlaylist: async (playlistId: string, mediaId: string) => {
    try {
      const response = await apiClient.playlists.addItem(playlistId, mediaId);
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        set({ currentPlaylist: response.data });
      }
    } catch (error) {
      console.error('Failed to add item to playlist:', error);
      throw error;
    }
  },

  removeItemFromPlaylist: async (playlistId: string, mediaId: string) => {
    try {
      const response = await apiClient.playlists.removeItem(playlistId, mediaId);
      const { currentPlaylist } = get();
      if (currentPlaylist?.id === playlistId) {
        set({ currentPlaylist: response.data });
      }
    } catch (error) {
      console.error('Failed to remove item from playlist:', error);
      throw error;
    }
  },

  openAddToPlaylistModal: (mediaId: string) => {
    set({
      addToPlaylistModal: {
        isOpen: true,
        mediaId,
      },
    });
  },

  closeAddToPlaylistModal: () => {
    set({
      addToPlaylistModal: {
        isOpen: false,
        mediaId: null,
      },
    });
  },
}));

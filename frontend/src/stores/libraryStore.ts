import { create } from 'zustand';
import { apiClient, type Media, type PaginatedResponse } from '../api/client';

type ViewMode = 'grid' | 'list';
type SortBy = 'title' | 'artist' | 'createdAt' | 'playCount';
type SortOrder = 'asc' | 'desc';

interface LibraryState {
  // Data
  media: Media[];
  likedMedia: Media[];
  recentMedia: Media[];

  // Pagination
  page: number;
  totalPages: number;
  total: number;
  hasMore: boolean;

  // Filters
  searchQuery: string;
  sortBy: SortBy;
  sortOrder: SortOrder;
  viewMode: ViewMode;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMedia: (reset?: boolean) => Promise<void>;
  fetchLiked: () => Promise<void>;
  fetchRecent: () => Promise<void>;
  loadMore: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (sortOrder: SortOrder) => void;
  setViewMode: (viewMode: ViewMode) => void;
  toggleLike: (mediaId: string) => Promise<void>;
  reset: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Initial state
  media: [],
  likedMedia: [],
  recentMedia: [],
  page: 1,
  totalPages: 1,
  total: 0,
  hasMore: false,
  searchQuery: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'grid',
  isLoading: false,
  error: null,

  fetchMedia: async (reset = false) => {
    const { searchQuery, sortBy, sortOrder, page, media } = get();

    if (reset) {
      set({ page: 1, media: [] });
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.media.list({
        query: searchQuery || undefined,
        sortBy,
        sortOrder,
        page: reset ? 1 : page,
        limit: 20,
      }) as PaginatedResponse<Media>;

      set({
        media: reset ? response.data : [...media, ...response.data],
        page: response.pagination.page,
        totalPages: response.pagination.totalPages,
        total: response.pagination.total,
        hasMore: response.pagination.hasMore,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch media',
        isLoading: false,
      });
    }
  },

  fetchLiked: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.likes.list() as PaginatedResponse<Media>;
      set({ likedMedia: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch liked songs',
        isLoading: false,
      });
    }
  },

  fetchRecent: async () => {
    try {
      const response = await apiClient.media.recent() as { data: Media[] };
      set({ recentMedia: response.data });
    } catch (error) {
      console.error('Failed to fetch recent media:', error);
    }
  },

  loadMore: async () => {
    const { hasMore, page, isLoading } = get();
    if (!hasMore || isLoading) {
      return;
    }

    set({ page: page + 1 });
    await get().fetchMedia();
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    void get().fetchMedia(true);
  },

  setSortBy: (sortBy: SortBy) => {
    set({ sortBy });
    void get().fetchMedia(true);
  },

  setSortOrder: (sortOrder: SortOrder) => {
    set({ sortOrder });
    void get().fetchMedia(true);
  },

  setViewMode: (viewMode: ViewMode) => {
    set({ viewMode });
  },

  toggleLike: async (mediaId: string) => {
    try {
      const response = await apiClient.likes.toggle(mediaId) as { data: Media };
      const updatedMedia = response.data;

      // Update in media list
      set((state) => ({
        media: state.media.map((m) =>
          m.id === mediaId ? updatedMedia : m
        ),
        likedMedia: updatedMedia.isLiked
          ? [...state.likedMedia, updatedMedia]
          : state.likedMedia.filter((m) => m.id !== mediaId),
      }));
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  },

  reset: () => {
    set({
      media: [],
      page: 1,
      totalPages: 1,
      total: 0,
      hasMore: false,
      searchQuery: '',
      error: null,
    });
  },
}));

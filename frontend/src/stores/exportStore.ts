import { create } from 'zustand';
import {
  apiClient,
  type ExportMode,
  type ExportableItem,
  type ExportStatus,
  type ExportResult,
} from '../api/client';

export interface ExportProgress {
  current: number;
  total: number;
  currentFile: string;
  percentage: number;
}

interface ExportState {
  // State
  destinationPath: string;
  exportMode: ExportMode;
  items: ExportableItem[];
  exportStatuses: Map<string, ExportStatus>;
  selectedIds: Set<string>;
  isLoading: boolean;
  isCheckingStatus: boolean;
  isExporting: boolean;
  progress: ExportProgress | null;
  error: string | null;
  includeArtwork: boolean;
  includeM3U: boolean;
  lastExportResult: ExportResult | null;

  // Actions
  setDestinationPath: (path: string) => void;
  setExportMode: (mode: ExportMode) => void;
  fetchItems: () => Promise<void>;
  checkStatus: () => Promise<void>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  selectNone: () => void;
  selectNotExported: () => void;
  setIncludeArtwork: (value: boolean) => void;
  setIncludeM3U: (value: boolean) => void;
  startExport: () => Promise<ExportResult | null>;
  reset: () => void;

  // Socket handlers
  handleExportStarted: (data: { totalItems: number; mode: ExportMode; destinationPath: string }) => void;
  handleExportProgress: (data: ExportProgress) => void;
  handleExportCompleted: (data: { totalExported: number; totalSkipped: number; destinationPath: string }) => void;
  handleExportError: (data: { error: string; currentFile?: string }) => void;
}

const DEFAULT_STATE = {
  destinationPath: '',
  exportMode: 'album' as ExportMode,
  items: [] as ExportableItem[],
  exportStatuses: new Map<string, ExportStatus>(),
  selectedIds: new Set<string>(),
  isLoading: false,
  isCheckingStatus: false,
  isExporting: false,
  progress: null as ExportProgress | null,
  error: null as string | null,
  includeArtwork: true,
  includeM3U: true,
  lastExportResult: null as ExportResult | null,
};

export const useExportStore = create<ExportState>((set, get) => ({
  ...DEFAULT_STATE,

  setDestinationPath: (path: string) => {
    set({ destinationPath: path });
  },

  setExportMode: (mode: ExportMode) => {
    set({
      exportMode: mode,
      items: [],
      exportStatuses: new Map(),
      selectedIds: new Set(),
      error: null,
    });
    // Fetch items for new mode
    get().fetchItems();
  },

  fetchItems: async () => {
    const { exportMode } = get();
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.export.getItems(exportMode);
      set({
        items: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch items',
        isLoading: false,
      });
    }
  },

  checkStatus: async () => {
    const { destinationPath, exportMode, items } = get();

    if (!destinationPath || items.length === 0) {
      return;
    }

    set({ isCheckingStatus: true, error: null });

    try {
      const itemIds = items.map((item) => item.id);
      const response = await apiClient.export.checkStatus(
        destinationPath,
        exportMode,
        itemIds
      );

      // Convert array to map
      const statusMap = new Map<string, ExportStatus>();
      for (const status of response.data) {
        statusMap.set(status.mediaId, status);
      }

      set({
        exportStatuses: statusMap,
        isCheckingStatus: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to check export status',
        isCheckingStatus: false,
      });
    }
  },

  toggleSelection: (id: string) => {
    set((state) => {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return { selectedIds: newSelected };
    });
  },

  selectAll: () => {
    const { items } = get();
    const allIds = new Set(items.map((item) => item.id));
    set({ selectedIds: allIds });
  },

  selectNone: () => {
    set({ selectedIds: new Set() });
  },

  selectNotExported: () => {
    const { items, exportStatuses } = get();

    // Get items that don't have all their tracks exported
    const notExportedIds = new Set<string>();

    for (const item of items) {
      // Check if any track for this item is not exported
      let hasUnexported = false;
      for (const [, status] of exportStatuses) {
        if (!status.isExported) {
          hasUnexported = true;
          break;
        }
      }

      // If we have status info and some tracks are not exported, select this item
      if (exportStatuses.size === 0 || hasUnexported) {
        notExportedIds.add(item.id);
      }
    }

    set({ selectedIds: notExportedIds });
  },

  setIncludeArtwork: (value: boolean) => {
    set({ includeArtwork: value });
  },

  setIncludeM3U: (value: boolean) => {
    set({ includeM3U: value });
  },

  startExport: async () => {
    const {
      destinationPath,
      exportMode,
      selectedIds,
      includeArtwork,
      includeM3U,
      items,
    } = get();

    if (!destinationPath || selectedIds.size === 0) {
      set({ error: 'Please select a destination path and items to export' });
      return null;
    }

    // Get all selected items
    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    if (selectedItems.length === 0) {
      set({ error: 'No items selected' });
      return null;
    }

    set({ isExporting: true, error: null, progress: null });

    try {
      let totalExported = 0;
      let totalSkipped = 0;
      const allExportedFiles: string[] = [];

      // Export each selected item
      for (let i = 0; i < selectedItems.length; i++) {
        const selectedItem = selectedItems[i];

        // Update progress for current item
        set({
          progress: {
            current: i + 1,
            total: selectedItems.length,
            currentFile: `Exporting ${selectedItem.name}...`,
            percentage: Math.round(((i + 1) / selectedItems.length) * 100),
          },
        });

        let options: {
          destinationPath: string;
          mode: ExportMode;
          albumName?: string;
          artistName?: string;
          playlistId?: string;
          includeArtwork: boolean;
          includeM3U: boolean;
        } = {
          destinationPath,
          mode: exportMode,
          includeArtwork,
          includeM3U,
        };

        // Add mode-specific options
        switch (exportMode) {
          case 'album':
            options = { ...options, albumName: selectedItem.id };
            break;
          case 'artist':
            options = { ...options, artistName: selectedItem.id };
            break;
          case 'playlist':
            options = { ...options, playlistId: selectedItem.id };
            break;
          // 'all' mode doesn't need additional options
        }

        const response = await apiClient.export.start(options);
        totalExported += response.data.totalExported;
        totalSkipped += response.data.totalSkipped;
        allExportedFiles.push(...response.data.exportedFiles);
      }

      const finalResult: ExportResult = {
        totalExported,
        totalSkipped,
        exportedFiles: allExportedFiles,
      };

      set({
        isExporting: false,
        lastExportResult: finalResult,
        progress: null,
      });

      // Refresh status after export
      get().checkStatus();

      return finalResult;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Export failed',
        isExporting: false,
        progress: null,
      });
      return null;
    }
  },

  reset: () => {
    set(DEFAULT_STATE);
  },

  // Socket handlers
  handleExportStarted: (data) => {
    set({
      isExporting: true,
      progress: {
        current: 0,
        total: data.totalItems,
        currentFile: '',
        percentage: 0,
      },
      error: null,
    });
  },

  handleExportProgress: (data) => {
    set({
      progress: data,
    });
  },

  handleExportCompleted: (data) => {
    set({
      isExporting: false,
      progress: null,
      lastExportResult: {
        totalExported: data.totalExported,
        totalSkipped: data.totalSkipped,
        exportedFiles: [],
      },
    });

    // Refresh status
    get().checkStatus();
  },

  handleExportError: (data) => {
    set({
      isExporting: false,
      progress: null,
      error: data.error,
    });
  },
}));

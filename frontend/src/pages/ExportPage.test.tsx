import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportPage } from './ExportPage';
import { useExportStore } from '../stores/exportStore';
import { isElectron } from '../utils/electron';

// Mock the stores
vi.mock('../stores/exportStore', () => ({
  useExportStore: vi.fn(),
}));

// Mock the socket hook
vi.mock('../hooks/useSocket', () => ({
  useSocket: vi.fn(),
}));

// Mock the electron utilities
const mockSelectFolder = vi.fn();
vi.mock('../utils/electron', () => ({
  isElectron: vi.fn(() => false),
  selectFolder: () => mockSelectFolder(),
}));

describe('ExportPage', () => {
  const mockStore = {
    destinationPath: '',
    exportMode: 'album' as const,
    items: [],
    selectedIds: new Set<string>(),
    isLoading: false,
    isCheckingStatus: false,
    isExporting: false,
    progress: null,
    error: null,
    includeArtwork: true,
    includeM3U: true,
    lastExportResult: null,
    setDestinationPath: vi.fn(),
    setExportMode: vi.fn(),
    fetchItems: vi.fn(),
    checkStatus: vi.fn(),
    toggleSelection: vi.fn(),
    selectAll: vi.fn(),
    selectNone: vi.fn(),
    selectNotExported: vi.fn(),
    setIncludeArtwork: vi.fn(),
    setIncludeM3U: vi.fn(),
    startExport: vi.fn(),
    handleExportStarted: vi.fn(),
    handleExportProgress: vi.fn(),
    handleExportCompleted: vi.fn(),
    handleExportError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExportStore).mockReturnValue(mockStore);
    vi.mocked(isElectron).mockReturnValue(false);
    mockSelectFolder.mockReset();
  });

  it('should render page title and subtitle', () => {
    render(<ExportPage />);

    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Export your music to a local folder')).toBeInTheDocument();
  });

  it('should render destination path input', () => {
    render(<ExportPage />);

    const input = screen.getByPlaceholderText('/path/to/export/folder');
    expect(input).toBeInTheDocument();
  });

  it('should update destination path on input change', () => {
    render(<ExportPage />);

    const input = screen.getByPlaceholderText('/path/to/export/folder');
    fireEvent.change(input, { target: { value: '/my/export/path' } });

    expect(mockStore.setDestinationPath).toHaveBeenCalledWith('/my/export/path');
  });

  it('should render export mode tabs', () => {
    render(<ExportPage />);

    expect(screen.getByText('By Album')).toBeInTheDocument();
    expect(screen.getByText('By Artist')).toBeInTheDocument();
    expect(screen.getByText('By Playlist')).toBeInTheDocument();
    expect(screen.getByText('All Songs')).toBeInTheDocument();
  });

  it('should change export mode when tab is clicked', () => {
    render(<ExportPage />);

    const artistTab = screen.getByText('By Artist');
    fireEvent.click(artistTab);

    expect(mockStore.setExportMode).toHaveBeenCalledWith('artist');
  });

  it('should show active tab styling for current mode', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      exportMode: 'artist' as const,
    });

    render(<ExportPage />);

    const artistTab = screen.getByText('By Artist');
    expect(artistTab).toHaveClass('active');
  });

  it('should render selection control buttons', () => {
    render(<ExportPage />);

    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Select None')).toBeInTheDocument();
    expect(screen.getByText('Select Not Exported')).toBeInTheDocument();
  });

  it('should call selectAll when button is clicked', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      items: [{ id: '1', name: 'Album 1', trackCount: 5, coverMediaId: null }],
    });

    render(<ExportPage />);

    fireEvent.click(screen.getByText('Select All'));
    expect(mockStore.selectAll).toHaveBeenCalled();
  });

  it('should call selectNone when button is clicked', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      selectedIds: new Set(['1']),
    });

    render(<ExportPage />);

    fireEvent.click(screen.getByText('Select None'));
    expect(mockStore.selectNone).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      isLoading: true,
    });

    render(<ExportPage />);

    expect(screen.getByText('Loading items...')).toBeInTheDocument();
  });

  it('should show checking status state', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      isCheckingStatus: true,
    });

    render(<ExportPage />);

    expect(screen.getByText('Checking export status...')).toBeInTheDocument();
  });

  it('should show empty state when no items', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      items: [],
      isLoading: false,
    });

    render(<ExportPage />);

    expect(screen.getByText('No items found for this export mode.')).toBeInTheDocument();
  });

  it('should render items when available', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      items: [
        { id: '1', name: 'Album 1', trackCount: 5, coverMediaId: null },
        { id: '2', name: 'Album 2', trackCount: 10, coverMediaId: null },
      ],
    });

    render(<ExportPage />);

    expect(screen.getByText('Album 1')).toBeInTheDocument();
    expect(screen.getByText('Album 2')).toBeInTheDocument();
  });

  it('should show error message when error exists', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      error: 'Something went wrong',
    });

    render(<ExportPage />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show success message after export', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      lastExportResult: {
        totalExported: 10,
        totalSkipped: 2,
        exportedFiles: [],
      },
    });

    render(<ExportPage />);

    expect(screen.getByText(/Exported 10 files/)).toBeInTheDocument();
    expect(screen.getByText(/2 skipped/)).toBeInTheDocument();
  });

  it('should show progress during export', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      isExporting: true,
      progress: {
        current: 5,
        total: 10,
        currentFile: 'Song 5.opus',
        percentage: 50,
      },
    });

    render(<ExportPage />);

    expect(screen.getByText(/Exporting: Song 5.opus/)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('5 of 10 files')).toBeInTheDocument();
  });

  it('should disable export button when no path or selection', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      destinationPath: '',
      selectedIds: new Set(),
    });

    render(<ExportPage />);

    const exportButton = screen.getByRole('button', { name: /^export selected$/i });
    expect(exportButton).toBeDisabled();
  });

  it('should enable export button with path and selection', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      destinationPath: '/export/path',
      selectedIds: new Set(['1']),
    });

    render(<ExportPage />);

    const exportButton = screen.getByRole('button', { name: /export 1 item/i });
    expect(exportButton).not.toBeDisabled();
  });

  it('should show selection count in button', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      destinationPath: '/export/path',
      selectedIds: new Set(['1', '2', '3']),
    });

    render(<ExportPage />);

    expect(screen.getByText(/Export 3 Items/)).toBeInTheDocument();
  });

  it('should call startExport when export button is clicked', async () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      destinationPath: '/export/path',
      selectedIds: new Set(['1']),
    });

    render(<ExportPage />);

    const exportButton = screen.getByRole('button', { name: /export 1 item/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockStore.startExport).toHaveBeenCalled();
    });
  });

  it('should render include artwork checkbox', () => {
    render(<ExportPage />);

    expect(screen.getByLabelText(/include artwork/i)).toBeInTheDocument();
  });

  it('should render generate M3U checkbox', () => {
    render(<ExportPage />);

    expect(screen.getByLabelText(/generate m3u playlist/i)).toBeInTheDocument();
  });

  it('should call setIncludeArtwork when checkbox is toggled', () => {
    render(<ExportPage />);

    const checkbox = screen.getByLabelText(/include artwork/i);
    fireEvent.click(checkbox);

    expect(mockStore.setIncludeArtwork).toHaveBeenCalledWith(false);
  });

  it('should show selection summary', () => {
    vi.mocked(useExportStore).mockReturnValue({
      ...mockStore,
      items: [
        { id: '1', name: 'Album 1', trackCount: 5, coverMediaId: null },
        { id: '2', name: 'Album 2', trackCount: 10, coverMediaId: null },
      ],
      selectedIds: new Set(['1']),
    });

    render(<ExportPage />);

    expect(screen.getByText('1 of 2 selected')).toBeInTheDocument();
  });

  it('should fetch items on mount', () => {
    render(<ExportPage />);

    expect(mockStore.fetchItems).toHaveBeenCalled();
  });

  describe('folder picker', () => {
    it('should not show Browse button when not in Electron', () => {
      vi.mocked(isElectron).mockReturnValue(false);
      render(<ExportPage />);

      expect(screen.queryByRole('button', { name: /browse/i })).not.toBeInTheDocument();
    });

    it('should show Browse button when in Electron', () => {
      vi.mocked(isElectron).mockReturnValue(true);
      render(<ExportPage />);

      expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
    });

    it('should call selectFolder and set path when Browse is clicked', async () => {
      vi.mocked(isElectron).mockReturnValue(true);
      mockSelectFolder.mockResolvedValue('/selected/folder/path');

      render(<ExportPage />);

      const browseButton = screen.getByRole('button', { name: /browse/i });
      fireEvent.click(browseButton);

      await waitFor(() => {
        expect(mockSelectFolder).toHaveBeenCalled();
        expect(mockStore.setDestinationPath).toHaveBeenCalledWith('/selected/folder/path');
      });
    });

    it('should not set path when folder selection is cancelled', async () => {
      vi.mocked(isElectron).mockReturnValue(true);
      mockSelectFolder.mockResolvedValue(null);

      render(<ExportPage />);

      const browseButton = screen.getByRole('button', { name: /browse/i });
      fireEvent.click(browseButton);

      await waitFor(() => {
        expect(mockSelectFolder).toHaveBeenCalled();
      });

      expect(mockStore.setDestinationPath).not.toHaveBeenCalled();
    });
  });
});

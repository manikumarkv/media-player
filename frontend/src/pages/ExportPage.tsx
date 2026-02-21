import { useEffect } from 'react';
import { useExportStore } from '../stores/exportStore';
import { useSocket } from '../hooks/useSocket';
import { ExportItemCard } from '../components/Export';
import { ExportIcon, FolderIcon } from '../components/Icons';
import { isElectron, selectFolder } from '../utils/electron';
import type { ExportMode } from '../api/client';
import './Pages.css';

const EXPORT_MODES: { value: ExportMode; label: string }[] = [
  { value: 'album', label: 'By Album' },
  { value: 'artist', label: 'By Artist' },
  { value: 'playlist', label: 'By Playlist' },
  { value: 'all', label: 'All Songs' },
];

export function ExportPage() {
  const {
    destinationPath,
    exportMode,
    items,
    selectedIds,
    isLoading,
    isCheckingStatus,
    isExporting,
    progress,
    error,
    includeArtwork,
    includeM3U,
    lastExportResult,
    setDestinationPath,
    setExportMode,
    fetchItems,
    checkStatus,
    toggleSelection,
    selectAll,
    selectNone,
    selectNotExported,
    setIncludeArtwork,
    setIncludeM3U,
    startExport,
    handleExportStarted,
    handleExportProgress,
    handleExportCompleted,
    handleExportError,
  } = useExportStore();

  // Set up socket listeners for export events
  useSocket({
    onExportStarted: handleExportStarted,
    onExportProgress: handleExportProgress,
    onExportCompleted: handleExportCompleted,
    onExportError: handleExportError,
  });

  // Fetch items on mount and when mode changes
  useEffect(() => {
    void fetchItems();
  }, [fetchItems, exportMode]);

  // Check status when destination path changes
  useEffect(() => {
    if (destinationPath && items.length > 0) {
      void checkStatus();
    }
  }, [destinationPath, items, checkStatus]);

  const handleExport = async () => {
    await startExport();
  };

  const canExport = destinationPath && selectedIds.size > 0 && !isExporting;

  return (
    <div className="page export-page">
      <header className="page-header">
        <h1 className="page-title">Export</h1>
        <p className="page-subtitle">Export your music to a local folder</p>
      </header>

      {/* Export Settings */}
      <section className="export-settings">
        <div className="export-settings-row">
          <div className="export-field">
            <label htmlFor="destination-path" className="export-label">
              Destination Folder
            </label>
            <div className="export-input-group">
              <input
                id="destination-path"
                type="text"
                value={destinationPath}
                onChange={(e) => setDestinationPath(e.target.value)}
                placeholder="/path/to/export/folder"
                className="export-input"
              />
              {isElectron() && (
                <button
                  type="button"
                  className="browse-button"
                  onClick={async () => {
                    const path = await selectFolder();
                    if (path) {
                      setDestinationPath(path);
                    }
                  }}
                  aria-label="Browse for folder"
                >
                  <FolderIcon size={18} />
                  <span>Browse</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="export-settings-row">
          <div className="export-field">
            <label className="export-label">Export Mode</label>
            <div className="export-mode-tabs">
              {EXPORT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  className={`export-mode-tab ${exportMode === mode.value ? 'active' : ''}`}
                  onClick={() => setExportMode(mode.value)}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="export-settings-row options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeArtwork}
              onChange={(e) => setIncludeArtwork(e.target.checked)}
            />
            <span>Include artwork</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeM3U}
              onChange={(e) => setIncludeM3U(e.target.checked)}
            />
            <span>Generate M3U playlist</span>
          </label>
        </div>
      </section>

      {/* Selection Controls */}
      <section className="export-controls">
        <div className="selection-buttons">
          <button
            type="button"
            className="selection-button"
            onClick={selectAll}
            disabled={items.length === 0}
          >
            Select All
          </button>
          <button
            type="button"
            className="selection-button"
            onClick={selectNone}
            disabled={selectedIds.size === 0}
          >
            Select None
          </button>
          <button
            type="button"
            className="selection-button"
            onClick={selectNotExported}
            disabled={items.length === 0}
          >
            Select Not Exported
          </button>
        </div>

        <div className="export-summary">
          {selectedIds.size > 0 && (
            <span>{String(selectedIds.size)} of {String(items.length)} selected</span>
          )}
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <div className="export-error">
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {lastExportResult && !isExporting && (
        <div className="export-success">
          <p>
            Exported {String(lastExportResult.totalExported)} files
            {lastExportResult.totalSkipped > 0 && ` (${String(lastExportResult.totalSkipped)} skipped)`}
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {isExporting && progress && (
        <div className="export-progress">
          <div className="export-progress-header">
            <span>Exporting: {progress.currentFile}</span>
            <span>{String(progress.percentage)}%</span>
          </div>
          <div className="export-progress-bar">
            <div
              className="export-progress-fill"
              style={{ width: `${String(progress.percentage)}%` }}
            />
          </div>
          <p className="export-progress-count">
            {String(progress.current)} of {String(progress.total)} files
          </p>
        </div>
      )}

      {/* Items Grid */}
      <section className="export-items">
        {isLoading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading items...</span>
          </div>
        ) : isCheckingStatus ? (
          <div className="loading">
            <div className="spinner small" />
            <span>Checking export status...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="export-empty">
            <p>No items found for this export mode.</p>
          </div>
        ) : (
          <div className="export-items-grid">
            {items.map((item) => (
              <ExportItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                isExported={false}
                onToggle={() => toggleSelection(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Export Button */}
      <section className="export-action">
        <button
          type="button"
          className="export-button primary"
          onClick={() => void handleExport()}
          disabled={!canExport}
        >
          <ExportIcon size={20} />
          {isExporting
            ? 'Exporting...'
            : selectedIds.size > 0
              ? `Export ${String(selectedIds.size)} ${selectedIds.size === 1 ? 'Item' : 'Items'}`
              : 'Export Selected'}
        </button>
      </section>
    </div>
  );
}

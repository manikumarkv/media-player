import { useEffect } from 'react';
import { useLibraryStore } from '../stores/libraryStore';
import { MediaGrid, MediaList, SearchBar } from '../components/Library';
import './Pages.css';

export function LibraryPage() {
  const {
    media,
    isLoading,
    error,
    searchQuery,
    viewMode,
    hasMore,
    total,
    fetchMedia,
    loadMore,
    setSearchQuery,
    setViewMode,
  } = useLibraryStore();

  useEffect(() => {
    void fetchMedia(true);
  }, [fetchMedia]);

  return (
    <div className="page library-page">
      <header className="page-header">
        <h1 className="page-title">Library</h1>
        <p className="page-subtitle">{total} tracks</p>
      </header>

      <div className="library-controls">
        <div className="library-controls-left">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search in library..."
          />
        </div>
        <div className="library-controls-right">
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <GridIcon />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-state">
          <h2 className="error-state-title">Something went wrong</h2>
          <p className="error-state-description">{error}</p>
          <button className="retry-button" onClick={() => void fetchMedia(true)}>
            Try Again
          </button>
        </div>
      )}

      {!error && isLoading && media.length === 0 && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {!error && !isLoading && media.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h2 className="empty-state-title">
            {searchQuery ? 'No results found' : 'Your library is empty'}
          </h2>
          <p className="empty-state-description">
            {searchQuery
              ? 'Try a different search term'
              : 'Download some music to get started'}
          </p>
        </div>
      )}

      {!error && media.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <MediaGrid media={media} />
          ) : (
            <MediaList media={media} />
          )}

          {hasMore && (
            <div className="load-more">
              <button
                className="load-more-button"
                onClick={() => void loadMore()}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
    </svg>
  );
}

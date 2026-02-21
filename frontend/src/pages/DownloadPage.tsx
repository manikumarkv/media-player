import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  useDownloadStore,
  type Download,
  type DownloadStatus,
  type PlaylistVideoInfo,
  type GroupBy,
} from '../stores/downloadStore';
import { useSocket } from '../hooks/useSocket';
import {
  DownloadIcon,
  CloseIcon,
  DeleteIcon,
  QueueIcon,
} from '../components/Icons';
import './Pages.css';

type UrlType = 'video' | 'playlist' | 'invalid';

export function DownloadPage() {
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<UrlType>('invalid');

  const {
    downloads,
    currentPreview,
    currentPlaylistPreview,
    isLoading,
    isLoadingPreview,
    isLoadingPlaylistPreview,
    error,
    selectedVideoIds,
    groupBy,
    createPlaylist,
    playlistName,
    fetchDownloads,
    getVideoInfo,
    getPlaylistInfo,
    startDownload,
    startPlaylistDownload,
    cancelDownload,
    retryDownload,
    deleteDownload,
    clearPreview,
    toggleVideoSelection,
    selectAllVideos,
    selectNoneVideos,
    setGroupBy,
    setCreatePlaylist,
    setPlaylistName,
    initializeSelectionFromPlaylist,
    handleDownloadStarted,
    handleDownloadProgress,
    handleDownloadCompleted,
    handleDownloadError,
    handleDownloadCancelled,
  } = useDownloadStore();

  // Set up socket listeners
  useSocket({
    onDownloadStarted: handleDownloadStarted,
    onDownloadProgress: handleDownloadProgress,
    onDownloadCompleted: handleDownloadCompleted,
    onDownloadError: handleDownloadError,
    onDownloadCancelled: handleDownloadCancelled,
  });

  useEffect(() => {
    void fetchDownloads();
  }, [fetchDownloads]);

  // Initialize selection when playlist preview is loaded
  useEffect(() => {
    if (currentPlaylistPreview) {
      initializeSelectionFromPlaylist();
    }
  }, [currentPlaylistPreview, initializeSelectionFromPlaylist]);

  const detectUrlType = useCallback((value: string): UrlType => {
    // Playlist URL patterns (including music.youtube.com)
    const playlistRegex =
      /^(https?:\/\/)?(www\.|music\.)?youtube\.com\/(playlist\?list=|watch\?.*list=)[\w-]+/;
    // Video URL patterns (excluding those with list parameter that are not playlist pages)
    const videoRegex =
      /^(https?:\/\/)?(www\.|music\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[\w-]+/;

    if (playlistRegex.test(value)) {
      return 'playlist';
    }
    if (videoRegex.test(value)) {
      return 'video';
    }
    return 'invalid';
  }, []);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      const type = detectUrlType(value);
      setUrlType(type);

      if (type === 'video') {
        void getVideoInfo(value);
      } else if (type === 'playlist') {
        void getPlaylistInfo(value);
      } else {
        clearPreview();
      }
    },
    [detectUrlType, getVideoInfo, getPlaylistInfo, clearPreview]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlType === 'invalid') {
      return;
    }

    if (urlType === 'playlist') {
      await startPlaylistDownload(url);
    } else {
      await startDownload(url);
    }
    setUrl('');
    setUrlType('invalid');
  };

  const isValidUrl = urlType !== 'invalid';
  const isLoadingAnyPreview = isLoadingPreview || isLoadingPlaylistPreview;

  const activeDownloads = downloads.filter(
    (d) => d.status === 'PENDING' || d.status === 'DOWNLOADING' || d.status === 'PROCESSING'
  );
  const completedDownloads = downloads.filter((d) => d.status === 'COMPLETED');
  const failedDownloads = downloads.filter(
    (d) => d.status === 'FAILED' || d.status === 'CANCELLED'
  );

  // Group videos based on groupBy selection
  const groupedVideos = useMemo(() => {
    if (!currentPlaylistPreview) {
      return new Map<string, PlaylistVideoInfo[]>();
    }

    const videos = currentPlaylistPreview.videos;

    if (groupBy === 'default') {
      return new Map([['All Videos', videos]]);
    }

    const groups = new Map<string, PlaylistVideoInfo[]>();
    for (const video of videos) {
      // For artist grouping, we don't have artist metadata, so use channel as proxy
      // For album, we would need metadata which yt-dlp may not provide
      const key = groupBy === 'artist' ? 'By Artist' : 'By Album';
      const groupKey = key === 'By Artist' ? (currentPlaylistPreview.channel || 'Unknown Artist') : 'Unknown Album';

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      const groupVideos = groups.get(groupKey);
      if (groupVideos) {
        groupVideos.push(video);
      }
    }

    return groups;
  }, [currentPlaylistPreview, groupBy]);

  const canDownloadPlaylist = currentPlaylistPreview && selectedVideoIds.size > 0;

  return (
    <div className="page download-page">
      <header className="page-header">
        <h1 className="page-title">Download</h1>
        <p className="page-subtitle">Download music from YouTube</p>
      </header>

      <section className="download-section">
        <form onSubmit={(e) => void handleSubmit(e)} className="download-form">
          <div className="url-input-container">
            <YouTubeIcon />
            <input
              type="text"
              value={url}
              onChange={(e) => {
                handleUrlChange(e.target.value);
              }}
              placeholder="Paste YouTube URL here..."
              className="url-input"
            />
            {url && (
              <button
                type="button"
                className="clear-button"
                onClick={() => {
                  handleUrlChange('');
                }}
                aria-label="Clear URL"
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>

          {!currentPlaylistPreview && (
            <button
              type="submit"
              className="download-button"
              disabled={!isValidUrl || isLoadingAnyPreview}
            >
              <DownloadIcon size={20} />
              {urlType === 'playlist' ? 'Download Playlist' : 'Download'}
            </button>
          )}
        </form>

        {url && !isValidUrl && (
          <p className="url-hint error">Please enter a valid YouTube URL or playlist</p>
        )}

        {error && <p className="url-hint error">{error}</p>}

        {isLoadingAnyPreview && (
          <div className="preview-loading">
            <div className="spinner small" />
            <span>Loading {urlType === 'playlist' ? 'playlist' : 'video'} info...</span>
          </div>
        )}

        {currentPreview && (
          <div className="video-preview">
            <img
              src={currentPreview.thumbnail}
              alt={currentPreview.title}
              className="preview-thumbnail"
            />
            <div className="preview-info">
              <h3 className="preview-title">{currentPreview.title}</h3>
              <p className="preview-channel">{currentPreview.channel}</p>
              <p className="preview-duration">{formatDuration(currentPreview.duration)}</p>
            </div>
          </div>
        )}

        {currentPlaylistPreview && (
          <div className="playlist-preview">
            <div className="playlist-preview-header">
              <QueueIcon size={48} />
              <div className="preview-info">
                <h3 className="preview-title">{currentPlaylistPreview.title}</h3>
                <p className="preview-channel">{currentPlaylistPreview.channel}</p>
                <p className="preview-meta">
                  {currentPlaylistPreview.videoCount} videos •{' '}
                  {formatTotalDuration(currentPlaylistPreview.videos)}
                </p>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="playlist-selection-controls">
              <div className="selection-buttons">
                <button
                  type="button"
                  className="selection-button"
                  onClick={selectAllVideos}
                  aria-label="Select All"
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="selection-button"
                  onClick={selectNoneVideos}
                  aria-label="Select None"
                >
                  Select None
                </button>
              </div>
              <div className="grouping-dropdown">
                <label htmlFor="group-by" className="sr-only">
                  Group by
                </label>
                <select
                  id="group-by"
                  value={groupBy}
                  onChange={(e) => { setGroupBy(e.target.value as GroupBy); }}
                  aria-label="Group by"
                >
                  <option value="default">Default Order</option>
                  <option value="artist">By Artist</option>
                  <option value="album">By Album</option>
                </select>
              </div>
            </div>

            {/* Video List with Checkboxes */}
            <div className="playlist-videos-preview">
              {Array.from(groupedVideos.entries()).map(([groupName, videos]) => (
                <div key={groupName} className="video-group">
                  {groupBy !== 'default' && (
                    <h4 className="video-group-title">{groupName}</h4>
                  )}
                  {videos.map((video, index) => (
                    <div key={video.id} className="playlist-video-item selectable">
                      <input
                        type="checkbox"
                        checked={selectedVideoIds.has(video.id)}
                        onChange={() => { toggleVideoSelection(video.id); }}
                        aria-label={`Select video ${video.title}`}
                        className="video-checkbox"
                      />
                      <span className="video-index">{index + 1}</span>
                      <span className="video-title">{video.title}</span>
                      <span className="video-duration">{formatDuration(video.duration)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Playlist Creation Option */}
            <div className="playlist-creation-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={createPlaylist}
                  onChange={(e) => { setCreatePlaylist(e.target.checked); }}
                  aria-label="Create playlist in app"
                />
                <span>Create playlist in app</span>
              </label>
              {createPlaylist && (
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => { setPlaylistName(e.target.value); }}
                  placeholder="Playlist name"
                  className="playlist-name-input"
                />
              )}
            </div>

            {/* Download Button */}
            <button
              type="button"
              className="download-button playlist-download-button"
              disabled={!canDownloadPlaylist}
              onClick={() => void startPlaylistDownload(url)}
            >
              <DownloadIcon size={20} />
              {selectedVideoIds.size > 0
                ? `Download Selected (${String(selectedVideoIds.size)}/${String(currentPlaylistPreview.videoCount)})`
                : 'Download Playlist'}
            </button>
          </div>
        )}
      </section>

      {activeDownloads.length > 0 && (
        <section className="downloads-section">
          <h2>Active Downloads</h2>
          <div className="downloads-list">
            {activeDownloads.map((download) => (
              <DownloadItem
                key={download.id}
                download={download}
                onCancel={() => void cancelDownload(download.id)}
              />
            ))}
          </div>
        </section>
      )}

      {completedDownloads.length > 0 && (
        <section className="downloads-section">
          <h2>Completed</h2>
          <div className="downloads-list">
            {completedDownloads.map((download) => (
              <DownloadItem
                key={download.id}
                download={download}
                onDelete={() => void deleteDownload(download.id)}
              />
            ))}
          </div>
        </section>
      )}

      {failedDownloads.length > 0 && (
        <section className="downloads-section">
          <h2>Failed</h2>
          <div className="downloads-list">
            {failedDownloads.map((download) => (
              <DownloadItem
                key={download.id}
                download={download}
                onRetry={() => void retryDownload(download.id)}
                onDelete={() => void deleteDownload(download.id)}
              />
            ))}
          </div>
        </section>
      )}

      {isLoading && downloads.length === 0 && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && downloads.length === 0 && (
        <div className="empty-downloads">
          <p>No downloads yet. Paste a YouTube URL above to get started.</p>
        </div>
      )}
    </div>
  );
}

interface DownloadItemProps {
  download: Download;
  onCancel?: () => void;
  onRetry?: () => void;
  onDelete?: () => void;
}

function DownloadItem({ download, onCancel, onRetry, onDelete }: DownloadItemProps) {
  const getStatusText = (status: DownloadStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Waiting...';
      case 'DOWNLOADING': {
        let statusText = `Downloading ${String(download.progress)}%`;
        if (download.speed) {
          statusText += ` at ${download.speed}`;
        }
        if (download.eta) {
          statusText += ` - ETA ${download.eta}`;
        }
        return statusText;
      }
      case 'PROCESSING':
        return 'Processing...';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const isActive =
    download.status === 'PENDING' ||
    download.status === 'DOWNLOADING' ||
    download.status === 'PROCESSING';

  return (
    <div className={`download-item ${download.status.toLowerCase()}`}>
      <div className="download-item-info">
        <h4 className="download-item-title">{download.title ?? 'Loading...'}</h4>
        <p className="download-item-status">{getStatusText(download.status)}</p>
        {download.error && <p className="download-item-error">{download.error}</p>}
      </div>

      {isActive && (
        <div className="download-progress-bar">
          <div
            className="download-progress-fill"
            style={{ width: `${String(download.progress)}%` }}
          />
        </div>
      )}

      <div className="download-item-actions">
        {onCancel && isActive && (
          <button className="action-button" onClick={onCancel} aria-label="Cancel download">
            <CancelIcon />
          </button>
        )}
        {onRetry && (
          <button className="action-button" onClick={onRetry} aria-label="Retry download">
            <RetryIcon />
          </button>
        )}
        {onDelete && (
          <button className="action-button" onClick={onDelete} aria-label="Delete download">
            <DeleteIcon size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}

function formatTotalDuration(videos: { duration: number }[]): string {
  const totalSeconds = videos.reduce((sum, v) => sum + v.duration, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${String(hours)}h ${String(mins)}m`;
  }
  return `${String(mins)} min`;
}

// Icons - Keep YouTube icon as it's not in lucide-react
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

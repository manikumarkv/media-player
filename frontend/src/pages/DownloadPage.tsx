import { useState, useEffect, useCallback } from 'react';
import { useDownloadStore, type Download, type DownloadStatus } from '../stores/downloadStore';
import { useSocket } from '../hooks/useSocket';
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
    fetchDownloads,
    getVideoInfo,
    getPlaylistInfo,
    startDownload,
    startPlaylistDownload,
    cancelDownload,
    retryDownload,
    deleteDownload,
    clearPreview,
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
                <ClearIcon />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="download-button"
            disabled={!isValidUrl || isLoadingAnyPreview}
          >
            <DownloadIcon />
            {urlType === 'playlist' ? 'Download Playlist' : 'Download'}
          </button>
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
              <PlaylistIcon />
              <div className="preview-info">
                <h3 className="preview-title">{currentPlaylistPreview.title}</h3>
                <p className="preview-channel">{currentPlaylistPreview.channel}</p>
                <p className="preview-meta">
                  {currentPlaylistPreview.videoCount} videos •{' '}
                  {formatTotalDuration(currentPlaylistPreview.videos)}
                </p>
              </div>
            </div>
            <div className="playlist-videos-preview">
              {currentPlaylistPreview.videos.slice(0, 5).map((video, index) => (
                <div key={video.id} className="playlist-video-item">
                  <span className="video-index">{index + 1}</span>
                  <span className="video-title">{video.title}</span>
                  <span className="video-duration">{formatDuration(video.duration)}</span>
                </div>
              ))}
              {currentPlaylistPreview.videos.length > 5 && (
                <p className="playlist-more">
                  +{currentPlaylistPreview.videos.length - 5} more videos
                </p>
              )}
            </div>
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
      case 'DOWNLOADING':
        return `Downloading ${String(download.progress)}%`;
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
            <DeleteIcon />
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

// Icons
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
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

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

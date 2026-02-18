import type { YouTubeSyncStatus, YouTubeSyncHistory } from '../../../api/client';

interface SyncStatusProps {
  status: YouTubeSyncStatus;
  history: YouTubeSyncHistory[];
  isSyncing: boolean;
  onSync: () => Promise<unknown>;
  onDisconnect: () => Promise<void>;
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return 'Never';
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${String(diffMinutes)} minute${diffMinutes === 1 ? '' : 's'} ago`;
  }
  if (diffHours < 24) {
    return `${String(diffHours)} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  return `${String(diffDays)} day${diffDays === 1 ? '' : 's'} ago`;
}

export function SyncStatus({
  status,
  history,
  isSyncing,
  onSync,
  onDisconnect,
}: SyncStatusProps) {
  return (
    <div className="sync-status">
      <div className="sync-status-header">
        <div className="connection-status">
          <span className="status-indicator connected" />
          <span className="status-text">Connected</span>
          {status.email && (
            <span className="status-email">as {status.email}</span>
          )}
        </div>

        <div className="sync-method">
          via {status.authMethod === 'cookie' ? 'Cookie Upload' : 'Browser Profile'}
        </div>
      </div>

      <div className="sync-info">
        <div className="sync-info-item">
          <span className="sync-info-label">Last sync:</span>
          <span className="sync-info-value">
            {formatRelativeTime(status.lastSyncAt)}
          </span>
        </div>

        {history.length > 0 && (
          <div className="sync-info-item">
            <span className="sync-info-label">Last sync result:</span>
            <span className="sync-info-value">
              {String(history[0].videosDownloaded)} new tracks
              {history[0].videosSkipped > 0 && `, ${String(history[0].videosSkipped)} skipped`}
              {history[0].videosFailed > 0 && `, ${String(history[0].videosFailed)} failed`}
            </span>
          </div>
        )}
      </div>

      <div className="sync-actions">
        <button
          className="button-primary"
          onClick={() => void onSync()}
          disabled={isSyncing}
          aria-label={isSyncing ? 'Syncing' : 'Sync Now'}
        >
          {isSyncing ? (
            <>
              <span className="loading-spinner-small" />
              Syncing...
            </>
          ) : (
            'Sync Now'
          )}
        </button>

        <button
          className="button-danger"
          onClick={() => void onDisconnect()}
          disabled={isSyncing}
          aria-label="Disconnect"
        >
          Disconnect
        </button>
      </div>

      {history.length > 1 && (
        <details className="sync-history">
          <summary>Sync History ({history.length} syncs)</summary>
          <ul className="sync-history-list">
            {history.slice(0, 10).map((item) => (
              <li key={item.id} className="sync-history-item">
                <span className="sync-history-date">
                  {new Date(item.syncedAt).toLocaleDateString()}
                </span>
                <span className="sync-history-stats">
                  Found: {String(item.videosFound)}, Downloaded: {String(item.videosDownloaded)},
                  Skipped: {String(item.videosSkipped)}, Failed: {String(item.videosFailed)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

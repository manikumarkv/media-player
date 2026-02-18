import { useEffect, useState } from 'react';
import { useYoutubeSyncStore } from '../../../stores/youtubeSyncStore';
import { AuthMethodSelector } from './AuthMethodSelector';
import { CookieUploadFlow } from './CookieUploadFlow';
import { SyncStatus } from './SyncStatus';
import { SyncSettings } from './SyncSettings';
import './YouTubeSync.css';

type AuthMethod = 'cookie' | null;

export function YouTubeSyncSettings() {
  const {
    status,
    history,
    isLoading,
    isSyncing,
    error,
    fetchStatus,
    fetchHistory,
    authWithCookies,
    sync,
    disconnect,
    updateSettings,
    clearError,
  } = useYoutubeSyncStore();

  const [selectedAuthMethod, setSelectedAuthMethod] = useState<AuthMethod>(null);

  useEffect(() => {
    void fetchStatus();
    void fetchHistory();
  }, [fetchStatus, fetchHistory]);

  const handleAuthSuccess = () => {
    setSelectedAuthMethod(null);
  };

  const handleBack = () => {
    setSelectedAuthMethod(null);
    clearError();
  };

  const isConnected = status?.isConnected ?? false;

  // Loading state
  if (isLoading && !status) {
    return (
      <div className="youtube-sync-settings">
        <div className="youtube-sync-loading">
          <div className="loading-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-sync-settings">
      <h2 className="youtube-sync-title">YouTube Sync</h2>

      {/* Error display */}
      {error && (
        <div className="youtube-sync-error">
          <span>{error}</span>
          <button onClick={clearError} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Connected state */}
      {isConnected && status ? (
        <div className="youtube-sync-connected">
          <SyncStatus
            status={status}
            history={history}
            isSyncing={isSyncing}
            onSync={sync}
            onDisconnect={disconnect}
          />

          <SyncSettings
            settings={{
              autoSync: status.autoSync,
              syncInterval: status.syncInterval,
              filterMusic: status.filterMusic,
              maxDuration: status.maxDuration,
            }}
            onUpdateSettings={updateSettings}
            isLoading={isLoading}
          />
        </div>
      ) : (
        <>
          {/* Auth method selection */}
          {!selectedAuthMethod && (
            <AuthMethodSelector
              onSelectMethod={setSelectedAuthMethod}
            />
          )}

          {/* Cookie upload flow */}
          {selectedAuthMethod === 'cookie' && (
            <CookieUploadFlow
              onAuth={authWithCookies}
              onSuccess={handleAuthSuccess}
              onBack={handleBack}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}

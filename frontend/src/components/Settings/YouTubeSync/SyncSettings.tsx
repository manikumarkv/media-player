import type { YouTubeSyncSettings as Settings } from '../../../api/client';

interface SyncSettingsProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => Promise<void>;
  isLoading: boolean;
}

export function SyncSettings({
  settings,
  onUpdateSettings,
  isLoading,
}: SyncSettingsProps) {
  const handleAutoSyncChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void onUpdateSettings({ autoSync: e.target.checked });
  };

  const handleSyncIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void onUpdateSettings({ syncInterval: parseInt(e.target.value, 10) });
  };

  const handleFilterMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void onUpdateSettings({ filterMusic: e.target.checked });
  };

  const handleMaxDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void onUpdateSettings({ maxDuration: parseInt(e.target.value, 10) });
  };

  return (
    <div className="sync-settings">
      <h3>Sync Settings</h3>

      <div className="setting-item">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.autoSync}
            onChange={handleAutoSyncChange}
            disabled={isLoading}
          />
          <span>Auto-sync liked videos</span>
        </label>
        <p className="setting-description">
          Automatically sync your YouTube liked videos at regular intervals
        </p>
      </div>

      {settings.autoSync && (
        <div className="setting-item">
          <label className="setting-label">
            Sync interval
            <select
              value={settings.syncInterval}
              onChange={handleSyncIntervalChange}
              disabled={isLoading}
            >
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
              <option value="120">Every 2 hours</option>
              <option value="360">Every 6 hours</option>
              <option value="720">Every 12 hours</option>
              <option value="1440">Every 24 hours</option>
            </select>
          </label>
        </div>
      )}

      <div className="setting-item">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={settings.filterMusic}
            onChange={handleFilterMusicChange}
            disabled={isLoading}
          />
          <span>Only download music videos</span>
        </label>
        <p className="setting-description">
          Skip videos that are not categorized as "Music" on YouTube
        </p>
      </div>

      <div className="setting-item">
        <label className="setting-label">
          Maximum video duration
          <select
            value={settings.maxDuration}
            onChange={handleMaxDurationChange}
            disabled={isLoading}
          >
            <option value="180">3 minutes</option>
            <option value="300">5 minutes</option>
            <option value="420">7 minutes</option>
            <option value="600">10 minutes</option>
            <option value="900">15 minutes</option>
            <option value="1800">30 minutes</option>
            <option value="3600">1 hour</option>
            <option value="99999">No limit</option>
          </select>
        </label>
        <p className="setting-description">
          Skip videos longer than this duration
        </p>
      </div>
    </div>
  );
}

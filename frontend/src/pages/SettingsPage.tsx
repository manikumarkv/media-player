import { YouTubeSyncSettings } from '../components/Settings/YouTubeSync/YouTubeSyncSettings';
import './Pages.css';

export function SettingsPage() {
  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your media player</p>
      </header>

      <div className="settings-sections">
        <section className="settings-section">
          <h2 className="section-title">YouTube Sync</h2>
          <p className="section-description">
            Connect your YouTube account to automatically sync your liked videos
          </p>
          <YouTubeSyncSettings />
        </section>
      </div>
    </div>
  );
}

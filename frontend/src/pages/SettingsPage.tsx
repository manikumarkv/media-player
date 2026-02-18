import { YouTubeSyncSettings } from '../components/Settings/YouTubeSync/YouTubeSyncSettings';
import { KeyboardShortcutsSettings } from '../components/Settings/KeyboardShortcuts';
import { LegalSettings } from '../components/Legal';
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
          <h2 className="section-title">Keyboard Shortcuts</h2>
          <p className="section-description">Customize keyboard shortcuts for player controls</p>
          <KeyboardShortcutsSettings />
        </section>

        <section className="settings-section">
          <h2 className="section-title">YouTube Sync</h2>
          <p className="section-description">
            Connect your YouTube account to automatically sync your liked videos
          </p>
          <YouTubeSyncSettings />
        </section>

        <section className="settings-section">
          <h2 className="section-title">Legal</h2>
          <p className="section-description">
            Manage your Terms of Service consent and view legal documents
          </p>
          <LegalSettings />
        </section>
      </div>
    </div>
  );
}

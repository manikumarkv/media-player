import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Common';
import { AddToPlaylistModal } from './components/Playlist';
import { FirstRunModal } from './components/Legal';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
import { DownloadPage } from './pages/DownloadPage';
import { SettingsPage } from './pages/SettingsPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import { LegalConsent } from './utils/legal';
import './styles/global.css';

export function App() {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => LegalConsent.hasAccepted());

  // Show ToS modal if user hasn't accepted terms
  if (!hasAcceptedTerms) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route
            path="*"
            element={
              <FirstRunModal
                onAccept={() => {
                  setHasAcceptedTerms(true);
                }}
              />
            }
          />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/liked" element={<LikedSongsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="/download" element={<DownloadPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
          </Routes>
        </Layout>
        <AddToPlaylistModal />
      </BrowserRouter>
    </ToastProvider>
  );
}

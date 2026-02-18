import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Common';
import { AddToPlaylistModal } from './components/Playlist';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
import { DownloadPage } from './pages/DownloadPage';
import { SettingsPage } from './pages/SettingsPage';
import { DisclaimerPage } from './pages/DisclaimerPage';
import './styles/global.css';

export function App() {
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

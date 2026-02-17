import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type Media, type PlayHistory } from '../api/client';
import { MediaGrid } from '../components/Library/MediaGrid';
import './Pages.css';

export function HomePage() {
  const [recentMedia, setRecentMedia] = useState<Media[]>([]);
  const [mostPlayed, setMostPlayed] = useState<Media[]>([]);
  const [recentHistory, setRecentHistory] = useState<PlayHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [recentRes, playedRes, historyRes] = await Promise.all([
          apiClient.media.recent(6),
          apiClient.media.mostPlayed(6),
          apiClient.history.recent(6),
        ]);

        setRecentMedia(recentRes.data);
        setMostPlayed(playedRes.data);
        setRecentHistory(historyRes.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="page home-page">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const hasContent = recentMedia.length > 0 || mostPlayed.length > 0 || recentHistory.length > 0;

  return (
    <div className="page home-page">
      <header className="page-header">
        <h1 className="page-title">Welcome Back</h1>
        <p className="page-subtitle">Pick up where you left off</p>
      </header>

      {!hasContent ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <h2 className="empty-state-title">Your library is empty</h2>
          <p className="empty-state-description">
            Start by downloading some music from YouTube
          </p>
          <Link to="/download" className="primary-button">
            Download Music
          </Link>
        </div>
      ) : (
        <>
          {recentHistory.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recently Played</h2>
                <Link to="/history" className="section-link">
                  See all
                </Link>
              </div>
              <MediaGrid
                media={recentHistory.map((h) => h.media)}
                compact
              />
            </section>
          )}

          {recentMedia.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Recently Added</h2>
                <Link to="/library" className="section-link">
                  See all
                </Link>
              </div>
              <MediaGrid media={recentMedia} compact />
            </section>
          )}

          {mostPlayed.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2 className="section-title">Most Played</h2>
              </div>
              <MediaGrid media={mostPlayed} compact />
            </section>
          )}
        </>
      )}
    </div>
  );
}

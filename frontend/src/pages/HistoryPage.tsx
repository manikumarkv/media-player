import { useEffect, useState } from 'react';
import { apiClient, type PlayHistory } from '../api/client';
import { MediaList } from '../components/Library';
import { type Media } from '../api/client';
import './Pages.css';

export function HistoryPage() {
  const [history, setHistory] = useState<PlayHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.history.list({ limit: 100 });
        setHistory(response.data);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    try {
      await apiClient.history.clear();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // Group by date
  const groupedHistory = history.reduce<Record<string, PlayHistory[]>>((acc, item) => {
    const date = new Date(item.playedAt).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  // Convert history to media array for MediaList
  const historyToMedia = (items: PlayHistory[]): Media[] =>
    items.map((h) => h.media);

  return (
    <div className="page history-page">
      <header className="page-header">
        <div className="header-row">
          <div>
            <h1 className="page-title">Recently Played</h1>
            <p className="page-subtitle">{history.length} plays</p>
          </div>
          {history.length > 0 && (
            <button
              className="clear-history-button"
              onClick={() => void handleClearHistory()}
            >
              Clear History
            </button>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <HistoryIcon />
          </div>
          <h2 className="empty-state-title">No listening history yet</h2>
          <p className="empty-state-description">
            Your recently played tracks will appear here
          </p>
        </div>
      )}

      {!isLoading && history.length > 0 && (
        <div className="history-groups">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <section key={date} className="history-group">
              <h2 className="history-date">{date}</h2>
              <MediaList media={historyToMedia(items)} showHeader={false} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
    </svg>
  );
}

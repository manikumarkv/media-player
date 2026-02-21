import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, type Media } from '../api/client';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { MediaList } from '../components/Library';
import { AlbumIcon, ArrowLeftIcon, PlayIcon } from '../components/Icons';
import './Pages.css';

export function AlbumDetailPage() {
  const { albumName } = useParams<{ albumName: string }>();
  const decodedAlbumName = albumName ? decodeURIComponent(albumName) : '';
  const [tracks, setTracks] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { setQueue, setCurrentTrack, play } = usePlayerStore();

  useEffect(() => {
    const fetchTracks = async () => {
      if (!decodedAlbumName) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.media.albumTracks(decodedAlbumName);
        setTracks(response.data);
      } catch (error) {
        console.error('Failed to fetch album tracks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTracks();
  }, [decodedAlbumName]);

  const handlePlayAll = () => {
    if (!tracks.length) {
      return;
    }

    const queue: Track[] = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist ?? undefined,
      album: track.album ?? undefined,
      duration: track.duration,
      filePath: track.filePath,
      thumbnailPath: track.thumbnailPath ?? undefined,
    }));

    setQueue(queue);
    setCurrentTrack(queue[0]);
    play();
  };

  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const artist = tracks[0]?.artist ?? 'Unknown Artist';

  if (isLoading) {
    return (
      <div className="page album-detail-page">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page album-detail-page">
      <Link to="/albums" className="back-link" aria-label="Back to albums">
        <ArrowLeftIcon size={20} />
        <span>Albums</span>
      </Link>

      <header className="album-header">
        <div className="album-cover">
          {tracks[0]?.thumbnailPath ? (
            <img
              src={`/api/v1/media/${tracks[0].id}/thumbnail`}
              alt={decodedAlbumName}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`album-cover-placeholder ${tracks[0]?.thumbnailPath ? 'hidden' : ''}`}>
            <AlbumIcon size={64} />
          </div>
        </div>
        <div className="album-info">
          <span className="page-label">Album</span>
          <h1 className="album-name">{decodedAlbumName}</h1>
          <p className="album-artist">{artist}</p>
          <p className="album-stats">
            {tracks.length} songs • {formatDuration(totalDuration)}
          </p>
        </div>
      </header>

      <div className="album-actions">
        <button
          className="play-all-button"
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          aria-label="Play all"
        >
          <PlayIcon size={28} />
        </button>
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">This album is empty</h2>
          <p className="empty-state-description">No tracks found for this album</p>
        </div>
      ) : (
        <MediaList media={tracks} />
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${String(hours)} hr ${String(minutes)} min`;
  }
  return `${String(minutes)} min`;
}

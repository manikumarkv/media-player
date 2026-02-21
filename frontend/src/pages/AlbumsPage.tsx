import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, type Album } from '../api/client';
import { AlbumIcon } from '../components/Icons';
import './Pages.css';

export function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.media.albums();
        setAlbums(response.data);
      } catch (error) {
        console.error('Failed to fetch albums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAlbums();
  }, []);

  return (
    <div className="page albums-page">
      <header className="page-header">
        <h1 className="page-title">Albums</h1>
      </header>

      {isLoading && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && albums.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <AlbumIcon size={48} />
          </div>
          <h2 className="empty-state-title">No albums yet</h2>
          <p className="empty-state-description">
            Albums will appear here when you download music with album metadata
          </p>
        </div>
      )}

      {!isLoading && albums.length > 0 && (
        <div className="albums-grid">
          {albums.map((album) => (
            <Link
              key={album.name}
              to={`/albums/${encodeURIComponent(album.name)}`}
              className="album-card"
            >
              <div className="album-card-image">
                {album.coverMediaId ? (
                  <img
                    src={`/api/v1/media/${album.coverMediaId}/thumbnail`}
                    alt={album.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`album-card-placeholder ${album.coverMediaId ? 'hidden' : ''}`}>
                  <AlbumIcon size={48} />
                </div>
              </div>
              <div className="album-card-info">
                <h3 className="album-card-name">{album.name}</h3>
                {album.artist && <p className="album-card-artist">{album.artist}</p>}
                <p className="album-card-tracks">{album.trackCount} tracks</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, type PlaylistWithItems } from '../api/client';
import { usePlayerStore, type Track } from '../stores/playerStore';
import { MediaList } from '../components/Library';
import './Pages.css';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { setQueue, setCurrentTrack, play } = usePlayerStore();

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiClient.playlists.get(id);
        setPlaylist(response.data);
        setEditName(response.data.name);
        setEditDescription(response.data.description ?? '');
      } catch (error) {
        console.error('Failed to fetch playlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlaylist();
  }, [id]);

  const handlePlayAll = () => {
    if (!playlist?.items.length) {
      return;
    }

    const tracks: Track[] = playlist.items.map((item) => ({
      id: item.media.id,
      title: item.media.title,
      artist: item.media.artist ?? undefined,
      album: item.media.album ?? undefined,
      duration: item.media.duration,
      filePath: item.media.filePath,
      thumbnailPath: item.media.thumbnailPath ?? undefined,
    }));

    setQueue(tracks);
    setCurrentTrack(tracks[0]);
    play();
  };

  const handleDelete = async () => {
    if (!id || !playlist) {
      return;
    }

    if (!window.confirm(`Delete "${playlist.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiClient.playlists.delete(id);
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) {
      return;
    }

    try {
      const response = await apiClient.playlists.update(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              name: response.data.name,
              description: response.data.description,
            }
          : null
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update playlist:', error);
    }
  };

  const handleRemoveItem = useCallback(
    async (mediaId: string) => {
      if (!id) {
        return;
      }

      try {
        const response = await apiClient.playlists.removeItem(id, mediaId);
        setPlaylist(response.data);
      } catch (error) {
        console.error('Failed to remove item from playlist:', error);
      }
    },
    [id]
  );

  if (isLoading) {
    return (
      <div className="page playlist-detail-page">
        <div className="loading">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="page playlist-detail-page">
        <div className="error-state">
          <h2 className="error-state-title">Playlist not found</h2>
          <button
            className="primary-button"
            onClick={() => {
              navigate('/playlists');
            }}
          >
            Back to Playlists
          </button>
        </div>
      </div>
    );
  }

  const media = playlist.items.map((item) => item.media);
  const totalDuration = media.reduce((sum, m) => sum + m.duration, 0);

  return (
    <div className="page playlist-detail-page">
      <header className="playlist-header">
        <div className="playlist-cover">
          <PlaylistIcon />
        </div>
        <div className="playlist-info">
          <span className="page-label">Playlist</span>
          {isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                }}
                className="edit-name-input"
                placeholder="Playlist name"
              />
              <textarea
                value={editDescription}
                onChange={(e) => {
                  setEditDescription(e.target.value);
                }}
                className="edit-description-input"
                placeholder="Description"
                rows={2}
              />
              <div className="edit-actions">
                <button
                  className="cancel-button"
                  onClick={() => {
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button className="save-button" onClick={() => void handleSaveEdit()}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="playlist-name">{playlist.name}</h1>
              {playlist.description && (
                <p className="playlist-description">{playlist.description}</p>
              )}
              <p className="playlist-stats">
                {playlist.items.length} songs • {formatDuration(totalDuration)}
              </p>
            </>
          )}
        </div>
      </header>

      <div className="playlist-actions">
        <button
          className="play-all-button"
          onClick={handlePlayAll}
          disabled={playlist.items.length === 0}
        >
          <PlayIcon />
        </button>
        {!playlist.isSystem && (
          <>
            <button
              className="action-button"
              onClick={() => {
                setIsEditing(true);
              }}
              aria-label="Edit playlist"
            >
              <EditIcon />
            </button>
            <button
              className="action-button"
              onClick={() => void handleDelete()}
              aria-label="Delete playlist"
            >
              <DeleteIcon />
            </button>
          </>
        )}
      </div>

      {playlist.items.length === 0 ? (
        <div className="empty-state">
          <h2 className="empty-state-title">This playlist is empty</h2>
          <p className="empty-state-description">Add songs from your library</p>
        </div>
      ) : (
        <MediaList
          media={media}
          onRemove={!playlist.isSystem ? (mediaId) => void handleRemoveItem(mediaId) : undefined}
        />
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

function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

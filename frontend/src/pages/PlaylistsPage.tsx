import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlaylistStore } from '../stores/playlistStore';
import './Pages.css';

export function PlaylistsPage() {
  const { playlists, isLoading, fetchPlaylists, createPlaylist } = usePlaylistStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    void fetchPlaylists();
  }, [fetchPlaylists]);

  const handleCreatePlaylist = async (name: string, description?: string) => {
    try {
      await createPlaylist(name, description);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  // Filter out system playlists
  const userPlaylists = playlists.filter((p) => !p.isSystem);

  return (
    <div className="page playlists-page">
      <header className="page-header">
        <div className="header-row">
          <h1 className="page-title">Playlists</h1>
          <button
            className="create-playlist-button"
            onClick={() => {
              setShowCreateModal(true);
            }}
          >
            <PlusIcon />
            New Playlist
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="loading">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && userPlaylists.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <PlaylistIcon />
          </div>
          <h2 className="empty-state-title">Create your first playlist</h2>
          <p className="empty-state-description">Organize your music into playlists</p>
          <button
            className="primary-button"
            onClick={() => {
              setShowCreateModal(true);
            }}
          >
            Create Playlist
          </button>
        </div>
      )}

      {!isLoading && userPlaylists.length > 0 && (
        <div className="playlists-grid">
          {userPlaylists.map((playlist) => (
            <Link key={playlist.id} to={`/playlists/${playlist.id}`} className="playlist-card">
              <div className="playlist-card-image">
                <PlaylistIcon />
              </div>
              <div className="playlist-card-info">
                <h3 className="playlist-card-name">{playlist.name}</h3>
                {playlist.description && (
                  <p className="playlist-card-description">{playlist.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => {
            setShowCreateModal(false);
          }}
          onCreate={handleCreatePlaylist}
        />
      )}
    </div>
  );
}

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

function CreatePlaylistModal({ onClose, onCreate }: CreatePlaylistModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    await onCreate(name.trim(), description.trim() || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <h2 className="modal-title">Create Playlist</h2>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="playlist-name">Name</label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="My Playlist"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="playlist-description">Description (optional)</label>
            <textarea
              id="playlist-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
              placeholder="Add a description"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}

function PlaylistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

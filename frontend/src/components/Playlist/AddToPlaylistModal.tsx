import { useState, useEffect } from 'react';
import { Modal } from '../Common';
import { usePlaylistStore } from '../../stores/playlistStore';
import './Playlist.css';

export function AddToPlaylistModal() {
  const {
    playlists,
    addToPlaylistModal,
    closeAddToPlaylistModal,
    fetchPlaylists,
    addItemToPlaylist,
    createPlaylist,
  } = usePlaylistStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (addToPlaylistModal.isOpen && playlists.length === 0) {
      void fetchPlaylists();
    }
  }, [addToPlaylistModal.isOpen, playlists.length, fetchPlaylists]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!addToPlaylistModal.mediaId) {
      return;
    }

    setAddingToId(playlistId);
    try {
      await addItemToPlaylist(playlistId, addToPlaylistModal.mediaId);
      setSuccessId(playlistId);
      setTimeout(() => {
        closeAddToPlaylistModal();
        setSuccessId(null);
      }, 500);
    } catch {
      // Error handled in store
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !addToPlaylistModal.mediaId) {
      return;
    }

    setIsSubmitting(true);
    try {
      const playlist = await createPlaylist(newPlaylistName.trim());
      await addItemToPlaylist(playlist.id, addToPlaylistModal.mediaId);
      setNewPlaylistName('');
      setIsCreating(false);
      closeAddToPlaylistModal();
    } catch {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCreating(false);
    setNewPlaylistName('');
    closeAddToPlaylistModal();
  };

  // Filter out system playlists
  const userPlaylists = playlists.filter((p) => !p.isSystem);

  return (
    <Modal
      isOpen={addToPlaylistModal.isOpen}
      onClose={handleClose}
      title="Add to Playlist"
      size="small"
    >
      <div className="add-to-playlist-content">
        {isCreating ? (
          <form onSubmit={(e) => void handleCreateAndAdd(e)} className="create-playlist-form">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => {
                setNewPlaylistName(e.target.value);
              }}
              placeholder="Playlist name"
              autoFocus
              className="playlist-name-input"
            />
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setIsCreating(false);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="create-btn"
                disabled={!newPlaylistName.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create & Add'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <button
              className="create-new-playlist-btn"
              onClick={() => {
                setIsCreating(true);
              }}
            >
              <PlusIcon />
              <span>Create New Playlist</span>
            </button>

            {userPlaylists.length > 0 && (
              <div className="playlist-list">
                {userPlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    className={`playlist-item ${successId === playlist.id ? 'success' : ''}`}
                    onClick={() => void handleAddToPlaylist(playlist.id)}
                    disabled={addingToId !== null}
                  >
                    <PlaylistIcon />
                    <span className="playlist-item-name">{playlist.name}</span>
                    {addingToId === playlist.id && (
                      <span className="adding-indicator">Adding...</span>
                    )}
                    {successId === playlist.id && <CheckIcon />}
                  </button>
                ))}
              </div>
            )}

            {userPlaylists.length === 0 && (
              <p className="no-playlists-message">No playlists yet. Create one to get started.</p>
            )}
          </>
        )}
      </div>
    </Modal>
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
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" className="check-icon">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

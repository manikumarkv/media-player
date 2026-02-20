-- SQLite schema for Music Player
-- This file is used to initialize the database on first run

-- Media table
CREATE TABLE IF NOT EXISTS Media (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration INTEGER NOT NULL,
    filePath TEXT NOT NULL UNIQUE,
    thumbnailPath TEXT,
    sourceUrl TEXT,
    sourceId TEXT,
    mimeType TEXT NOT NULL DEFAULT 'audio/mpeg',
    fileSize INTEGER NOT NULL DEFAULT 0,
    isLiked INTEGER NOT NULL DEFAULT 0,
    playCount INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS Media_title_idx ON Media(title);
CREATE INDEX IF NOT EXISTS Media_artist_idx ON Media(artist);
CREATE INDEX IF NOT EXISTS Media_isLiked_idx ON Media(isLiked);
CREATE INDEX IF NOT EXISTS Media_createdAt_idx ON Media(createdAt);

-- Playlist table
CREATE TABLE IF NOT EXISTS Playlist (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    coverPath TEXT,
    isSystem INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS Playlist_name_idx ON Playlist(name);
CREATE INDEX IF NOT EXISTS Playlist_isSystem_idx ON Playlist(isSystem);

-- PlaylistItem table
CREATE TABLE IF NOT EXISTS PlaylistItem (
    id TEXT PRIMARY KEY NOT NULL,
    playlistId TEXT NOT NULL,
    mediaId TEXT NOT NULL,
    position INTEGER NOT NULL,
    addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlistId) REFERENCES Playlist(id) ON DELETE CASCADE,
    FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE,
    UNIQUE(playlistId, mediaId)
);

CREATE INDEX IF NOT EXISTS PlaylistItem_playlistId_position_idx ON PlaylistItem(playlistId, position);

-- PlayHistory table
CREATE TABLE IF NOT EXISTS PlayHistory (
    id TEXT PRIMARY KEY NOT NULL,
    mediaId TEXT NOT NULL,
    playedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS PlayHistory_playedAt_idx ON PlayHistory(playedAt);
CREATE INDEX IF NOT EXISTS PlayHistory_mediaId_idx ON PlayHistory(mediaId);

-- QueueItem table
CREATE TABLE IF NOT EXISTS QueueItem (
    id TEXT PRIMARY KEY NOT NULL,
    mediaId TEXT NOT NULL,
    position INTEGER NOT NULL UNIQUE,
    addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mediaId) REFERENCES Media(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS QueueItem_position_idx ON QueueItem(position);

-- Download table
CREATE TABLE IF NOT EXISTS Download (
    id TEXT PRIMARY KEY NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    progress INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    mediaId TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS Download_status_idx ON Download(status);
CREATE INDEX IF NOT EXISTS Download_createdAt_idx ON Download(createdAt);

-- YouTubeSync table
CREATE TABLE IF NOT EXISTS YouTubeSync (
    id TEXT PRIMARY KEY NOT NULL,
    authMethod TEXT NOT NULL,
    email TEXT,
    isConnected INTEGER NOT NULL DEFAULT 0,
    lastSyncAt DATETIME,
    autoSync INTEGER NOT NULL DEFAULT 1,
    syncInterval INTEGER NOT NULL DEFAULT 60,
    filterMusic INTEGER NOT NULL DEFAULT 1,
    maxDuration INTEGER NOT NULL DEFAULT 600,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS YouTubeSync_isConnected_idx ON YouTubeSync(isConnected);

-- YouTubeSyncHistory table
CREATE TABLE IF NOT EXISTS YouTubeSyncHistory (
    id TEXT PRIMARY KEY NOT NULL,
    syncedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    videosFound INTEGER NOT NULL DEFAULT 0,
    videosDownloaded INTEGER NOT NULL DEFAULT 0,
    videosFailed INTEGER NOT NULL DEFAULT 0,
    videosSkipped INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS YouTubeSyncHistory_syncedAt_idx ON YouTubeSyncHistory(syncedAt);

-- Prisma migrations table (for compatibility)
CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY NOT NULL,
    checksum TEXT NOT NULL,
    finished_at DATETIME,
    migration_name TEXT NOT NULL,
    logs TEXT,
    rolled_back_at DATETIME,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- Insert a dummy migration record to indicate the schema is initialized
INSERT OR IGNORE INTO _prisma_migrations (id, checksum, migration_name, applied_steps_count, finished_at)
VALUES ('init', 'electron-init', 'electron_init_schema', 1, CURRENT_TIMESTAMP);

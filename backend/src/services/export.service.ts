import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../errors/index.js';
import type { Media } from '../types/index.js';

export type ExportMode = 'album' | 'artist' | 'playlist' | 'all';

export interface ExportOptions {
  destinationPath: string;
  mode: ExportMode;
  mediaIds?: string[];
  albumName?: string;
  artistName?: string;
  playlistId?: string;
  includeArtwork: boolean;
  includeM3U: boolean;
  onProgress?: (current: number, total: number, currentFile: string) => void;
}

export interface ExportStatus {
  mediaId: string;
  title: string;
  isExported: boolean;
  exportPath: string | null;
}

export interface ExportableItem {
  id: string;
  name: string;
  artist?: string | null;
  trackCount: number;
  totalDuration?: number;
  coverMediaId: string | null;
}

export interface ExportResult {
  totalExported: number;
  totalSkipped: number;
  exportedFiles: string[];
}

interface M3UTrack {
  title: string;
  artist: string | null;
  duration: number;
  relativePath: string;
}

// Partial media type for buildExportPath
interface MediaForExport {
  id: string;
  title: string;
  artist: string | null;
  album?: string | null;
  filePath: string;
}

// Sanitize filename by removing invalid characters
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get file extension from path
function getExtension(filePath: string): string {
  return path.extname(filePath) || '.opus';
}

// Check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export const exportService = {
  /**
   * Get exportable items grouped by mode
   */
  async getExportableItems(mode: ExportMode): Promise<ExportableItem[]> {
    switch (mode) {
      case 'album':
        return this.getAlbumItems();
      case 'artist':
        return this.getArtistItems();
      case 'playlist':
        return this.getPlaylistItems();
      case 'all':
        return this.getAllSongsItem();
    }
  },

  async getAlbumItems(): Promise<ExportableItem[]> {
    const albumStats = await prisma.media.groupBy({
      by: ['album'],
      where: { album: { not: null } },
      _count: { id: true },
      _sum: { duration: true },
      _min: { artist: true },
      orderBy: { album: 'asc' },
    });

    if (albumStats.length === 0) {
      return [];
    }

    // Get cover media for each album
    const albumNames = albumStats
      .map((a) => a.album)
      .filter((name): name is string => name !== null);
    const coverMedia = await prisma.media.findMany({
      where: {
        album: { in: albumNames },
        thumbnailPath: { not: null },
      },
      select: { id: true, album: true },
      distinct: ['album'],
    });

    const coverMap = new Map(coverMedia.map((m) => [m.album, m.id]));

    return albumStats
      .filter((album) => album.album !== null)
      .map((album) => ({
        id: album.album as string,
        name: album.album as string,
        artist: album._min.artist,
        trackCount: album._count.id,
        totalDuration: album._sum.duration ?? 0,
        coverMediaId: coverMap.get(album.album as string) ?? null,
      }));
  },

  async getArtistItems(): Promise<ExportableItem[]> {
    const artistStats = await prisma.media.groupBy({
      by: ['artist'],
      where: { artist: { not: null } },
      _count: { id: true },
      _sum: { duration: true },
      orderBy: { artist: 'asc' },
    });

    if (artistStats.length === 0) {
      return [];
    }

    // Get cover media for each artist
    const artistNames = artistStats
      .map((a) => a.artist)
      .filter((name): name is string => name !== null);
    const coverMedia = await prisma.media.findMany({
      where: {
        artist: { in: artistNames },
        thumbnailPath: { not: null },
      },
      select: { id: true, artist: true },
      distinct: ['artist'],
    });

    const coverMap = new Map(coverMedia.map((m) => [m.artist, m.id]));

    return artistStats
      .filter((artist) => artist.artist !== null)
      .map((artist) => ({
        id: artist.artist as string,
        name: artist.artist as string,
        artist: null,
        trackCount: artist._count.id,
        totalDuration: artist._sum.duration ?? 0,
        coverMediaId: coverMap.get(artist.artist as string) ?? null,
      }));
  },

  async getPlaylistItems(): Promise<ExportableItem[]> {
    const playlists = await prisma.playlist.findMany({
      where: { isSystem: false },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });

    if (playlists.length === 0) {
      return [];
    }

    // Get first item's media for cover
    const playlistIds = playlists.map((p) => p.id);
    const firstItems = await prisma.playlistItem.findMany({
      where: {
        playlistId: { in: playlistIds },
        position: 0,
      },
      include: { media: { select: { id: true } } },
    });

    const coverMap = new Map(
      firstItems.map((item) => [item.playlistId, item.media.id])
    );

    return playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      artist: null,
      trackCount: playlist._count.items,
      coverMediaId: coverMap.get(playlist.id) ?? null,
    }));
  },

  async getAllSongsItem(): Promise<ExportableItem[]> {
    const count = await prisma.media.count();
    const firstMedia = await prisma.media.findMany({
      where: { thumbnailPath: { not: null } },
      select: { id: true },
      take: 1,
    });

    return [
      {
        id: 'all-songs',
        name: 'All Songs',
        artist: null,
        trackCount: count,
        coverMediaId: firstMedia[0]?.id ?? null,
      },
    ];
  },

  /**
   * Check export status for items in the destination folder
   */
  async checkExportStatus(
    destinationPath: string,
    mode: ExportMode,
    itemIds: string[]
  ): Promise<ExportStatus[]> {
    const results: ExportStatus[] = [];

    if (mode === 'playlist') {
      // For playlists, get tracks from playlist items
      for (const playlistId of itemIds) {
        const playlistItems = await prisma.playlistItem.findMany({
          where: { playlistId },
          include: { media: true },
          orderBy: { position: 'asc' },
        });

        const playlist = await prisma.playlist.findUnique({
          where: { id: playlistId },
        });

        for (const item of playlistItems) {
          const exportPath = this.buildExportPath(
            item.media as MediaForExport,
            mode,
            destinationPath,
            { playlistName: playlist?.name ?? 'Unknown', position: item.position }
          );
          const isExported = await fileExists(exportPath);

          results.push({
            mediaId: item.media.id,
            title: item.media.title,
            isExported,
            exportPath: isExported ? exportPath : null,
          });
        }
      }
    } else if (mode === 'all') {
      // For all mode, get all media
      const media = await prisma.media.findMany();

      for (const m of media) {
        const exportPath = this.buildExportPath(m as MediaForExport, mode, destinationPath);
        const isExported = await fileExists(exportPath);

        results.push({
          mediaId: m.id,
          title: m.title,
          isExported,
          exportPath: isExported ? exportPath : null,
        });
      }
    } else {
      // For album/artist modes, get tracks by filter
      const where =
        mode === 'album'
          ? { album: { in: itemIds } }
          : { artist: { in: itemIds } };

      const media = await prisma.media.findMany({ where });

      for (const m of media) {
        const exportPath = this.buildExportPath(m as MediaForExport, mode, destinationPath);
        const isExported = await fileExists(exportPath);

        results.push({
          mediaId: m.id,
          title: m.title,
          isExported,
          exportPath: isExported ? exportPath : null,
        });
      }
    }

    return results;
  },

  /**
   * Build the export file path for a media item
   */
  buildExportPath(
    media: MediaForExport,
    mode: ExportMode,
    destinationPath: string,
    options?: { playlistName?: string; position?: number }
  ): string {
    const ext = getExtension(media.filePath);
    const title = sanitizeFilename(media.title);
    const artist = sanitizeFilename(media.artist ?? 'Unknown Artist');
    const album = sanitizeFilename(media.album ?? 'Unknown Album');

    switch (mode) {
      case 'album':
        return path.join(destinationPath, 'By Album', album, `${title}${ext}`);

      case 'artist':
        return path.join(destinationPath, 'By Artist', artist, `${title}${ext}`);

      case 'playlist': {
        const playlistName = sanitizeFilename(options?.playlistName ?? 'Unknown');
        const position = options?.position ?? 0;
        const trackNumber = String(position + 1).padStart(2, '0');
        return path.join(
          destinationPath,
          'By Playlist',
          playlistName,
          `${trackNumber} - ${title}${ext}`
        );
      }

      case 'all':
        return path.join(
          destinationPath,
          'All Songs',
          `${artist} - ${title}${ext}`
        );
    }
  },

  /**
   * Generate M3U playlist file content
   */
  generateM3U(tracks: M3UTrack[], playlistName: string): string {
    const lines: string[] = ['#EXTM3U', `#PLAYLIST:${playlistName}`, ''];

    for (const track of tracks) {
      const displayName = track.artist
        ? `${track.artist} - ${track.title}`
        : track.title;
      lines.push(`#EXTINF:${String(track.duration)},${displayName}`);
      lines.push(track.relativePath);
      lines.push('');
    }

    return lines.join('\n');
  },

  /**
   * Export items to the destination folder
   */
  async exportItems(options: ExportOptions): Promise<ExportResult> {
    const {
      destinationPath,
      mode,
      albumName,
      artistName,
      playlistId,
      includeArtwork,
      includeM3U,
      onProgress,
    } = options;

    const result: ExportResult = {
      totalExported: 0,
      totalSkipped: 0,
      exportedFiles: [],
    };

    let tracks: { media: Media; position?: number }[] = [];
    let groupName: string = '';

    // Get tracks based on mode
    if (mode === 'album' && albumName) {
      const media = await prisma.media.findMany({
        where: { album: albumName },
        orderBy: { title: 'asc' },
      });
      tracks = media.map((m) => ({ media: m }));
      groupName = albumName;
    } else if (mode === 'artist' && artistName) {
      const media = await prisma.media.findMany({
        where: { artist: artistName },
        orderBy: { title: 'asc' },
      });
      tracks = media.map((m) => ({ media: m }));
      groupName = artistName;
    } else if (mode === 'playlist' && playlistId) {
      const playlist = await prisma.playlist.findUnique({
        where: { id: playlistId },
      });
      if (!playlist) {
        throw new NotFoundError('Playlist');
      }
      groupName = playlist.name;

      const items = await prisma.playlistItem.findMany({
        where: { playlistId },
        include: { media: true },
        orderBy: { position: 'asc' },
      });
      tracks = items.map((item) => ({ media: item.media, position: item.position }));
    } else if (mode === 'all') {
      const media = await prisma.media.findMany({
        orderBy: [{ artist: 'asc' }, { title: 'asc' }],
      });
      tracks = media.map((m) => ({ media: m }));
      groupName = 'All Songs';
    }

    if (tracks.length === 0) {
      return result;
    }

    // Determine base export directory
    let baseDir: string;
    switch (mode) {
      case 'album':
        baseDir = path.join(destinationPath, 'By Album', sanitizeFilename(groupName));
        break;
      case 'artist':
        baseDir = path.join(destinationPath, 'By Artist', sanitizeFilename(groupName));
        break;
      case 'playlist':
        baseDir = path.join(destinationPath, 'By Playlist', sanitizeFilename(groupName));
        break;
      case 'all':
        baseDir = path.join(destinationPath, 'All Songs');
        break;
    }

    // Create directory
    await fs.mkdir(baseDir, { recursive: true });

    // Track M3U entries
    const m3uTracks: M3UTrack[] = [];

    // Export each track
    for (let i = 0; i < tracks.length; i++) {
      const { media, position } = tracks[i];
      const exportPath = this.buildExportPath(
        media as MediaForExport,
        mode,
        destinationPath,
        { playlistName: groupName, position }
      );

      onProgress?.(i + 1, tracks.length, media.title);

      // Check if already exported
      if (await fileExists(exportPath)) {
        result.totalSkipped++;
        // Still add to M3U if it exists
        m3uTracks.push({
          title: media.title,
          artist: media.artist,
          duration: media.duration,
          relativePath: path.basename(exportPath),
        });
        continue;
      }

      // Copy audio file
      await fs.copyFile(media.filePath, exportPath);
      result.totalExported++;
      result.exportedFiles.push(exportPath);

      // Add to M3U tracks
      m3uTracks.push({
        title: media.title,
        artist: media.artist,
        duration: media.duration,
        relativePath: path.basename(exportPath),
      });

      // Copy artwork if requested and available
      if (includeArtwork && media.thumbnailPath) {
        const artworkExt = getExtension(media.thumbnailPath);
        const artworkDest = path.join(baseDir, `cover${artworkExt}`);
        if (!(await fileExists(artworkDest))) {
          try {
            await fs.copyFile(media.thumbnailPath, artworkDest);
          } catch {
            // Ignore artwork copy errors
          }
        }
      }
    }

    // Generate M3U playlist if requested
    if (includeM3U && m3uTracks.length > 0) {
      const m3uContent = this.generateM3U(m3uTracks, groupName);
      const m3uPath = path.join(baseDir, 'playlist.m3u');
      await fs.writeFile(m3uPath, m3uContent, 'utf-8');
    }

    return result;
  },
};

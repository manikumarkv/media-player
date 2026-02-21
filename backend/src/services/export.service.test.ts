import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';
import fs from 'fs/promises';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn(),
    mkdir: vi.fn(),
    copyFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
  },
}));


const { exportService } = await import('./export.service.js');

describe('exportService', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('getExportableItems', () => {
    describe('album mode', () => {
      it('should return albums with track counts and metadata', async () => {
        const mockAlbumStats = [
          { album: 'Album A', _count: { id: 5 }, _sum: { duration: 1200 }, _min: { artist: 'Artist A' } },
          { album: 'Album B', _count: { id: 3 }, _sum: { duration: 800 }, _min: { artist: 'Artist B' } },
        ];
        const mockCoverMedia = [
          { id: 'media-1', album: 'Album A' },
          { id: 'media-2', album: 'Album B' },
        ];

        mockPrisma.media.groupBy.mockResolvedValue(mockAlbumStats);
        mockPrisma.media.findMany.mockResolvedValue(mockCoverMedia);

        const result = await exportService.getExportableItems('album');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          id: 'Album A',
          name: 'Album A',
          artist: 'Artist A',
          trackCount: 5,
          coverMediaId: 'media-1',
        });
      });

      it('should return empty array when no albums exist', async () => {
        mockPrisma.media.groupBy.mockResolvedValue([]);
        mockPrisma.media.findMany.mockResolvedValue([]);

        const result = await exportService.getExportableItems('album');

        expect(result).toEqual([]);
      });
    });

    describe('artist mode', () => {
      it('should return artists with track counts', async () => {
        const mockArtistStats = [
          { artist: 'Artist A', _count: { id: 10 }, _sum: { duration: 2400 } },
          { artist: 'Artist B', _count: { id: 5 }, _sum: { duration: 1200 } },
        ];
        const mockCoverMedia = [
          { id: 'media-1', artist: 'Artist A' },
          { id: 'media-2', artist: 'Artist B' },
        ];

        mockPrisma.media.groupBy.mockResolvedValue(mockArtistStats);
        mockPrisma.media.findMany.mockResolvedValue(mockCoverMedia);

        const result = await exportService.getExportableItems('artist');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          id: 'Artist A',
          name: 'Artist A',
          trackCount: 10,
          coverMediaId: 'media-1',
        });
      });
    });

    describe('playlist mode', () => {
      it('should return playlists with track counts', async () => {
        const mockPlaylists = [
          { id: 'playlist-1', name: 'My Playlist', _count: { items: 8 } },
          { id: 'playlist-2', name: 'Workout', _count: { items: 12 } },
        ];
        const mockFirstItems = [
          { playlistId: 'playlist-1', media: { id: 'media-1' } },
          { playlistId: 'playlist-2', media: { id: 'media-2' } },
        ];

        mockPrisma.playlist.findMany.mockResolvedValue(mockPlaylists);
        mockPrisma.playlistItem.findMany.mockResolvedValue(mockFirstItems);

        const result = await exportService.getExportableItems('playlist');

        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          id: 'playlist-1',
          name: 'My Playlist',
          trackCount: 8,
          coverMediaId: 'media-1',
        });
      });
    });

    describe('all mode', () => {
      it('should return all songs as exportable items', async () => {
        const mockMedia = [
          { id: 'media-1', title: 'Song A', artist: 'Artist A', album: 'Album A' },
          { id: 'media-2', title: 'Song B', artist: 'Artist B', album: 'Album B' },
        ];
        mockPrisma.media.count.mockResolvedValue(2);
        mockPrisma.media.findMany.mockResolvedValue(mockMedia);

        const result = await exportService.getExportableItems('all');

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: 'all-songs',
          name: 'All Songs',
          trackCount: 2,
        });
      });
    });
  });

  describe('checkExportStatus', () => {
    it('should return exported status for album items', async () => {
      const mockTracks = [
        { id: 'media-1', title: 'Song 1', artist: 'Artist A', album: 'Album A', filePath: '/media/song1.opus' },
        { id: 'media-2', title: 'Song 2', artist: 'Artist A', album: 'Album A', filePath: '/media/song2.opus' },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockTracks);

      // First file exists, second doesn't
      vi.mocked(fs.access)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('ENOENT'));

      const result = await exportService.checkExportStatus(
        '/export/dest',
        'album',
        ['Album A']
      );

      expect(result).toHaveLength(2);
      expect(result[0].isExported).toBe(true);
      expect(result[1].isExported).toBe(false);
    });

    it('should check files in correct export paths for artist mode', async () => {
      const mockTracks = [
        { id: 'media-1', title: 'Song 1', artist: 'Artist A', album: 'Album A', filePath: '/media/song1.opus' },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockTracks);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      await exportService.checkExportStatus('/export/dest', 'artist', ['Artist A']);

      expect(fs.access).toHaveBeenCalledWith(
        expect.stringContaining('Artist A')
      );
    });

    it('should handle playlist mode status check', async () => {
      const mockPlaylistItems = [
        { position: 0, media: { id: 'media-1', title: 'Song 1', artist: 'Artist A', filePath: '/media/song1.opus' } },
      ];
      mockPrisma.playlistItem.findMany.mockResolvedValue(mockPlaylistItems);
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      const result = await exportService.checkExportStatus(
        '/export/dest',
        'playlist',
        ['playlist-1']
      );

      expect(result).toHaveLength(1);
      expect(result[0].isExported).toBe(false);
    });
  });

  describe('buildExportPath', () => {
    it('should build correct path for album mode', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'album', '/export/dest');

      expect(result).toBe('/export/dest/By Album/Album Name/Song Title.opus');
    });

    it('should build correct path for artist mode', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'artist', '/export/dest');

      expect(result).toBe('/export/dest/By Artist/Artist Name/Song Title.opus');
    });

    it('should build correct path for playlist mode with position', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(
        media,
        'playlist',
        '/export/dest',
        { playlistName: 'My Playlist', position: 2 }
      );

      expect(result).toBe('/export/dest/By Playlist/My Playlist/03 - Song Title.opus');
    });

    it('should build correct path for all mode', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: 'Artist Name',
        album: 'Album Name',
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'all', '/export/dest');

      expect(result).toBe('/export/dest/All Songs/Artist Name - Song Title.opus');
    });

    it('should sanitize filenames with invalid characters', () => {
      const media = {
        id: 'media-1',
        title: 'Song/Title:With*Bad?Chars',
        artist: 'Artist<Name>',
        album: 'Album|Name',
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'album', '/export/dest');

      expect(result).not.toContain('/Title');
      expect(result).not.toContain(':');
      expect(result).not.toContain('*');
      expect(result).not.toContain('?');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('|');
    });

    it('should handle missing artist with fallback', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: null,
        album: null,
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'artist', '/export/dest');

      expect(result).toContain('Unknown Artist');
    });

    it('should handle missing album with fallback', () => {
      const media = {
        id: 'media-1',
        title: 'Song Title',
        artist: 'Artist Name',
        album: null,
        filePath: '/media/song.opus',
      };

      const result = exportService.buildExportPath(media, 'album', '/export/dest');

      expect(result).toContain('Unknown Album');
    });
  });

  describe('generateM3U', () => {
    it('should generate valid M3U playlist content', () => {
      const tracks = [
        { title: 'Song 1', artist: 'Artist A', duration: 180, relativePath: 'Song 1.opus' },
        { title: 'Song 2', artist: 'Artist B', duration: 240, relativePath: 'Song 2.opus' },
      ];

      const result = exportService.generateM3U(tracks, 'My Playlist');

      expect(result).toContain('#EXTM3U');
      expect(result).toContain('#PLAYLIST:My Playlist');
      expect(result).toContain('#EXTINF:180,Artist A - Song 1');
      expect(result).toContain('Song 1.opus');
      expect(result).toContain('#EXTINF:240,Artist B - Song 2');
      expect(result).toContain('Song 2.opus');
    });

    it('should handle tracks without artist', () => {
      const tracks = [
        { title: 'Song 1', artist: null, duration: 180, relativePath: 'Song 1.opus' },
      ];

      const result = exportService.generateM3U(tracks, 'Playlist');

      expect(result).toContain('#EXTINF:180,Song 1');
    });
  });

  describe('exportItems', () => {
    it('should export album items with artwork and M3U', async () => {
      const mockTracks = [
        {
          id: 'media-1',
          title: 'Song 1',
          artist: 'Artist A',
          album: 'Album A',
          duration: 180,
          filePath: '/media/song1.opus',
          thumbnailPath: '/media/thumb1.jpg',
        },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockTracks);

      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const result = await exportService.exportItems({
        destinationPath: '/export/dest',
        mode: 'album',
        albumName: 'Album A',
        includeArtwork: true,
        includeM3U: true,
      });

      expect(result.totalExported).toBe(1);
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.copyFile).toHaveBeenCalledTimes(2); // audio + artwork
      expect(fs.writeFile).toHaveBeenCalled(); // M3U file
    });

    it('should skip already exported files', async () => {
      const mockTracks = [
        {
          id: 'media-1',
          title: 'Song 1',
          artist: 'Artist A',
          album: 'Album A',
          duration: 180,
          filePath: '/media/song1.opus',
          thumbnailPath: null,
        },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockTracks);

      // File already exists
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const result = await exportService.exportItems({
        destinationPath: '/export/dest',
        mode: 'album',
        albumName: 'Album A',
        includeArtwork: false,
        includeM3U: false,
      });

      expect(result.totalSkipped).toBe(1);
      expect(result.totalExported).toBe(0);
      expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it('should export playlist with correct track ordering', async () => {
      const mockPlaylistItems = [
        { position: 0, media: { id: 'media-1', title: 'First', artist: 'A', duration: 180, filePath: '/m/1.opus', thumbnailPath: null } },
        { position: 1, media: { id: 'media-2', title: 'Second', artist: 'B', duration: 200, filePath: '/m/2.opus', thumbnailPath: null } },
      ];
      mockPrisma.playlist.findUnique.mockResolvedValue({ id: 'playlist-1', name: 'Test Playlist' });
      mockPrisma.playlistItem.findMany.mockResolvedValue(mockPlaylistItems);

      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await exportService.exportItems({
        destinationPath: '/export/dest',
        mode: 'playlist',
        playlistId: 'playlist-1',
        includeArtwork: false,
        includeM3U: true,
      });

      // Verify copy was called with correct numbered filenames
      const copyFileCalls = vi.mocked(fs.copyFile).mock.calls;
      expect(copyFileCalls[0][1]).toContain('01 - First.opus');
      expect(copyFileCalls[1][1]).toContain('02 - Second.opus');
    });

    it('should export all songs to flat folder', async () => {
      const mockMedia = [
        { id: 'media-1', title: 'Song 1', artist: 'Artist A', duration: 180, filePath: '/m/1.opus', thumbnailPath: null },
      ];
      mockPrisma.media.findMany.mockResolvedValue(mockMedia);

      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await exportService.exportItems({
        destinationPath: '/export/dest',
        mode: 'all',
        includeArtwork: false,
        includeM3U: false,
      });

      expect(result.totalExported).toBe(1);
      expect(fs.copyFile).toHaveBeenCalledWith(
        '/m/1.opus',
        expect.stringContaining('All Songs')
      );
    });

    it('should throw error for invalid playlist', async () => {
      mockPrisma.playlist.findUnique.mockResolvedValue(null);

      await expect(
        exportService.exportItems({
          destinationPath: '/export/dest',
          mode: 'playlist',
          playlistId: 'nonexistent',
          includeArtwork: false,
          includeM3U: false,
        })
      ).rejects.toThrow();
    });
  });
});

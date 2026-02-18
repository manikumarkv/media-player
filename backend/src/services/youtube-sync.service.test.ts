import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

// Mock child_process for yt-dlp calls
vi.mock('child_process', () => ({
  spawn: vi.fn(),
  execSync: vi.fn(),
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

// Import after mocks
const { youtubeSyncService } = await import('./youtube-sync.service.js');

describe('youtubeSyncService', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('getStatus', () => {
    it('should return disconnected status when no sync config exists', async () => {
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(null);

      const result = await youtubeSyncService.getStatus();

      expect(result).toEqual({
        isConnected: false,
        authMethod: null,
        email: null,
        lastSyncAt: null,
        autoSync: true,
        syncInterval: 60,
        filterMusic: true,
        maxDuration: 600,
      });
    });

    it('should return connected status when sync config exists', async () => {
      const mockSync = {
        id: '1',
        authMethod: 'cookie',
        email: 'test@gmail.com',
        isConnected: true,
        lastSyncAt: new Date('2024-01-01'),
        autoSync: true,
        syncInterval: 30,
        filterMusic: false,
        maxDuration: 300,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(mockSync);

      const result = await youtubeSyncService.getStatus();

      expect(result).toEqual({
        isConnected: true,
        authMethod: 'cookie',
        email: 'test@gmail.com',
        lastSyncAt: mockSync.lastSyncAt,
        autoSync: true,
        syncInterval: 30,
        filterMusic: false,
        maxDuration: 300,
      });
    });
  });

  describe('getSettings', () => {
    it('should return default settings when no config exists', async () => {
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(null);

      const result = await youtubeSyncService.getSettings();

      expect(result).toEqual({
        autoSync: true,
        syncInterval: 60,
        filterMusic: true,
        maxDuration: 600,
      });
    });

    it('should return saved settings when config exists', async () => {
      const mockSync = {
        id: '1',
        autoSync: false,
        syncInterval: 120,
        filterMusic: false,
        maxDuration: 900,
      };
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(mockSync);

      const result = await youtubeSyncService.getSettings();

      expect(result).toEqual({
        autoSync: false,
        syncInterval: 120,
        filterMusic: false,
        maxDuration: 900,
      });
    });
  });

  describe('updateSettings', () => {
    it('should create settings if none exist', async () => {
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(null);
      const updatedSettings = {
        id: '1',
        authMethod: 'cookie',
        autoSync: false,
        syncInterval: 90,
        filterMusic: true,
        maxDuration: 600,
      };
      mockPrisma.youTubeSync.upsert.mockResolvedValue(updatedSettings);

      const result = await youtubeSyncService.updateSettings({
        autoSync: false,
        syncInterval: 90,
      });

      expect(mockPrisma.youTubeSync.upsert).toHaveBeenCalled();
      expect(result.autoSync).toBe(false);
      expect(result.syncInterval).toBe(90);
    });

    it('should update existing settings', async () => {
      const existingSync = {
        id: '1',
        authMethod: 'cookie',
        autoSync: true,
        syncInterval: 60,
        filterMusic: true,
        maxDuration: 600,
      };
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(existingSync);
      mockPrisma.youTubeSync.upsert.mockResolvedValue({
        ...existingSync,
        filterMusic: false,
      });

      const result = await youtubeSyncService.updateSettings({
        filterMusic: false,
      });

      expect(result.filterMusic).toBe(false);
    });

    it('should validate syncInterval is positive', async () => {
      await expect(
        youtubeSyncService.updateSettings({ syncInterval: -10 })
      ).rejects.toThrow();
    });

    it('should validate maxDuration is positive', async () => {
      await expect(
        youtubeSyncService.updateSettings({ maxDuration: -100 })
      ).rejects.toThrow();
    });
  });

  describe('getHistory', () => {
    it('should return sync history ordered by date', async () => {
      const mockHistory = [
        {
          id: '1',
          syncedAt: new Date('2024-01-02'),
          videosFound: 10,
          videosDownloaded: 5,
          videosFailed: 1,
          videosSkipped: 4,
        },
        {
          id: '2',
          syncedAt: new Date('2024-01-01'),
          videosFound: 8,
          videosDownloaded: 6,
          videosFailed: 0,
          videosSkipped: 2,
        },
      ];
      mockPrisma.youTubeSyncHistory.findMany.mockResolvedValue(mockHistory);

      const result = await youtubeSyncService.getHistory();

      expect(result).toHaveLength(2);
      expect(mockPrisma.youTubeSyncHistory.findMany).toHaveBeenCalledWith({
        orderBy: { syncedAt: 'desc' },
        take: 50,
      });
    });

    it('should respect limit parameter', async () => {
      mockPrisma.youTubeSyncHistory.findMany.mockResolvedValue([]);

      await youtubeSyncService.getHistory(10);

      expect(mockPrisma.youTubeSyncHistory.findMany).toHaveBeenCalledWith({
        orderBy: { syncedAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('disconnect', () => {
    it('should delete sync config and return success', async () => {
      const mockSync = { id: '1' };
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(mockSync);
      mockPrisma.youTubeSync.delete.mockResolvedValue(mockSync);

      const result = await youtubeSyncService.disconnect();

      expect(result).toBe(true);
      expect(mockPrisma.youTubeSync.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return false if no config exists', async () => {
      mockPrisma.youTubeSync.findFirst.mockResolvedValue(null);

      const result = await youtubeSyncService.disconnect();

      expect(result).toBe(false);
      expect(mockPrisma.youTubeSync.delete).not.toHaveBeenCalled();
    });
  });

  describe('validateCookieContent', () => {
    it('should return valid for correct Netscape cookie format', () => {
      const validCookies = `# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1735689600	SID	abc123
.youtube.com	TRUE	/	TRUE	1735689600	HSID	def456
.youtube.com	TRUE	/	TRUE	1735689600	SSID	ghi789
.google.com	TRUE	/	TRUE	1735689600	SAPISID	jkl012`;

      const result = youtubeSyncService.validateCookieContent(validCookies);

      expect(result.isValid).toBe(true);
    });

    it('should return invalid for empty content', () => {
      const result = youtubeSyncService.validateCookieContent('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for missing required cookies', () => {
      const invalidCookies = `# Netscape HTTP Cookie File
.example.com	TRUE	/	TRUE	1735689600	some_cookie	value`;

      const result = youtubeSyncService.validateCookieContent(invalidCookies);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing required');
    });

    it('should return invalid for malformed cookie format', () => {
      const malformedCookies = `not a valid cookie file
just random text`;

      const result = youtubeSyncService.validateCookieContent(malformedCookies);

      expect(result.isValid).toBe(false);
    });
  });

  describe('parseLikedVideosOutput', () => {
    it('should parse yt-dlp flat playlist output', () => {
      const output = `abc123|||Song Title|||Artist Name|||180|||["Music"]
def456|||Another Song|||Another Artist|||240|||["Music", "Pop"]
ghi789|||Video Title|||Channel|||600|||["Entertainment"]`;

      const result = youtubeSyncService.parseLikedVideosOutput(output);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'abc123',
        title: 'Song Title',
        channel: 'Artist Name',
        duration: 180,
        categories: ['Music'],
      });
    });

    it('should handle empty output', () => {
      const result = youtubeSyncService.parseLikedVideosOutput('');

      expect(result).toHaveLength(0);
    });

    it('should skip malformed lines', () => {
      const output = `abc123|||Song Title|||Artist|||180|||["Music"]
malformed line
def456|||Another|||Artist|||240|||["Music"]`;

      const result = youtubeSyncService.parseLikedVideosOutput(output);

      expect(result).toHaveLength(2);
    });
  });

  describe('shouldSkipVideo', () => {
    it('should skip non-music videos when filterMusic is true', () => {
      const video = {
        id: '1',
        title: 'Funny Cat Video',
        channel: 'Cats',
        duration: 60,
        categories: ['Entertainment', 'Comedy'],
      };

      const result = youtubeSyncService.shouldSkipVideo(video, {
        filterMusic: true,
        maxDuration: 600,
      });

      expect(result).toBe(true);
    });

    it('should not skip music videos when filterMusic is true', () => {
      const video = {
        id: '1',
        title: 'Great Song',
        channel: 'Artist',
        duration: 180,
        categories: ['Music'],
      };

      const result = youtubeSyncService.shouldSkipVideo(video, {
        filterMusic: true,
        maxDuration: 600,
      });

      expect(result).toBe(false);
    });

    it('should skip videos exceeding maxDuration', () => {
      const video = {
        id: '1',
        title: 'Long Video',
        channel: 'Channel',
        duration: 3600,
        categories: ['Music'],
      };

      const result = youtubeSyncService.shouldSkipVideo(video, {
        filterMusic: false,
        maxDuration: 600,
      });

      expect(result).toBe(true);
    });

    it('should not skip any video when filters are disabled', () => {
      const video = {
        id: '1',
        title: 'Any Video',
        channel: 'Channel',
        duration: 300,
        categories: ['Entertainment'],
      };

      const result = youtubeSyncService.shouldSkipVideo(video, {
        filterMusic: false,
        maxDuration: 99999,
      });

      expect(result).toBe(false);
    });
  });
});

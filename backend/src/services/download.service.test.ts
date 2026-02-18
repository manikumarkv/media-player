import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma, resetMocks } from '../test/setup.js';

// Mock youtube service
vi.mock('./youtube.service.js', () => ({
  youtubeService: {
    isValidUrl: vi.fn(),
    isValidPlaylistUrl: vi.fn(),
    extractVideoId: vi.fn(),
    extractPlaylistId: vi.fn(),
    getVideoInfo: vi.fn(),
    getPlaylistInfo: vi.fn(),
    downloadAudio: vi.fn(),
    cancelDownload: vi.fn(),
  },
}));

// Mock media service
vi.mock('./media.service.js', () => ({
  mediaService: {
    findBySourceId: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock socket service
vi.mock('./socket.service.js', () => ({
  socketService: {
    emitDownloadStarted: vi.fn(),
    emitDownloadProgress: vi.fn(),
    emitDownloadCompleted: vi.fn(),
    emitDownloadError: vi.fn(),
    emitDownloadCancelled: vi.fn(),
    emitMediaAdded: vi.fn(),
  },
}));

const { downloadService } = await import('./download.service.js');
const { youtubeService } = await import('./youtube.service.js');
const { mediaService } = await import('./media.service.js');

describe('downloadService', () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all downloads', async () => {
      const mockDownloads = [
        { id: '1', title: 'Download 1', status: 'COMPLETED' },
        { id: '2', title: 'Download 2', status: 'PENDING' },
      ];
      mockPrisma.download.findMany.mockResolvedValue(mockDownloads);

      const result = await downloadService.findAll();

      expect(result).toEqual(mockDownloads);
      expect(mockPrisma.download.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return download by id', async () => {
      const mockDownload = { id: '1', title: 'Download' };
      mockPrisma.download.findUnique.mockResolvedValue(mockDownload);

      const result = await downloadService.findById('1');

      expect(result).toEqual(mockDownload);
    });

    it('should throw NotFoundError if not found', async () => {
      mockPrisma.download.findUnique.mockResolvedValue(null);

      await expect(downloadService.findById('999')).rejects.toThrow('Download not found');
    });
  });

  describe('getInfo', () => {
    it('should return video info for valid URL', async () => {
      vi.mocked(youtubeService.isValidUrl).mockReturnValue(true);
      vi.mocked(youtubeService.getVideoInfo).mockResolvedValue({
        id: 'abc123',
        title: 'Test Video',
        duration: 180,
        thumbnail: 'http://example.com/thumb.jpg',
        channel: 'Test Channel',
        uploadDate: '2024-01-01',
        description: 'Test description',
      });

      const result = await downloadService.getInfo('https://youtube.com/watch?v=abc123');

      expect(result).toEqual({
        id: 'abc123',
        title: 'Test Video',
        duration: 180,
        thumbnail: 'http://example.com/thumb.jpg',
        channel: 'Test Channel',
      });
    });

    it('should throw error for invalid URL', async () => {
      vi.mocked(youtubeService.isValidUrl).mockReturnValue(false);

      await expect(downloadService.getInfo('invalid-url')).rejects.toThrow('Invalid YouTube URL');
    });
  });

  describe('start', () => {
    it('should start download for valid URL', async () => {
      vi.mocked(youtubeService.isValidUrl).mockReturnValue(true);
      vi.mocked(youtubeService.extractVideoId).mockReturnValue('abc123');
      vi.mocked(mediaService.findBySourceId).mockResolvedValue(null);
      vi.mocked(youtubeService.getVideoInfo).mockResolvedValue({
        id: 'abc123',
        title: 'Test Video',
        duration: 180,
        thumbnail: 'http://example.com/thumb.jpg',
        channel: 'Test Channel',
        uploadDate: '2024-01-01',
        description: 'Test',
      });

      const mockDownload = { id: '1', title: 'Test Video', status: 'PENDING' };
      mockPrisma.download.create.mockResolvedValue(mockDownload);

      const result = await downloadService.start('https://youtube.com/watch?v=abc123');

      expect(result).toEqual(mockDownload);
      expect(mockPrisma.download.create).toHaveBeenCalled();
    });

    it('should throw error if already downloaded', async () => {
      vi.mocked(youtubeService.isValidUrl).mockReturnValue(true);
      vi.mocked(youtubeService.extractVideoId).mockReturnValue('abc123');
      vi.mocked(mediaService.findBySourceId).mockResolvedValue({ id: 'm1' } as never);

      await expect(
        downloadService.start('https://youtube.com/watch?v=abc123')
      ).rejects.toThrow('already been downloaded');
    });
  });

  describe('cancel', () => {
    it('should cancel active download', async () => {
      const mockDownload = { id: '1', status: 'DOWNLOADING' };
      mockPrisma.download.findUnique.mockResolvedValue(mockDownload);
      mockPrisma.download.update.mockResolvedValue({ ...mockDownload, status: 'CANCELLED' });

      const result = await downloadService.cancel('1');

      expect(result.status).toBe('CANCELLED');
      expect(youtubeService.cancelDownload).toHaveBeenCalledWith('1');
    });

    it('should throw error for completed download', async () => {
      mockPrisma.download.findUnique.mockResolvedValue({ id: '1', status: 'COMPLETED' });

      await expect(downloadService.cancel('1')).rejects.toThrow('Cannot cancel completed');
    });
  });

  describe('retry', () => {
    it('should retry failed download', async () => {
      const mockDownload = { id: '1', url: 'https://youtube.com/watch?v=abc', status: 'FAILED' };
      mockPrisma.download.findUnique.mockResolvedValue(mockDownload);
      mockPrisma.download.update.mockResolvedValue({ ...mockDownload, status: 'PENDING' });
      vi.mocked(youtubeService.getVideoInfo).mockResolvedValue({
        id: 'abc',
        title: 'Video',
        duration: 180,
        thumbnail: '',
        channel: '',
        uploadDate: '',
        description: '',
      });

      const result = await downloadService.retry('1');

      expect(result.status).toBe('PENDING');
    });

    it('should throw error for non-failed download', async () => {
      mockPrisma.download.findUnique.mockResolvedValue({ id: '1', status: 'COMPLETED' });

      await expect(downloadService.retry('1')).rejects.toThrow('only retry failed');
    });
  });

  describe('clearCompleted', () => {
    it('should delete all completed downloads', async () => {
      mockPrisma.download.deleteMany.mockResolvedValue({ count: 5 });

      const result = await downloadService.clearCompleted();

      expect(result).toBe(5);
      expect(mockPrisma.download.deleteMany).toHaveBeenCalledWith({
        where: { status: 'COMPLETED' },
      });
    });
  });

  describe('clearFailed', () => {
    it('should delete failed and cancelled downloads', async () => {
      mockPrisma.download.deleteMany.mockResolvedValue({ count: 3 });

      const result = await downloadService.clearFailed();

      expect(result).toBe(3);
      expect(mockPrisma.download.deleteMany).toHaveBeenCalledWith({
        where: { status: { in: ['FAILED', 'CANCELLED'] } },
      });
    });
  });

  describe('getPlaylistInfo', () => {
    it('should return playlist info for valid playlist URL', async () => {
      vi.mocked(youtubeService.isValidPlaylistUrl).mockReturnValue(true);
      vi.mocked(youtubeService.getPlaylistInfo).mockResolvedValue({
        id: 'PLxyz123',
        title: 'My Playlist',
        channel: 'Test Channel',
        videoCount: 10,
        videos: [
          { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
          { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
        ],
      });

      const result = await downloadService.getPlaylistInfo('https://youtube.com/playlist?list=PLxyz123');

      expect(result).toEqual({
        id: 'PLxyz123',
        title: 'My Playlist',
        channel: 'Test Channel',
        videoCount: 10,
        videos: [
          { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
          { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
        ],
      });
    });

    it('should throw error for invalid playlist URL', async () => {
      vi.mocked(youtubeService.isValidPlaylistUrl).mockReturnValue(false);

      await expect(downloadService.getPlaylistInfo('invalid-url')).rejects.toThrow('Invalid YouTube playlist URL');
    });
  });

  describe('startPlaylist', () => {
    it('should start downloads for all videos in playlist', async () => {
      vi.mocked(youtubeService.isValidPlaylistUrl).mockReturnValue(true);
      vi.mocked(youtubeService.getPlaylistInfo).mockResolvedValue({
        id: 'PLxyz123',
        title: 'My Playlist',
        channel: 'Test Channel',
        videoCount: 2,
        videos: [
          { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
          { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
        ],
      });

      // Mock that neither video has been downloaded yet
      vi.mocked(mediaService.findBySourceId).mockResolvedValue(null);

      const mockDownload1 = { id: 'd1', title: 'Video 1', status: 'PENDING' };
      const mockDownload2 = { id: 'd2', title: 'Video 2', status: 'PENDING' };
      mockPrisma.download.create
        .mockResolvedValueOnce(mockDownload1)
        .mockResolvedValueOnce(mockDownload2);

      const result = await downloadService.startPlaylist('https://youtube.com/playlist?list=PLxyz123');

      expect(result.playlistTitle).toBe('My Playlist');
      expect(result.totalVideos).toBe(2);
      expect(result.downloads).toHaveLength(2);
      expect(mockPrisma.download.create).toHaveBeenCalledTimes(2);
    });

    it('should skip videos that are already downloaded', async () => {
      vi.mocked(youtubeService.isValidPlaylistUrl).mockReturnValue(true);
      vi.mocked(youtubeService.getPlaylistInfo).mockResolvedValue({
        id: 'PLxyz123',
        title: 'My Playlist',
        channel: 'Test Channel',
        videoCount: 2,
        videos: [
          { id: 'vid1', title: 'Video 1', duration: 180, thumbnail: 'thumb1.jpg' },
          { id: 'vid2', title: 'Video 2', duration: 240, thumbnail: 'thumb2.jpg' },
        ],
      });

      // Mock that first video is already downloaded
      vi.mocked(mediaService.findBySourceId)
        .mockResolvedValueOnce({ id: 'm1' } as never)
        .mockResolvedValueOnce(null);

      const mockDownload = { id: 'd2', title: 'Video 2', status: 'PENDING' };
      mockPrisma.download.create.mockResolvedValue(mockDownload);

      const result = await downloadService.startPlaylist('https://youtube.com/playlist?list=PLxyz123');

      expect(result.totalVideos).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.downloads).toHaveLength(1);
      expect(mockPrisma.download.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error for invalid playlist URL', async () => {
      vi.mocked(youtubeService.isValidPlaylistUrl).mockReturnValue(false);

      await expect(downloadService.startPlaylist('invalid-url')).rejects.toThrow('Invalid YouTube playlist URL');
    });
  });
});

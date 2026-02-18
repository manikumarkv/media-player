import { describe, it, expect } from 'vitest';

// Import the actual service for URL validation tests (no mocking needed)
const { youtubeService } = await import('./youtube.service.js');

describe('youtubeService', () => {
  describe('isValidUrl', () => {
    it('should return true for valid youtube.com watch URLs', () => {
      expect(youtubeService.isValidUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(youtubeService.isValidUrl('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(youtubeService.isValidUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for youtu.be short URLs', () => {
      expect(youtubeService.isValidUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(youtubeService.isValidUrl('http://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return true for YouTube Shorts URLs', () => {
      expect(youtubeService.isValidUrl('https://www.youtube.com/shorts/abc123')).toBe(true);
      expect(youtubeService.isValidUrl('https://youtube.com/shorts/xyz789')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(youtubeService.isValidUrl('https://vimeo.com/123456')).toBe(false);
      expect(youtubeService.isValidUrl('https://example.com')).toBe(false);
      expect(youtubeService.isValidUrl('not a url')).toBe(false);
      expect(youtubeService.isValidUrl('')).toBe(false);
    });

    it('should return false for youtube URLs without video ID', () => {
      expect(youtubeService.isValidUrl('https://www.youtube.com')).toBe(false);
      expect(youtubeService.isValidUrl('https://www.youtube.com/watch')).toBe(false);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from youtube.com watch URLs', () => {
      expect(youtubeService.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(youtubeService.extractVideoId('https://youtube.com/watch?v=abc123')).toBe('abc123');
    });

    it('should extract video ID from youtu.be short URLs', () => {
      expect(youtubeService.extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from YouTube Shorts URLs', () => {
      expect(youtubeService.extractVideoId('https://www.youtube.com/shorts/abc123')).toBe('abc123');
    });

    it('should extract video ID from URLs with extra parameters', () => {
      expect(youtubeService.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz')).toBe('dQw4w9WgXcQ');
      expect(youtubeService.extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      expect(youtubeService.extractVideoId('https://vimeo.com/123456')).toBeNull();
      expect(youtubeService.extractVideoId('not a url')).toBeNull();
      expect(youtubeService.extractVideoId('')).toBeNull();
    });
  });

  describe('isValidPlaylistUrl', () => {
    it('should return true for valid playlist URLs', () => {
      expect(youtubeService.isValidPlaylistUrl('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(true);
      expect(youtubeService.isValidPlaylistUrl('https://youtube.com/playlist?list=PLxyz123')).toBe(true);
    });

    it('should return true for video URLs with playlist parameter', () => {
      expect(youtubeService.isValidPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PLxyz123')).toBe(true);
    });

    it('should return false for video-only URLs without playlist', () => {
      expect(youtubeService.isValidPlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(false);
      expect(youtubeService.isValidPlaylistUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(youtubeService.isValidPlaylistUrl('https://vimeo.com/123456')).toBe(false);
      expect(youtubeService.isValidPlaylistUrl('not a url')).toBe(false);
      expect(youtubeService.isValidPlaylistUrl('')).toBe(false);
    });
  });

  describe('extractPlaylistId', () => {
    it('should extract playlist ID from playlist URLs', () => {
      expect(youtubeService.extractPlaylistId('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
    });

    it('should extract playlist ID from video URLs with list parameter', () => {
      expect(youtubeService.extractPlaylistId('https://www.youtube.com/watch?v=abc&list=PLxyz123&index=5')).toBe('PLxyz123');
    });

    it('should return null for URLs without playlist', () => {
      expect(youtubeService.extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
      expect(youtubeService.extractPlaylistId('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    });
  });
});

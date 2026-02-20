import { describe, it, expect } from 'vitest';

// Import the actual service for URL validation tests (no mocking needed)
const { youtubeService, parseReleaseYear } = await import('./youtube.service.js');

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
      expect(youtubeService.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
      expect(youtubeService.extractVideoId('https://youtube.com/watch?v=abc123')).toBe('abc123');
    });

    it('should extract video ID from youtu.be short URLs', () => {
      expect(youtubeService.extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from YouTube Shorts URLs', () => {
      expect(youtubeService.extractVideoId('https://www.youtube.com/shorts/abc123')).toBe('abc123');
    });

    it('should extract video ID from URLs with extra parameters', () => {
      expect(
        youtubeService.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLxyz')
      ).toBe('dQw4w9WgXcQ');
      expect(youtubeService.extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('should return null for invalid URLs', () => {
      expect(youtubeService.extractVideoId('https://vimeo.com/123456')).toBeNull();
      expect(youtubeService.extractVideoId('not a url')).toBeNull();
      expect(youtubeService.extractVideoId('')).toBeNull();
    });
  });

  describe('isValidPlaylistUrl', () => {
    it('should return true for valid playlist URLs', () => {
      expect(
        youtubeService.isValidPlaylistUrl(
          'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
        )
      ).toBe(true);
      expect(youtubeService.isValidPlaylistUrl('https://youtube.com/playlist?list=PLxyz123')).toBe(
        true
      );
    });

    it('should return true for YouTube Music playlist URLs', () => {
      expect(
        youtubeService.isValidPlaylistUrl(
          'https://music.youtube.com/playlist?list=PLN076H0BWefCubt-LrWvZ7IRPqo_1L4-H'
        )
      ).toBe(true);
    });

    it('should return true for video URLs with playlist parameter', () => {
      expect(
        youtubeService.isValidPlaylistUrl('https://www.youtube.com/watch?v=abc&list=PLxyz123')
      ).toBe(true);
    });

    it('should return true for YouTube Music watch URLs with playlist parameter', () => {
      expect(
        youtubeService.isValidPlaylistUrl(
          'https://music.youtube.com/watch?v=6DCOjq0omBc&list=RDAMVMz4I2H6Mulc0'
        )
      ).toBe(true);
    });

    it('should return false for video-only URLs without playlist', () => {
      expect(youtubeService.isValidPlaylistUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        false
      );
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
      expect(
        youtubeService.extractPlaylistId(
          'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
        )
      ).toBe('PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
    });

    it('should extract playlist ID from video URLs with list parameter', () => {
      expect(
        youtubeService.extractPlaylistId(
          'https://www.youtube.com/watch?v=abc&list=PLxyz123&index=5'
        )
      ).toBe('PLxyz123');
    });

    it('should return null for URLs without playlist', () => {
      expect(
        youtubeService.extractPlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBeNull();
      expect(youtubeService.extractPlaylistId('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    });
  });

  describe('normalizeUrl', () => {
    it('should convert music.youtube.com to www.youtube.com', () => {
      expect(youtubeService.normalizeUrl('https://music.youtube.com/playlist?list=PLxyz123')).toBe(
        'https://www.youtube.com/playlist?list=PLxyz123'
      );
    });

    it('should leave www.youtube.com URLs unchanged', () => {
      expect(youtubeService.normalizeUrl('https://www.youtube.com/playlist?list=PLxyz123')).toBe(
        'https://www.youtube.com/playlist?list=PLxyz123'
      );
    });

    it('should leave youtube.com URLs unchanged', () => {
      expect(youtubeService.normalizeUrl('https://youtube.com/watch?v=abc123')).toBe(
        'https://youtube.com/watch?v=abc123'
      );
    });
  });
});

describe('parseReleaseYear', () => {
  it('should parse release_year as a number', () => {
    expect(parseReleaseYear(2024, undefined, undefined)).toBe(2024);
    expect(parseReleaseYear(1999, undefined, undefined)).toBe(1999);
  });

  it('should parse release_year as a string', () => {
    expect(parseReleaseYear('2024', undefined, undefined)).toBe(2024);
    expect(parseReleaseYear('1985', undefined, undefined)).toBe(1985);
  });

  it('should fall back to release_date YYYYMMDD format', () => {
    expect(parseReleaseYear(undefined, '20240315', undefined)).toBe(2024);
    expect(parseReleaseYear(undefined, '19991231', undefined)).toBe(1999);
  });

  it('should fall back to upload_date YYYYMMDD format', () => {
    expect(parseReleaseYear(undefined, undefined, '20230612')).toBe(2023);
    expect(parseReleaseYear(undefined, undefined, '20180101')).toBe(2018);
  });

  it('should prefer release_year over release_date over upload_date', () => {
    expect(parseReleaseYear(2024, '20230101', '20220101')).toBe(2024);
    expect(parseReleaseYear(undefined, '20230101', '20220101')).toBe(2023);
  });

  it('should return null for invalid values', () => {
    expect(parseReleaseYear(undefined, undefined, undefined)).toBeNull();
    expect(parseReleaseYear(null, null, null)).toBeNull();
    expect(parseReleaseYear('invalid', 'invalid', 'invalid')).toBeNull();
    expect(parseReleaseYear('', '', '')).toBeNull();
  });

  it('should handle invalid year formats', () => {
    expect(parseReleaseYear('abc', undefined, undefined)).toBeNull();
    expect(parseReleaseYear(undefined, 'not-a-date', undefined)).toBeNull();
  });
});

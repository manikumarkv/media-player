import { describe, it, expect } from 'vitest';
import {
  downloadIdSchema,
  startDownloadSchema,
  getInfoSchema,
  playlistUrlSchema,
  playlistStartSchema,
} from './download.schema.js';

describe('download validation schemas', () => {
  describe('downloadIdSchema', () => {
    it('validates a valid download ID', () => {
      const result = downloadIdSchema.safeParse({ id: 'abc123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty ID', () => {
      const result = downloadIdSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('rejects missing ID', () => {
      const result = downloadIdSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('startDownloadSchema', () => {
    it('validates a valid YouTube URL', () => {
      const result = startDownloadSchema.safeParse({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = startDownloadSchema.safeParse({ url: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('rejects missing URL', () => {
      const result = startDownloadSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('getInfoSchema', () => {
    it('validates a valid URL', () => {
      const result = getInfoSchema.safeParse({
        url: 'https://youtube.com/watch?v=abc123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = getInfoSchema.safeParse({ url: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('playlistUrlSchema', () => {
    it('validates a valid playlist URL', () => {
      const result = playlistUrlSchema.safeParse({
        url: 'https://www.youtube.com/playlist?list=PLxyz123',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid URL', () => {
      const result = playlistUrlSchema.safeParse({ url: 'not-valid' });
      expect(result.success).toBe(false);
    });
  });

  describe('playlistStartSchema', () => {
    describe('basic validation', () => {
      it('validates with only required URL', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://www.youtube.com/playlist?list=PLxyz123',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.url).toBe('https://www.youtube.com/playlist?list=PLxyz123');
          expect(result.data.videoIds).toBeUndefined();
          expect(result.data.createPlaylist).toBeUndefined();
          expect(result.data.playlistName).toBeUndefined();
        }
      });

      it('rejects invalid URL', () => {
        const result = playlistStartSchema.safeParse({ url: 'invalid' });
        expect(result.success).toBe(false);
      });

      it('rejects missing URL', () => {
        const result = playlistStartSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });

    describe('videoIds validation', () => {
      it('validates with videoIds array', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: ['vid1', 'vid2', 'vid3'],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.videoIds).toEqual(['vid1', 'vid2', 'vid3']);
        }
      });

      it('validates with empty videoIds array', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: [],
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.videoIds).toEqual([]);
        }
      });

      it('rejects non-string videoIds', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: [123, 456],
        });
        expect(result.success).toBe(false);
      });

      it('rejects non-array videoIds', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: 'vid1',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('createPlaylist validation', () => {
      it('validates with createPlaylist true', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          createPlaylist: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.createPlaylist).toBe(true);
        }
      });

      it('validates with createPlaylist false', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          createPlaylist: false,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.createPlaylist).toBe(false);
        }
      });

      it('rejects non-boolean createPlaylist', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          createPlaylist: 'yes',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('playlistName validation', () => {
      it('validates with valid playlistName', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          playlistName: 'My Downloaded Music',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.playlistName).toBe('My Downloaded Music');
        }
      });

      it('validates empty playlistName', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          playlistName: '',
        });
        expect(result.success).toBe(true);
      });

      it('validates playlistName at max length (100)', () => {
        const longName = 'a'.repeat(100);
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          playlistName: longName,
        });
        expect(result.success).toBe(true);
      });

      it('rejects playlistName exceeding max length', () => {
        const tooLongName = 'a'.repeat(101);
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          playlistName: tooLongName,
        });
        expect(result.success).toBe(false);
      });

      it('rejects non-string playlistName', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          playlistName: 123,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('combined fields', () => {
      it('validates with all optional fields', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: ['vid1', 'vid2'],
          createPlaylist: true,
          playlistName: 'My Playlist',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            url: 'https://youtube.com/playlist?list=PLxyz123',
            videoIds: ['vid1', 'vid2'],
            createPlaylist: true,
            playlistName: 'My Playlist',
          });
        }
      });

      it('validates with videoIds and createPlaylist without playlistName', () => {
        const result = playlistStartSchema.safeParse({
          url: 'https://youtube.com/playlist?list=PLxyz123',
          videoIds: ['vid1'],
          createPlaylist: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.videoIds).toEqual(['vid1']);
          expect(result.data.createPlaylist).toBe(true);
          expect(result.data.playlistName).toBeUndefined();
        }
      });
    });
  });
});

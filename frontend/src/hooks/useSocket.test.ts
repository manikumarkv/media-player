import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from './useSocket';
import { SOCKET_EVENTS } from '@media-player/shared';

type SocketEventHandler = (data: unknown) => void;

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  id: 'test-socket-id',
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

function findEventHandler(eventName: string): SocketEventHandler | undefined {
  const calls = mockSocket.on.mock.calls as [string, SocketEventHandler][];
  const call = calls.find((c) => c[0] === eventName);
  return call?.[1];
}

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = true;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('connection', () => {
    it('connects to socket on mount', async () => {
      const { io } = await import('socket.io-client');

      renderHook(() => useSocket());

      expect(vi.mocked(io)).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          transports: ['websocket', 'polling'],
        })
      );
    });

    it('disconnects on unmount', () => {
      const { unmount } = renderHook(() => useSocket());

      unmount();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('event listeners', () => {
    it('registers connect event handler', () => {
      renderHook(() => useSocket());

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('registers disconnect event handler', () => {
      renderHook(() => useSocket());

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('registers download event handlers', () => {
      renderHook(() => useSocket());

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DOWNLOAD.STARTED,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DOWNLOAD.PROGRESS,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DOWNLOAD.COMPLETED,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DOWNLOAD.ERROR,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.DOWNLOAD.CANCELLED,
        expect.any(Function)
      );
    });

    it('registers library event handlers', () => {
      renderHook(() => useSocket());

      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.LIBRARY.MEDIA_ADDED,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.LIBRARY.MEDIA_UPDATED,
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        SOCKET_EVENTS.LIBRARY.MEDIA_DELETED,
        expect.any(Function)
      );
    });
  });

  describe('callback invocation', () => {
    it('calls onDownloadStarted when download starts', () => {
      const onDownloadStarted = vi.fn();

      renderHook(() => useSocket({ onDownloadStarted }));

      const startedHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.STARTED);

      const testData = { downloadId: 'test-id', title: 'Test Title' };
      act(() => {
        startedHandler?.(testData);
      });

      expect(onDownloadStarted).toHaveBeenCalledWith(testData);
    });

    it('calls onDownloadProgress when progress updates', () => {
      const onDownloadProgress = vi.fn();

      renderHook(() => useSocket({ onDownloadProgress }));

      const progressHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.PROGRESS);

      const testData = { downloadId: 'test-id', progress: 50 };
      act(() => {
        progressHandler?.(testData);
      });

      expect(onDownloadProgress).toHaveBeenCalledWith(testData);
    });

    it('calls onDownloadCompleted when download completes', () => {
      const onDownloadCompleted = vi.fn();

      renderHook(() => useSocket({ onDownloadCompleted }));

      const completedHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.COMPLETED);

      const testData = { downloadId: 'test-id', mediaId: 'media-123' };
      act(() => {
        completedHandler?.(testData);
      });

      expect(onDownloadCompleted).toHaveBeenCalledWith(testData);
    });

    it('calls onDownloadError when download fails', () => {
      const onDownloadError = vi.fn();

      renderHook(() => useSocket({ onDownloadError }));

      const errorHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.ERROR);

      const testData = { downloadId: 'test-id', error: 'Network error' };
      act(() => {
        errorHandler?.(testData);
      });

      expect(onDownloadError).toHaveBeenCalledWith(testData);
    });

    it('calls onDownloadCancelled when download is cancelled', () => {
      const onDownloadCancelled = vi.fn();

      renderHook(() => useSocket({ onDownloadCancelled }));

      const cancelledHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.CANCELLED);

      const testData = { downloadId: 'test-id' };
      act(() => {
        cancelledHandler?.(testData);
      });

      expect(onDownloadCancelled).toHaveBeenCalledWith(testData);
    });
  });

  describe('undefined callbacks', () => {
    it('handles missing callbacks gracefully', () => {
      renderHook(() => useSocket({}));

      const startedHandler = findEventHandler(SOCKET_EVENTS.DOWNLOAD.STARTED);

      // Should not throw
      expect(() => {
        act(() => {
          startedHandler?.({ downloadId: 'test', title: 'Test' });
        });
      }).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('returns true when socket is connected', () => {
      mockSocket.connected = true;

      const { result } = renderHook(() => useSocket());

      expect(result.current.isConnected()).toBe(true);
    });

    it('returns false when socket is disconnected', () => {
      mockSocket.connected = false;

      const { result } = renderHook(() => useSocket());

      expect(result.current.isConnected()).toBe(false);
    });
  });
});

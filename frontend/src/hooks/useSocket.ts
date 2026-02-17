import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_EVENTS, type DownloadProgressPayload } from '@media-player/shared';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

interface UseSocketOptions {
  onDownloadStarted?: (data: { downloadId: string; title: string }) => void;
  onDownloadProgress?: (data: DownloadProgressPayload) => void;
  onDownloadCompleted?: (data: { downloadId: string; mediaId: string }) => void;
  onDownloadError?: (data: { downloadId: string; error: string }) => void;
  onDownloadCancelled?: (data: { downloadId: string }) => void;
  onMediaAdded?: (data: { mediaId: string }) => void;
  onMediaUpdated?: (data: { mediaId: string }) => void;
  onMediaDeleted?: (data: { mediaId: string }) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  // Store callbacks in refs to avoid re-creating socket connection
  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.info('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.info('Socket disconnected');
    });

    // Download events - use wrapper functions that reference current callbacks
    socket.on(SOCKET_EVENTS.DOWNLOAD.STARTED, (data: { downloadId: string; title: string }) => {
      callbacksRef.current.onDownloadStarted?.(data);
    });

    socket.on(SOCKET_EVENTS.DOWNLOAD.PROGRESS, (data: DownloadProgressPayload) => {
      callbacksRef.current.onDownloadProgress?.(data);
    });

    socket.on(SOCKET_EVENTS.DOWNLOAD.COMPLETED, (data: { downloadId: string; mediaId: string }) => {
      callbacksRef.current.onDownloadCompleted?.(data);
    });

    socket.on(SOCKET_EVENTS.DOWNLOAD.ERROR, (data: { downloadId: string; error: string }) => {
      callbacksRef.current.onDownloadError?.(data);
    });

    socket.on(SOCKET_EVENTS.DOWNLOAD.CANCELLED, (data: { downloadId: string }) => {
      callbacksRef.current.onDownloadCancelled?.(data);
    });

    // Library events
    socket.on(SOCKET_EVENTS.LIBRARY.MEDIA_ADDED, (data: { mediaId: string }) => {
      callbacksRef.current.onMediaAdded?.(data);
    });

    socket.on(SOCKET_EVENTS.LIBRARY.MEDIA_UPDATED, (data: { mediaId: string }) => {
      callbacksRef.current.onMediaUpdated?.(data);
    });

    socket.on(SOCKET_EVENTS.LIBRARY.MEDIA_DELETED, (data: { mediaId: string }) => {
      callbacksRef.current.onMediaDeleted?.(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Empty dependency array - socket connects once

  const isConnected = useCallback(() => {
    return socketRef.current?.connected ?? false;
  }, []);

  return { isConnected };
}

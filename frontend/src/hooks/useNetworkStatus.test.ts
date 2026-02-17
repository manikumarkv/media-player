import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from './useNetworkStatus';

describe('useNetworkStatus', () => {
  let onLineSpy: MockInstance;

  beforeEach(() => {
    onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    onLineSpy.mockRestore();
  });

  describe('initial state', () => {
    it('returns true when browser is online', () => {
      onLineSpy.mockReturnValue(true);
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
    });

    it('returns false when browser is offline', () => {
      onLineSpy.mockReturnValue(false);
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('event handling', () => {
    it('updates to offline when offline event fires', () => {
      onLineSpy.mockReturnValue(true);
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      onLineSpy.mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('updates to online when online event fires', () => {
      onLineSpy.mockReturnValue(false);
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(false);

      onLineSpy.mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('handles multiple state changes', () => {
      onLineSpy.mockReturnValue(true);
      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);

      // Go offline
      onLineSpy.mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);

      // Go online
      onLineSpy.mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);

      // Go offline again
      onLineSpy.mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes event listeners on unmount', () => {
      const addEventSpy = vi.spyOn(window, 'addEventListener');
      const removeEventSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useNetworkStatus());

      expect(addEventSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(removeEventSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      addEventSpy.mockRestore();
      removeEventSpy.mockRestore();
    });
  });
});

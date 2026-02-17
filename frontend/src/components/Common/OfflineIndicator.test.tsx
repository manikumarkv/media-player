/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineIndicator } from './OfflineIndicator';

describe('OfflineIndicator', () => {
  let onLineSpy: MockInstance;

  beforeEach(() => {
    // Default to online state
    onLineSpy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    onLineSpy.mockRestore();
  });

  describe('rendering', () => {
    it('does not render when online', () => {
      onLineSpy.mockReturnValue(true);
      render(<OfflineIndicator />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders warning banner when offline', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText("You're offline")).toBeInTheDocument();
    });

    it('displays offline message with description', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      expect(screen.getByText(/Your music still plays offline/i)).toBeInTheDocument();
    });

    it('renders WifiOff icon when offline', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });
  });

  describe('network status changes', () => {
    it('shows indicator when going offline', () => {
      onLineSpy.mockReturnValue(true);
      render(<OfflineIndicator />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      // Simulate going offline
      onLineSpy.mockReturnValue(false);
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('hides indicator when going online', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Simulate going online
      onLineSpy.mockReturnValue(true);
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA role', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('has accessible description text', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent("You're offline");
    });
  });

  describe('styling', () => {
    it('has warning styles', () => {
      onLineSpy.mockReturnValue(false);
      render(<OfflineIndicator />);

      const indicator = screen.getByRole('alert');
      expect(indicator).toHaveClass('offline-indicator');
    });
  });
});

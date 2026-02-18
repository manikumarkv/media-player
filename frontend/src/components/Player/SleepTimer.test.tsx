/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SleepTimer } from './SleepTimer';
import { useSleepTimerStore } from '../../stores/sleepTimerStore';

// Mock the player store
vi.mock('../../stores/playerStore', () => ({
  usePlayerStore: vi.fn(() => ({
    pause: vi.fn(),
    volume: 1,
  })),
}));

describe('SleepTimer', () => {
  beforeEach(() => {
    useSleepTimerStore.getState().clearTimer();
  });

  describe('rendering', () => {
    it('renders the sleep timer button', () => {
      render(<SleepTimer />);

      expect(screen.getByRole('button', { name: /sleep timer/i })).toBeInTheDocument();
    });

    it('shows moon icon when inactive', () => {
      render(<SleepTimer />);

      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });
  });

  describe('popover', () => {
    it('opens popover when button is clicked', () => {
      render(<SleepTimer />);

      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));

      expect(screen.getByText('Sleep Timer')).toBeInTheDocument();
    });

    it('shows time presets', () => {
      render(<SleepTimer />);

      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));

      expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '30m' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '45m' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '60m' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '90m' })).toBeInTheDocument();
    });
  });

  describe('timer activation', () => {
    it('starts timer when preset is clicked', () => {
      render(<SleepTimer />);

      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));
      fireEvent.click(screen.getByRole('button', { name: '30m' }));

      expect(useSleepTimerStore.getState().isActive).toBe(true);
    });

    it('closes popover after selecting preset', () => {
      render(<SleepTimer />);

      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));
      fireEvent.click(screen.getByRole('button', { name: '30m' }));

      // Popover should be closed, so "Sleep Timer" title should not be visible
      expect(screen.queryByText('Stop playback after')).not.toBeInTheDocument();
    });
  });

  describe('timer cancellation', () => {
    it('shows cancel button when timer is active', () => {
      // Start a timer first
      useSleepTimerStore.getState().setTimer(30);

      render(<SleepTimer />);
      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('cancels timer when cancel button is clicked', () => {
      // Start a timer first
      useSleepTimerStore.getState().setTimer(30);

      render(<SleepTimer />);
      fireEvent.click(screen.getByRole('button', { name: /sleep timer/i }));
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(useSleepTimerStore.getState().isActive).toBe(false);
    });
  });

  describe('active state display', () => {
    it('shows remaining time in button when active', () => {
      useSleepTimerStore.getState().setTimer(30);
      useSleepTimerStore.getState().updateRemaining();

      render(<SleepTimer />);

      // Should show countdown in the button
      expect(screen.getByText('30:00')).toBeInTheDocument();
    });

    it('button has active class when timer is running', () => {
      useSleepTimerStore.getState().setTimer(30);

      render(<SleepTimer />);

      const button = screen.getByRole('button', { name: /sleep timer/i });
      expect(button).toHaveClass('active');
    });
  });
});

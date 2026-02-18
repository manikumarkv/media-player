/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { FirstRunModal } from './FirstRunModal';
import { LegalConsent } from '../../utils/legal';

function renderWithRouter(component: React.ReactNode) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('FirstRunModal', () => {
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    mockOnAccept.mockClear();
  });

  describe('rendering', () => {
    it('renders the modal', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays welcome header', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      expect(screen.getByText(/Welcome to Media Player/i)).toBeInTheDocument();
    });

    it('displays educational use info', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      expect(screen.getByText(/Educational & Personal Use/i)).toBeInTheDocument();
    });

    it('displays one checkbox', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(1);
    });

    it('displays accept button disabled by default', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const acceptButton = screen.getByRole('button', { name: /get started/i });
      expect(acceptButton).toBeDisabled();
    });
  });

  describe('checkbox interactions', () => {
    it('enables accept button when checkbox is checked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', { name: /get started/i });

      // Initially disabled
      expect(acceptButton).toBeDisabled();

      // Check - now enabled
      await user.click(checkbox);
      expect(acceptButton).not.toBeDisabled();
    });

    it('disables accept button when checkbox is unchecked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      const acceptButton = screen.getByRole('button', { name: /get started/i });

      // Check then uncheck
      await user.click(checkbox);
      expect(acceptButton).not.toBeDisabled();

      await user.click(checkbox);
      expect(acceptButton).toBeDisabled();
    });
  });

  describe('accept action', () => {
    it('calls onAccept when accept button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await user.click(screen.getByRole('button', { name: /get started/i }));

      expect(mockOnAccept).toHaveBeenCalledTimes(1);
    });

    it('saves consent to localStorage when accepted', async () => {
      const user = userEvent.setup();
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await user.click(screen.getByRole('button', { name: /get started/i }));

      expect(LegalConsent.hasAccepted()).toBe(true);
    });
  });

  describe('links', () => {
    it('has link to disclaimer page', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const link = screen.getByRole('link', { name: /disclaimer/i });
      expect(link).toHaveAttribute('href', '/disclaimer');
    });

    it('has link to GPL license', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      const link = screen.getByRole('link', { name: /GPL-3.0/i });
      expect(link).toHaveAttribute('href', 'https://www.gnu.org/licenses/gpl-3.0.en.html');
    });
  });

  describe('accessibility', () => {
    it('has dialog role', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has accessible modal title', () => {
      renderWithRouter(<FirstRunModal onAccept={mockOnAccept} />);

      expect(screen.getByRole('heading', { name: /Welcome to Media Player/i })).toBeInTheDocument();
    });
  });
});

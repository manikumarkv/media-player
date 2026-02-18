/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LegalSettings } from './LegalSettings';
import { LegalConsent } from '../../utils/legal';

function renderWithRouter(component: React.ReactNode) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('LegalSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    LegalConsent.accept(); // Assume user has accepted ToS
  });

  describe('rendering', () => {
    it('renders legal settings section', () => {
      renderWithRouter(<LegalSettings />);

      expect(screen.getByRole('heading', { name: /Terms of Service/i })).toBeInTheDocument();
    });

    it('displays acceptance date when accepted', () => {
      renderWithRouter(<LegalSettings />);

      expect(screen.getByText(/You accepted the Terms of Service/i)).toBeInTheDocument();
    });

    it('displays revoke consent button', () => {
      renderWithRouter(<LegalSettings />);

      expect(screen.getByRole('button', { name: /revoke consent/i })).toBeInTheDocument();
    });

    it('displays links to legal documents', () => {
      renderWithRouter(<LegalSettings />);

      expect(screen.getByRole('link', { name: /disclaimer/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /GPL-3.0 License/i })).toBeInTheDocument();
    });
  });

  describe('revoke consent', () => {
    it('shows confirmation message when revoke button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LegalSettings />);

      await user.click(screen.getByRole('button', { name: /revoke consent/i }));

      expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    });

    it('revokes consent and reloads when confirmed', async () => {
      const user = userEvent.setup();
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      renderWithRouter(<LegalSettings />);

      await user.click(screen.getByRole('button', { name: /revoke consent/i }));
      await user.click(screen.getByRole('button', { name: /yes, revoke/i }));

      expect(LegalConsent.hasAccepted()).toBe(false);
      expect(mockReload).toHaveBeenCalled();
    });

    it('cancels revoke when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LegalSettings />);

      await user.click(screen.getByRole('button', { name: /revoke consent/i }));
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(LegalConsent.hasAccepted()).toBe(true);
      expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
    });
  });
});

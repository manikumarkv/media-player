/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { EducationalBanner } from './EducationalBanner';

const STORAGE_KEY = 'educational-banner-dismissed';

function renderWithRouter(component: React.ReactNode) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('EducationalBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the banner', () => {
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('displays warning icon', () => {
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('displays educational purposes text', () => {
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByText(/For Educational Purposes Only/i)).toBeInTheDocument();
    });

    it('has a dismiss button', () => {
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });
  });

  describe('dismiss functionality', () => {
    it('hides banner when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByRole('banner')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });

    it('saves dismissed state to localStorage', async () => {
      const user = userEvent.setup();
      renderWithRouter(<EducationalBanner />);

      await user.click(screen.getByRole('button', { name: /dismiss/i }));

      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });

    it('does not render if previously dismissed', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      renderWithRouter(<EducationalBanner />);

      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });
  });

  describe('link to disclaimer', () => {
    it('contains a link to the disclaimer', () => {
      renderWithRouter(<EducationalBanner />);

      const link = screen.getByRole('link', { name: /learn more|disclaimer/i });
      expect(link).toBeInTheDocument();
    });

    it('link points to DISCLAIMER.md or disclaimer page', () => {
      renderWithRouter(<EducationalBanner />);

      const link = screen.getByRole('link', { name: /learn more|disclaimer/i });
      expect(link).toHaveAttribute('href', expect.stringMatching(/disclaimer/i));
    });
  });

  describe('accessibility', () => {
    it('has banner role for landmark navigation', () => {
      renderWithRouter(<EducationalBanner />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('has accessible text content', () => {
      renderWithRouter(<EducationalBanner />);

      const banner = screen.getByRole('banner');
      expect(banner).toHaveTextContent(/educational/i);
    });
  });

  describe('styling', () => {
    it('has warning/educational styles', () => {
      renderWithRouter(<EducationalBanner />);

      const banner = screen.getByRole('banner');
      expect(banner).toHaveClass('educational-banner');
    });
  });
});

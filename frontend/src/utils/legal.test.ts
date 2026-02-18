import { describe, it, expect, beforeEach } from 'vitest';
import { LegalConsent } from './legal';

describe('LegalConsent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('hasAccepted', () => {
    it('returns false when no consent has been given', () => {
      expect(LegalConsent.hasAccepted()).toBe(false);
    });

    it('returns true when consent has been accepted', () => {
      LegalConsent.accept();
      expect(LegalConsent.hasAccepted()).toBe(true);
    });

    it('returns false when consent version is outdated', () => {
      localStorage.setItem('legal-consent-accepted', '0.0.1');
      expect(LegalConsent.hasAccepted()).toBe(false);
    });

    it('returns true when consent version matches current', () => {
      localStorage.setItem('legal-consent-accepted', LegalConsent.VERSION);
      expect(LegalConsent.hasAccepted()).toBe(true);
    });
  });

  describe('accept', () => {
    it('sets consent in localStorage', () => {
      LegalConsent.accept();
      expect(localStorage.getItem('legal-consent-accepted')).toBe(LegalConsent.VERSION);
    });

    it('sets acceptance date in localStorage', () => {
      LegalConsent.accept();
      const date = localStorage.getItem('legal-consent-date');
      expect(date).not.toBeNull();
      if (date !== null) {
        expect(() => new Date(date)).not.toThrow();
      }
    });
  });

  describe('getAcceptanceDate', () => {
    it('returns null when no consent has been given', () => {
      expect(LegalConsent.getAcceptanceDate()).toBeNull();
    });

    it('returns date string when consent has been given', () => {
      LegalConsent.accept();
      const date = LegalConsent.getAcceptanceDate();
      expect(date).not.toBeNull();
      if (date !== null) {
        expect(new Date(date).getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  describe('revoke', () => {
    it('removes consent from localStorage', () => {
      LegalConsent.accept();
      expect(LegalConsent.hasAccepted()).toBe(true);

      LegalConsent.revoke();
      expect(LegalConsent.hasAccepted()).toBe(false);
    });

    it('removes acceptance date from localStorage', () => {
      LegalConsent.accept();
      expect(LegalConsent.getAcceptanceDate()).toBeTruthy();

      LegalConsent.revoke();
      expect(LegalConsent.getAcceptanceDate()).toBeNull();
    });
  });

  describe('VERSION', () => {
    it('is defined', () => {
      expect(LegalConsent.VERSION).toBeDefined();
      expect(typeof LegalConsent.VERSION).toBe('string');
    });
  });
});

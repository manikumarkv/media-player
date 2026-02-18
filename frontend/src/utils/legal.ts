/**
 * LegalConsent utility for managing user acceptance of Terms of Service.
 * Uses localStorage to persist consent across sessions.
 * Version tracking ensures users re-accept when terms change.
 */
export const LegalConsent = {
  KEY: 'legal-consent-accepted',
  DATE_KEY: 'legal-consent-date',
  VERSION: '1.0.0', // Increment when ToS changes to require re-acceptance

  /**
   * Check if user has accepted the current version of terms
   */
  hasAccepted(): boolean {
    const consent = localStorage.getItem(this.KEY);
    return consent === this.VERSION;
  },

  /**
   * Record user acceptance of terms
   */
  accept(): void {
    localStorage.setItem(this.KEY, this.VERSION);
    localStorage.setItem(this.DATE_KEY, new Date().toISOString());
  },

  /**
   * Get the date when user accepted terms
   */
  getAcceptanceDate(): string | null {
    return localStorage.getItem(this.DATE_KEY);
  },

  /**
   * Revoke consent (user will see ToS modal again)
   */
  revoke(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.DATE_KEY);
  },
};

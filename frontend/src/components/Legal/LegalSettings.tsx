import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LegalConsent } from '../../utils/legal';
import './Legal.css';

/**
 * LegalSettings component for managing Terms of Service consent.
 * Displays acceptance status and allows users to revoke consent.
 */
export function LegalSettings() {
  const [showConfirm, setShowConfirm] = useState(false);
  const acceptanceDate = LegalConsent.getAcceptanceDate();

  const handleRevokeClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmRevoke = useCallback(() => {
    LegalConsent.revoke();
    window.location.reload();
  }, []);

  const handleCancelRevoke = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) {
      return 'Unknown date';
    }
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="legal-settings">
      <h3 className="legal-settings-title">Terms of Service</h3>

      <p className="legal-settings-info">
        You accepted the Terms of Service on {formatDate(acceptanceDate)}.
      </p>

      <div className="legal-settings-links">
        <Link to="/disclaimer" className="legal-settings-link">
          View Disclaimer
        </Link>
        <a
          href="https://www.gnu.org/licenses/gpl-3.0.en.html"
          target="_blank"
          rel="noopener noreferrer"
          className="legal-settings-link"
        >
          GPL-3.0 License
        </a>
      </div>

      {showConfirm ? (
        <div className="legal-revoke-confirm">
          <p className="legal-revoke-message">
            Are you sure you want to revoke your consent? You will need to accept the Terms of
            Service again to use the app.
          </p>
          <div className="legal-revoke-actions">
            <button onClick={handleCancelRevoke} className="legal-button-decline">
              Cancel
            </button>
            <button onClick={handleConfirmRevoke} className="legal-revoke-button">
              Yes, Revoke
            </button>
          </div>
        </div>
      ) : (
        <button onClick={handleRevokeClick} className="legal-revoke-button">
          Revoke Consent
        </button>
      )}
    </div>
  );
}

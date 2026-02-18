import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LegalConsent } from '../../utils/legal';
import { InfoIcon } from '../Icons';
import './Legal.css';

interface FirstRunModalProps {
  onAccept: () => void;
}

/**
 * FirstRunModal displays an informational welcome dialog.
 * Users must acknowledge the terms before proceeding.
 * Shown on first app launch or when ToS version changes.
 */
export function FirstRunModal({ onAccept }: FirstRunModalProps) {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const handleAccept = useCallback(() => {
    if (!hasAcknowledged) {
      return;
    }
    LegalConsent.accept();
    onAccept();
  }, [hasAcknowledged, onAccept]);

  return (
    <div
      className="legal-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div className="legal-modal legal-modal-info">
        {/* Header */}
        <header className="legal-modal-header legal-modal-header-info">
          <InfoIcon size={28} />
          <div>
            <h2 id="legal-modal-title" className="legal-modal-title">
              Welcome to Media Player
            </h2>
            <p className="legal-modal-subtitle">A few things to know before you start</p>
          </div>
        </header>

        {/* Content */}
        <div className="legal-modal-content">
          {/* Info Box */}
          <div className="legal-info-box">
            <h3 className="legal-info-title">For Educational & Personal Use</h3>
            <p className="legal-info-text">
              This open-source tool lets you download and organize media for offline listening.
              Please use it responsibly and respect content creators' rights.
            </p>
          </div>

          {/* Quick Info */}
          <div className="legal-quick-info">
            <div className="legal-quick-item">
              <span className="legal-quick-label">License:</span>
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.en.html"
                target="_blank"
                rel="noopener noreferrer"
                className="legal-link"
              >
                GPL-3.0 (Open Source)
              </a>
            </div>
            <div className="legal-quick-item">
              <span className="legal-quick-label">More info:</span>
              <Link to="/disclaimer" className="legal-link">
                View full disclaimer
              </Link>
            </div>
          </div>

          {/* Single Checkbox */}
          <label className="legal-checkbox-label legal-checkbox-single">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => {
                setHasAcknowledged(e.target.checked);
              }}
              className="legal-checkbox"
            />
            <span>
              I understand this is for personal/educational use and I'm responsible for ensuring I
              have the right to download any content
            </span>
          </label>
        </div>

        {/* Footer */}
        <footer className="legal-modal-footer legal-modal-footer-simple">
          <button
            onClick={handleAccept}
            disabled={!hasAcknowledged}
            className={`legal-button-accept ${hasAcknowledged ? '' : 'disabled'}`}
          >
            Get Started
          </button>
        </footer>
      </div>
    </div>
  );
}

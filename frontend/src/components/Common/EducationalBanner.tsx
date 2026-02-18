import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { WarningIcon, CloseIcon } from '../Icons';

const STORAGE_KEY = 'educational-banner-dismissed';

/**
 * EducationalBanner displays a warning banner at the top of the app.
 * Users can dismiss the banner and the state is persisted in localStorage.
 * It informs users that the software is for educational purposes only.
 */
export function EducationalBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsDismissed(true);
  }, []);

  if (isDismissed) {
    return null;
  }

  return (
    <header className="educational-banner" role="banner">
      <WarningIcon size={18} data-testid="warning-icon" aria-hidden="true" />
      <span className="educational-banner-text">
        <strong>For Educational Purposes Only</strong>
        <span className="educational-banner-separator"> — </span>
        <span className="educational-banner-description">
          This software is provided for educational and research purposes.
        </span>
      </span>
      <Link to="/disclaimer" className="educational-banner-link">
        Learn More
      </Link>
      <button
        className="educational-banner-dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss banner"
      >
        <CloseIcon size={16} aria-hidden="true" />
      </button>
    </header>
  );
}

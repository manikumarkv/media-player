import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOffIcon } from '../Icons';

/**
 * OfflineIndicator displays a warning banner when the user is offline.
 * Shows a WifiOff icon with a message explaining offline capabilities.
 */
export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="offline-indicator" role="alert">
      <WifiOffIcon size={16} data-testid="wifi-off-icon" />
      <span className="offline-indicator-message">
        <strong>You're offline</strong>
        <span className="offline-indicator-description">
          Your music still plays offline. Downloads require internet.
        </span>
      </span>
    </div>
  );
}

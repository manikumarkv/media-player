interface AuthMethodSelectorProps {
  onSelectMethod: (method: 'cookie') => void;
}

export function AuthMethodSelector({ onSelectMethod }: AuthMethodSelectorProps) {
  return (
    <div className="auth-method-selector">
      <p className="auth-method-description">
        Connect your YouTube account to sync your liked videos:
      </p>

      <div className="auth-methods">
        <button
          className="auth-method-button"
          onClick={() => { onSelectMethod('cookie'); }}
        >
          <span className="auth-method-icon">🍪</span>
          <div className="auth-method-content">
            <span className="auth-method-title">Upload Cookies</span>
            <span className="auth-method-subtitle">
              Export cookies using browser extension
            </span>
          </div>
        </button>
      </div>

      <div className="auth-method-help">
        <h4>How to export cookies:</h4>
        <ol>
          <li>Install a cookie export extension (e.g., "Get cookies.txt LOCALLY")</li>
          <li>Go to YouTube and make sure you're logged in</li>
          <li>Click the extension and export cookies for youtube.com</li>
          <li>Upload the .txt file or paste the contents</li>
        </ol>
      </div>
    </div>
  );
}

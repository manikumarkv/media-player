import { useState } from 'react';

interface CookieUploadFlowProps {
  onAuth: (cookies: string) => Promise<boolean>;
  onSuccess: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function CookieUploadFlow({
  onAuth,
  onSuccess,
  onBack,
  isLoading,
}: CookieUploadFlowProps) {
  const [cookieContent, setCookieContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cookieContent.trim()) {
      return;
    }

    void (async () => {
      const success = await onAuth(cookieContent);
      if (success) {
        onSuccess();
      }
    })();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCookieContent(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="cookie-upload-flow">
      <button className="back-button" onClick={onBack}>
        ← Back
      </button>

      <h3>Upload YouTube Cookies</h3>

      <p className="cookie-upload-description">
        Paste the contents of your exported cookies.txt file, or upload the file
        directly.
      </p>

      <form onSubmit={handleSubmit} className="cookie-upload-form">
        <div className="file-upload-wrapper">
          <label htmlFor="cookie-file" className="file-upload-label">
            <span>📄 Upload cookies.txt file</span>
            <input
              type="file"
              id="cookie-file"
              accept=".txt"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
        </div>

        <div className="or-divider">
          <span>or paste content directly</span>
        </div>

        <textarea
          value={cookieContent}
          onChange={(e) => { setCookieContent(e.target.value); }}
          placeholder="# Netscape HTTP Cookie File&#10;.youtube.com	TRUE	/	TRUE	..."
          rows={10}
          disabled={isLoading}
          aria-label="Cookie content"
        />

        <div className="cookie-upload-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={onBack}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={isLoading || !cookieContent.trim()}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </form>
    </div>
  );
}

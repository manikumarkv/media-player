import type { ReactNode } from 'react';
import { Button } from './Button';
import './Common.css';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: ReactNode;
  fullScreen?: boolean;
}

export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try again',
  icon,
  fullScreen = false,
}: ErrorMessageProps) {
  const content = (
    <div className="error-message" role="alert">
      <div className="error-message-icon">{icon ?? <ErrorIcon />}</div>
      <h3 className="error-message-title">{title}</h3>
      <p className="error-message-text">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} icon={<RetryIcon />}>
          {retryText}
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return <div className="error-message-fullscreen">{content}</div>;
  }

  return content;
}

interface InlineErrorProps {
  message: string;
}

export function InlineError({ message }: InlineErrorProps) {
  return (
    <p className="inline-error" role="alert">
      <ErrorIcon size={16} />
      <span>{message}</span>
    </p>
  );
}

function ErrorIcon({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  );
}

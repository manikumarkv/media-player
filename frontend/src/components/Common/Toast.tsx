import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, CloseIcon } from '../Icons';
import './Common.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
  defaultDuration?: number;
}

export function ToastProvider({
  children,
  maxToasts = 5,
  defaultDuration = 3000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = defaultDuration) => {
      const id = `toast-${Date.now().toString()}-${Math.random().toString(36).slice(2)}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => {
        const newToasts = [...prev, toast];
        // Remove oldest if exceeding max
        if (newToasts.length > maxToasts) {
          return newToasts.slice(1);
        }
        return newToasts;
      });

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [defaultDuration, maxToasts, removeToast]
  );

  const value: ToastContextValue = {
    showToast,
    success: (msg, dur) => {
      showToast('success', msg, dur);
    },
    error: (msg, dur) => {
      showToast('error', msg, dur);
    },
    warning: (msg, dur) => {
      showToast('warning', msg, dur);
    },
    info: (msg, dur) => {
      showToast('info', msg, dur);
    },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-container" role="region" aria-label="Notifications">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => {
                removeToast(toast.id);
              }}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Wait for exit animation
  }, [onDismiss]);

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`} role="alert">
      <ToastIcon type={toast.type} />
      <span className="toast-message">{toast.message}</span>
      <button className="toast-dismiss" onClick={handleDismiss} aria-label="Dismiss notification">
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return <SuccessIcon size={20} />;
    case 'error':
      return <ErrorIcon size={20} />;
    case 'warning':
      return <WarningIcon size={20} />;
    case 'info':
      return <InfoIcon size={20} />;
  }
}

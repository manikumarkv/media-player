import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import './Common.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth && 'btn-full-width',
      loading && 'btn-loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="btn-spinner" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="btn-icon">{icon}</span>
        )}
        {children && <span className="btn-text">{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="btn-icon">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AddIcon as AddIconBase,
  QueueIcon as QueueIconBase,
  PlaylistAddIcon as PlaylistAddIconBase,
  DeleteIcon as DeleteIconBase,
  EditIcon as EditIconBase,
} from '../Icons';
import './Common.css';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  items: MenuItem[];
  children: ReactNode;
  disabled?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function ContextMenu({ items, children, disabled = false }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Calculate position, ensuring menu stays in viewport
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - items.length * 40);

      setPosition({ x, y });
      setIsOpen(true);
    },
    [disabled, items.length]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.disabled) {
        return;
      }
      item.onClick?.();
      handleClose();
    },
    [handleClose]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleClose]);

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="context-menu"
            style={{ left: position.x, top: position.y }}
            role="menu"
          >
            {items.map((item) =>
              item.divider ? (
                <div key={item.id} className="context-menu-divider" />
              ) : (
                <button
                  key={item.id}
                  className={`context-menu-item ${item.danger ? 'danger' : ''} ${
                    item.disabled ? 'disabled' : ''
                  }`}
                  onClick={() => {
                    handleItemClick(item);
                  }}
                  disabled={item.disabled}
                  role="menuitem"
                >
                  {item.icon && <span className="context-menu-icon">{item.icon}</span>}
                  <span className="context-menu-label">{item.label}</span>
                </button>
              )
            )}
          </div>,
          document.body
        )}
    </>
  );
}

// Re-export icons with default size 16 for context menu usage
export function AddIcon() {
  return <AddIconBase size={16} />;
}

export function QueueIcon() {
  return <QueueIconBase size={16} />;
}

export function PlaylistAddIcon() {
  return <PlaylistAddIconBase size={16} />;
}

export function DeleteIcon() {
  return <DeleteIconBase size={16} />;
}

export function EditIcon() {
  return <EditIconBase size={16} />;
}

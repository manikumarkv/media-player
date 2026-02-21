import { ENDPOINTS } from '@media-player/shared';
import { SuccessIcon } from '../Icons';
import type { ExportableItem } from '../../api/client';

interface ExportItemCardProps {
  item: ExportableItem;
  isSelected: boolean;
  isExported: boolean;
  onToggle: () => void;
}

export function ExportItemCard({
  item,
  isSelected,
  isExported,
  onToggle,
}: ExportItemCardProps) {
  const thumbnailUrl = item.coverMediaId
    ? ENDPOINTS.media.thumbnail(item.coverMediaId)
    : null;

  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds) {
      return '';
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${String(hours)}h ${String(mins)}m`;
    }
    return `${String(mins)} min`;
  };

  return (
    <div
      className={`export-item-card ${isSelected ? 'selected' : ''} ${isExported ? 'exported' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${item.name}, ${String(item.trackCount)} tracks${isExported ? ', already exported' : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="export-item-checkbox">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          aria-label={`Select ${item.name}`}
          onClick={(e) => { e.stopPropagation(); }}
        />
      </div>

      <div className="export-item-thumbnail">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name}
            loading="lazy"
          />
        ) : (
          <div className="export-item-thumbnail-placeholder">
            <span>{item.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="export-item-info">
        <h3 className="export-item-name">{item.name}</h3>
        {item.artist && <p className="export-item-artist">{item.artist}</p>}
        <p className="export-item-meta">
          {String(item.trackCount)} {item.trackCount === 1 ? 'track' : 'tracks'}
          {item.totalDuration ? ` • ${formatDuration(item.totalDuration)}` : ''}
        </p>
      </div>

      <div className="export-item-status">
        {isExported ? (
          <span className="export-status-badge exported" aria-label="Already exported">
            <SuccessIcon size={16} />
            Exported
          </span>
        ) : (
          <span className="export-status-badge not-exported" aria-label="Not exported">
            Not Exported
          </span>
        )}
      </div>
    </div>
  );
}

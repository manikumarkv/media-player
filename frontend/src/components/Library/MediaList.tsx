import { MediaRow } from './MediaRow';
import type { Media } from '../../api/client';
import './Library.css';

interface MediaListProps {
  media: Media[];
  showHeader?: boolean;
  onRemove?: (mediaId: string) => void;
}

export function MediaList({ media, showHeader = true, onRemove }: MediaListProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className="media-list">
      {showHeader && (
        <div className="media-list-header">
          <div className="header-index">#</div>
          <div className="header-title">Title</div>
          <div className="header-album">Album</div>
          <div className="header-duration">
            <ClockIcon />
          </div>
        </div>
      )}
      <div className="media-list-body">
        {media.map((item, index) => (
          <MediaRow key={item.id} media={item} index={index} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
    </svg>
  );
}

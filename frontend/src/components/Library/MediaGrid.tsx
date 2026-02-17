import { MediaCard } from './MediaCard';
import { type Media } from '../../api/client';
import './Library.css';

interface MediaGridProps {
  media: Media[];
  compact?: boolean;
}

export function MediaGrid({ media, compact = false }: MediaGridProps) {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className={`media-grid ${compact ? 'compact' : ''}`}>
      {media.map((item) => (
        <MediaCard key={item.id} media={item} />
      ))}
    </div>
  );
}

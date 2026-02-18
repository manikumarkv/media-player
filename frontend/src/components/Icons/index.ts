/**
 * Centralized Icon Library
 *
 * This module re-exports lucide-react icons with semantic names
 * that match the application's domain language.
 *
 * @example
 * import { PlayIcon, HeartIcon } from '@/components/Icons';
 *
 * // Basic usage
 * <PlayIcon size={24} />
 *
 * // With fill for solid heart
 * <HeartIcon size={16} fill={isLiked ? 'currentColor' : 'none'} />
 */

// Player Controls
export {
  Play as PlayIcon,
  Pause as PauseIcon,
  SkipBack as PreviousIcon,
  SkipForward as NextIcon,
  Shuffle as ShuffleIcon,
  Repeat as RepeatIcon,
  Repeat1 as RepeatOneIcon,
} from 'lucide-react';

// Volume Controls
export {
  Volume2 as VolumeHighIcon,
  Volume1 as VolumeLowIcon,
  VolumeX as VolumeMuteIcon,
} from 'lucide-react';

// Media
export { Music as MusicNoteIcon, Heart as HeartIcon } from 'lucide-react';

// Actions
export {
  MoreVertical as MoreIcon,
  ListMusic as QueueIcon,
  ListPlus as PlaylistAddIcon,
  Minus as RemoveIcon,
  Plus as AddIcon,
  Trash2 as DeleteIcon,
  Pencil as EditIcon,
  X as CloseIcon,
} from 'lucide-react';

// Navigation
export {
  Home as HomeIcon,
  Library as LibraryIcon,
  Download as DownloadIcon,
  Clock as HistoryIcon,
  Settings as SettingsIcon,
} from 'lucide-react';

// Network Status
export { WifiOff as WifiOffIcon, Wifi as WifiIcon } from 'lucide-react';

// Toast Notifications
export {
  CheckCircle as SuccessIcon,
  XCircle as ErrorIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon,
} from 'lucide-react';

// Re-export the props type for consumers who need to type their own wrappers
export type { LucideProps as IconProps } from 'lucide-react';

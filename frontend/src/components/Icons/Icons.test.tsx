/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  PlayIcon,
  PauseIcon,
  PreviousIcon,
  NextIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMuteIcon,
  MusicNoteIcon,
  HeartIcon,
  MoreIcon,
  QueueIcon,
  PlaylistAddIcon,
  RemoveIcon,
  AddIcon,
  DeleteIcon,
  EditIcon,
  CloseIcon,
  HomeIcon,
  LibraryIcon,
  DownloadIcon,
  HistoryIcon,
  SuccessIcon,
  ErrorIcon,
  WarningIcon,
  InfoIcon,
} from './index';

describe('Icons', () => {
  describe('Player Icons', () => {
    it('renders PlayIcon', () => {
      render(<PlayIcon data-testid="play-icon" />);
      expect(screen.getByTestId('play-icon')).toBeInTheDocument();
    });

    it('renders PauseIcon', () => {
      render(<PauseIcon data-testid="pause-icon" />);
      expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    });

    it('renders PreviousIcon (SkipBack)', () => {
      render(<PreviousIcon data-testid="previous-icon" />);
      expect(screen.getByTestId('previous-icon')).toBeInTheDocument();
    });

    it('renders NextIcon (SkipForward)', () => {
      render(<NextIcon data-testid="next-icon" />);
      expect(screen.getByTestId('next-icon')).toBeInTheDocument();
    });

    it('renders ShuffleIcon', () => {
      render(<ShuffleIcon data-testid="shuffle-icon" />);
      expect(screen.getByTestId('shuffle-icon')).toBeInTheDocument();
    });

    it('renders RepeatIcon', () => {
      render(<RepeatIcon data-testid="repeat-icon" />);
      expect(screen.getByTestId('repeat-icon')).toBeInTheDocument();
    });

    it('renders RepeatOneIcon', () => {
      render(<RepeatOneIcon data-testid="repeat-one-icon" />);
      expect(screen.getByTestId('repeat-one-icon')).toBeInTheDocument();
    });
  });

  describe('Volume Icons', () => {
    it('renders VolumeHighIcon', () => {
      render(<VolumeHighIcon data-testid="volume-high-icon" />);
      expect(screen.getByTestId('volume-high-icon')).toBeInTheDocument();
    });

    it('renders VolumeLowIcon', () => {
      render(<VolumeLowIcon data-testid="volume-low-icon" />);
      expect(screen.getByTestId('volume-low-icon')).toBeInTheDocument();
    });

    it('renders VolumeMuteIcon', () => {
      render(<VolumeMuteIcon data-testid="volume-mute-icon" />);
      expect(screen.getByTestId('volume-mute-icon')).toBeInTheDocument();
    });
  });

  describe('Media Icons', () => {
    it('renders MusicNoteIcon', () => {
      render(<MusicNoteIcon data-testid="music-note-icon" />);
      expect(screen.getByTestId('music-note-icon')).toBeInTheDocument();
    });

    it('renders HeartIcon', () => {
      render(<HeartIcon data-testid="heart-icon" />);
      expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
    });

    it('renders HeartIcon with fill for liked state', () => {
      render(<HeartIcon data-testid="heart-icon-filled" fill="currentColor" />);
      const icon = screen.getByTestId('heart-icon-filled');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('Action Icons', () => {
    it('renders MoreIcon', () => {
      render(<MoreIcon data-testid="more-icon" />);
      expect(screen.getByTestId('more-icon')).toBeInTheDocument();
    });

    it('renders QueueIcon', () => {
      render(<QueueIcon data-testid="queue-icon" />);
      expect(screen.getByTestId('queue-icon')).toBeInTheDocument();
    });

    it('renders PlaylistAddIcon', () => {
      render(<PlaylistAddIcon data-testid="playlist-add-icon" />);
      expect(screen.getByTestId('playlist-add-icon')).toBeInTheDocument();
    });

    it('renders RemoveIcon', () => {
      render(<RemoveIcon data-testid="remove-icon" />);
      expect(screen.getByTestId('remove-icon')).toBeInTheDocument();
    });

    it('renders AddIcon', () => {
      render(<AddIcon data-testid="add-icon" />);
      expect(screen.getByTestId('add-icon')).toBeInTheDocument();
    });

    it('renders DeleteIcon', () => {
      render(<DeleteIcon data-testid="delete-icon" />);
      expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    });

    it('renders EditIcon', () => {
      render(<EditIcon data-testid="edit-icon" />);
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('renders CloseIcon', () => {
      render(<CloseIcon data-testid="close-icon" />);
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation Icons', () => {
    it('renders HomeIcon', () => {
      render(<HomeIcon data-testid="home-icon" />);
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
    });

    it('renders LibraryIcon', () => {
      render(<LibraryIcon data-testid="library-icon" />);
      expect(screen.getByTestId('library-icon')).toBeInTheDocument();
    });

    it('renders DownloadIcon', () => {
      render(<DownloadIcon data-testid="download-icon" />);
      expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    });

    it('renders HistoryIcon', () => {
      render(<HistoryIcon data-testid="history-icon" />);
      expect(screen.getByTestId('history-icon')).toBeInTheDocument();
    });
  });

  describe('Toast Icons', () => {
    it('renders SuccessIcon', () => {
      render(<SuccessIcon data-testid="success-icon" />);
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('renders ErrorIcon', () => {
      render(<ErrorIcon data-testid="error-icon" />);
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    it('renders WarningIcon', () => {
      render(<WarningIcon data-testid="warning-icon" />);
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('renders InfoIcon', () => {
      render(<InfoIcon data-testid="info-icon" />);
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
    });
  });

  describe('Icon Props', () => {
    it('accepts size prop', () => {
      render(<PlayIcon data-testid="sized-icon" size={32} />);
      const icon = screen.getByTestId('sized-icon');
      expect(icon).toHaveAttribute('width', '32');
      expect(icon).toHaveAttribute('height', '32');
    });

    it('accepts className prop', () => {
      render(<PlayIcon data-testid="classed-icon" className="custom-class" />);
      const icon = screen.getByTestId('classed-icon');
      expect(icon).toHaveClass('custom-class');
    });

    it('accepts stroke color via color prop', () => {
      render(<PlayIcon data-testid="colored-icon" color="red" />);
      const icon = screen.getByTestId('colored-icon');
      expect(icon).toHaveAttribute('stroke', 'red');
    });
  });
});

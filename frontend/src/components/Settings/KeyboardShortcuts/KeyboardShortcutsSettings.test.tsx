import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsSettings } from './KeyboardShortcutsSettings';
import { useKeyboardStore, DEFAULT_SHORTCUTS } from '../../../stores/keyboardStore';

// Mock useRecordHotkeys from react-hotkeys-hook
const mockStart = vi.fn();
const mockStop = vi.fn();
let mockIsRecording = false;
let mockRecordedKeys = new Set<string>();

vi.mock('react-hotkeys-hook', () => ({
  useRecordHotkeys: () => [
    mockRecordedKeys,
    {
      start: mockStart,
      stop: mockStop,
      isRecording: mockIsRecording,
    },
  ],
}));

describe('KeyboardShortcutsSettings', () => {
  beforeEach(() => {
    // Reset store to default state
    useKeyboardStore.setState({ shortcuts: { ...DEFAULT_SHORTCUTS } });

    // Reset mocks
    vi.clearAllMocks();
    mockIsRecording = false;
    mockRecordedKeys = new Set<string>();
  });

  describe('rendering', () => {
    it('should render the settings title', () => {
      render(<KeyboardShortcutsSettings />);

      expect(screen.getByRole('heading', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    });

    it('should render all shortcut categories', () => {
      render(<KeyboardShortcutsSettings />);

      expect(screen.getByText('Playback')).toBeInTheDocument();
      expect(screen.getByText('Seeking')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('should render all shortcut actions', () => {
      render(<KeyboardShortcutsSettings />);

      expect(screen.getByText('Play/Pause')).toBeInTheDocument();
      expect(screen.getByText('Next Track')).toBeInTheDocument();
      expect(screen.getByText('Previous Track')).toBeInTheDocument();
      expect(screen.getByText('Seek Forward 10s')).toBeInTheDocument();
      expect(screen.getByText('Seek Backward 10s')).toBeInTheDocument();
      expect(screen.getByText('Volume Up')).toBeInTheDocument();
      expect(screen.getByText('Volume Down')).toBeInTheDocument();
      expect(screen.getByText('Toggle Mute')).toBeInTheDocument();
    });

    it('should render reset to defaults button', () => {
      render(<KeyboardShortcutsSettings />);

      expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
    });

    it('should display current shortcut bindings', () => {
      render(<KeyboardShortcutsSettings />);

      // Space for togglePlay
      expect(screen.getByText('Space')).toBeInTheDocument();
      // M for toggleMute
      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });

  describe('edit mode', () => {
    it('should render edit buttons for each shortcut', () => {
      render(<KeyboardShortcutsSettings />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBe(8); // 8 shortcuts
    });

    it('should show recording message when editing', async () => {
      mockIsRecording = true;

      render(<KeyboardShortcutsSettings />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      expect(screen.getByText(/press any key/i)).toBeInTheDocument();
    });

    it('should show cancel button when in edit mode', async () => {
      mockIsRecording = true;

      render(<KeyboardShortcutsSettings />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('reset to defaults', () => {
    it('should reset all shortcuts when clicking reset button', async () => {
      // Modify a shortcut first
      useKeyboardStore.getState().setShortcut('togglePlay', 'p');
      expect(useKeyboardStore.getState().shortcuts.togglePlay).toBe('p');

      render(<KeyboardShortcutsSettings />);

      const resetButton = screen.getByText('Reset to Defaults');
      await userEvent.click(resetButton);

      expect(useKeyboardStore.getState().shortcuts.togglePlay).toBe('space');
    });
  });

  describe('conflict detection', () => {
    it('should show conflict warning when binding conflicts with existing shortcut', () => {
      // This would be shown in the UI when a conflict is detected
      const { hasConflict } = useKeyboardStore.getState();

      // space is bound to togglePlay
      const conflict = hasConflict('toggleMute', 'space');

      expect(conflict).toBe('togglePlay');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for edit buttons', () => {
      render(<KeyboardShortcutsSettings />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      editButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should have keyboard-accessible shortcut items', () => {
      render(<KeyboardShortcutsSettings />);

      // Check that the component has proper keyboard navigation structure
      const shortcutRows = screen.getAllByRole('row');
      expect(shortcutRows.length).toBeGreaterThan(0);
    });
  });

  describe('formatted shortcuts', () => {
    it('should display formatted arrow key shortcuts', () => {
      render(<KeyboardShortcutsSettings />);

      // Arrow keys should be displayed as symbols
      expect(screen.getAllByText('→').length).toBeGreaterThan(0);
      expect(screen.getAllByText('←').length).toBeGreaterThan(0);
      expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
      expect(screen.getAllByText('↓').length).toBeGreaterThan(0);
    });

    it('should display formatted modifier key shortcuts', () => {
      render(<KeyboardShortcutsSettings />);

      // Shift + arrow key for next/previous track
      expect(screen.getAllByText(/shift/i).length).toBeGreaterThan(0);
    });
  });
});

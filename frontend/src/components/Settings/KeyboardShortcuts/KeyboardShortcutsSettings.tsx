import { useState, useCallback, useEffect } from 'react';
import { useRecordHotkeys } from 'react-hotkeys-hook';
import { useKeyboardStore, type ShortcutAction } from '../../../stores/keyboardStore';
import './KeyboardShortcuts.css';

/**
 * Settings component for configuring keyboard shortcuts.
 * Allows users to view, edit, and reset keyboard shortcuts for player controls.
 */
export function KeyboardShortcutsSettings() {
  const {
    shortcuts,
    setShortcut,
    resetToDefaults,
    hasConflict,
    getActionLabel,
    formatShortcut,
    getShortcutsByCategory,
  } = useKeyboardStore();

  const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);
  const [conflict, setConflict] = useState<ShortcutAction | null>(null);

  // Use react-hotkeys-hook's recording feature
  const [recordedKeys, { start, stop, isRecording }] = useRecordHotkeys();

  // Handle recorded keys
  useEffect(() => {
    if (isRecording && recordedKeys.size > 0 && editingAction) {
      // Convert Set to hotkey string format
      const keysArray = Array.from(recordedKeys);
      const hotkeyString = keysArray.join('+').toLowerCase();

      // Check for conflicts
      const conflictingAction = hasConflict(editingAction, hotkeyString);
      if (conflictingAction) {
        setConflict(conflictingAction);
        return;
      }

      // Save the new shortcut
      setShortcut(editingAction, hotkeyString);
      setEditingAction(null);
      setConflict(null);
      stop();
    }
  }, [recordedKeys, isRecording, editingAction, hasConflict, setShortcut, stop]);

  const handleEdit = useCallback(
    (action: ShortcutAction) => {
      setEditingAction(action);
      setConflict(null);
      start();
    },
    [start]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingAction(null);
    setConflict(null);
    stop();
  }, [stop]);

  const handleReset = useCallback(() => {
    resetToDefaults();
    setEditingAction(null);
    setConflict(null);
  }, [resetToDefaults]);

  const categories = getShortcutsByCategory();

  return (
    <div className="keyboard-shortcuts-settings">
      <h3 className="keyboard-shortcuts-title">Keyboard Shortcuts</h3>
      <p className="keyboard-shortcuts-description">
        Customize keyboard shortcuts for player controls. Click Edit to change a shortcut.
      </p>

      {categories.map((category) => (
        <div key={category.name} className="shortcut-category">
          <h4 className="shortcut-category-title">{category.name}</h4>
          <table className="shortcut-table" role="grid">
            <tbody>
              {category.actions.map((action) => (
                <tr key={action} className="shortcut-row" role="row">
                  <td className="shortcut-action">{getActionLabel(action)}</td>
                  <td className="shortcut-binding">
                    {editingAction === action ? (
                      <div className="shortcut-recording">
                        <span className="shortcut-recording-text">
                          {conflict ? (
                            <>
                              <span className="shortcut-conflict-icon">!</span> Conflicts with{' '}
                              {getActionLabel(conflict)}
                            </>
                          ) : (
                            'Press any key combination...'
                          )}
                        </span>
                        <button
                          className="shortcut-recording-cancel"
                          onClick={handleCancelEdit}
                          aria-label="Cancel editing shortcut"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <ShortcutDisplay shortcut={formatShortcut(shortcuts[action])} />
                        <button
                          className="shortcut-edit-button"
                          onClick={() => {
                            handleEdit(action);
                          }}
                          aria-label={`Edit shortcut for ${getActionLabel(action)}`}
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="shortcut-reset-section">
        <button
          className="shortcut-reset-button"
          onClick={handleReset}
          aria-label="Reset all shortcuts to defaults"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

/**
 * Displays a formatted keyboard shortcut with visual key styling.
 */
function ShortcutDisplay({ shortcut }: { shortcut: string }) {
  const parts = shortcut.split(' + ');

  return (
    <span className="key-binding-container">
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && <span className="key-separator"> + </span>}
          <kbd className="key-binding">{part}</kbd>
        </span>
      ))}
    </span>
  );
}

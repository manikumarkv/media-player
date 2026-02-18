import { useState, useRef, useEffect } from 'react';
import { useSleepTimer } from '../../hooks/useSleepTimer';
import { MoonIcon } from '../Icons';
import './SleepTimer.css';

const TIME_PRESETS = [15, 30, 45, 60, 90];

/**
 * SleepTimer component - Button and popover for setting a sleep timer.
 * When active, shows countdown. Music pauses and fades out when timer ends.
 */
export function SleepTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { isActive, formatRemaining, startTimer, cancelTimer } = useSleepTimer();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetClick = (minutes: number) => {
    startTimer(minutes);
    setIsOpen(false);
  };

  const handleCancel = () => {
    cancelTimer();
    setIsOpen(false);
  };

  return (
    <div className="sleep-timer-container">
      <button
        ref={buttonRef}
        className={`sleep-timer-button ${isActive ? 'active' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        aria-label="Sleep timer"
        aria-expanded={isOpen}
        title={isActive ? `Sleep timer: ${formatRemaining()}` : 'Sleep timer'}
      >
        <MoonIcon size={18} data-testid="moon-icon" />
        {isActive && <span className="sleep-timer-countdown">{formatRemaining()}</span>}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="sleep-timer-popover"
          role="dialog"
          aria-label="Sleep timer options"
        >
          {isActive ? (
            <div className="sleep-timer-active">
              <div className="sleep-timer-active-icon">
                <MoonIcon size={32} />
              </div>
              <p className="sleep-timer-remaining">{formatRemaining()}</p>
              <p className="sleep-timer-label">remaining</p>
              <button className="sleep-timer-cancel" onClick={handleCancel}>
                Cancel Timer
              </button>
            </div>
          ) : (
            <div className="sleep-timer-options">
              <h3 className="sleep-timer-title">Sleep Timer</h3>
              <p className="sleep-timer-subtitle">Stop playback after</p>
              <div className="sleep-timer-presets">
                {TIME_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    className="sleep-timer-preset"
                    onClick={() => {
                      handlePresetClick(minutes);
                    }}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

# Feature: Mobile Responsive

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Touch-optimized responsive UI for mobile browsers and tablets. Adapts layout, controls, and interactions for smaller screens while maintaining full functionality.

## User Stories
- As a mobile user, I want touch-friendly controls so that I can easily control playback on my phone
- As a mobile user, I want the UI to adapt to my screen size so that content is readable and accessible
- As a tablet user, I want a layout that uses the available space efficiently so that I get a good experience on my device
- As a mobile user, I want swipe gestures so that I can navigate quickly and naturally

## Acceptance Criteria
- [ ] Responsive breakpoints: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)
- [ ] Touch-friendly tap targets (minimum 44x44px)
- [ ] Swipe gestures for common actions (next/prev track, open sidebar)
- [ ] Bottom navigation bar on mobile (thumb-friendly)
- [ ] Collapsible sidebar on tablet/mobile
- [ ] Full-width player controls on mobile
- [ ] Optimized images and assets for mobile bandwidth
- [ ] No horizontal scrolling on any screen size
- [ ] Works in both portrait and landscape orientations
- [ ] Pull-to-refresh for library updates

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/index.css` - Add responsive breakpoints and utilities
  - `frontend/src/App.tsx` - Responsive layout structure
  - `frontend/src/components/Player/` - Mobile player controls
  - `frontend/src/components/Navigation/` - Mobile navigation
- **New components:**
  - `frontend/src/components/Layout/MobileNav.tsx` - Bottom tab navigation
  - `frontend/src/components/Layout/Sidebar.tsx` - Collapsible sidebar
  - `frontend/src/components/Player/MobilePlayer.tsx` - Full-screen mobile player
  - `frontend/src/hooks/useMediaQuery.ts` - Responsive hook
  - `frontend/src/hooks/useSwipeGesture.ts` - Touch gesture handling
- **State changes:**
  - Add `sidebarOpen: boolean` to UI store
  - Add `mobilePlayerExpanded: boolean` to player store

### Responsive Breakpoints
```css
/* Tailwind-style breakpoints */
/* Mobile: default (< 640px) */
/* Tablet: sm (640px+), md (768px+) */
/* Desktop: lg (1024px+), xl (1280px+) */

@media (min-width: 640px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Mobile Layout Structure
```
┌─────────────────────────┐
│      Header/Search      │
├─────────────────────────┤
│                         │
│      Content Area       │
│      (scrollable)       │
│                         │
├─────────────────────────┤
│    Mini Player Bar      │
├─────────────────────────┤
│   Bottom Navigation     │
│  [Home][Search][Library]│
└─────────────────────────┘
```

### Touch Gesture Hook
```typescript
// useSwipeGesture.ts
export function useSwipeGesture(
  ref: RefObject<HTMLElement>,
  options: {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number;
  }
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let startX = 0, startY = 0;
    const threshold = options.threshold || 50;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) options.onSwipeRight?.();
        else options.onSwipeLeft?.();
      } else if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) options.onSwipeDown?.();
        else options.onSwipeUp?.();
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, options]);
}
```

### Mobile Mini Player
```typescript
// Collapsed mini player at bottom of screen
function MiniPlayer() {
  return (
    <div className="fixed bottom-16 left-0 right-0 h-16 bg-bg-secondary">
      <div className="flex items-center px-4">
        <img src={albumArt} className="w-12 h-12 rounded" />
        <div className="flex-1 ml-3 truncate">
          <p className="font-medium truncate">{title}</p>
          <p className="text-sm text-text-secondary truncate">{artist}</p>
        </div>
        <button onClick={togglePlay} className="p-3">
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>
      <ProgressBar />
    </div>
  );
}
```

### Backend Changes
- None required - responsive design is purely frontend

### Database Changes
- None required

## Dependencies
- **Requires:** Core UI components exist
- **Blocks:** None

## Responsive Components Checklist
- [ ] Header - collapsible search on mobile
- [ ] Sidebar - drawer on mobile, collapsible on tablet
- [ ] Player - mini + expandable full-screen on mobile
- [ ] Library grid - 2 cols mobile, 3 tablet, 4+ desktop
- [ ] Playlist view - full width on mobile
- [ ] Download queue - bottom sheet on mobile
- [ ] Settings - full screen on mobile
- [ ] Modals - full screen on mobile

## Touch Interactions
| Action | Mobile Gesture |
|--------|----------------|
| Next track | Swipe left on player |
| Previous track | Swipe right on player |
| Expand player | Swipe up on mini player |
| Close player | Swipe down on expanded player |
| Open sidebar | Swipe right from left edge |
| Close sidebar | Swipe left or tap overlay |
| Seek | Drag progress bar |
| Volume | Drag volume slider |

## Notes
- Test on actual devices, not just browser emulation
- Consider iOS Safari viewport issues (address bar, notch)
- Handle keyboard appearing (input fields pushing layout)
- Consider adding haptic feedback for interactions
- PWA feature will enhance mobile experience further
- May need to lazy-load components for mobile performance

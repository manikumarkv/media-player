# Feature: Themes

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
Low

## Overview
Theme switching capability supporting Dark, Light, and System (auto) modes. Uses CSS custom properties for consistent theming across all components with smooth transitions between themes.

## User Stories
- As a user, I want to switch between dark and light themes so that I can use the app comfortably in different lighting conditions
- As a user, I want the app to follow my system theme preference so that it automatically matches my OS settings
- As a user, I want my theme preference to persist so that I don't have to set it every time

## Acceptance Criteria
- [ ] Three theme options: Dark, Light, System (auto-detect)
- [ ] Theme toggle accessible from settings or header
- [ ] Smooth CSS transition when switching themes (300ms fade)
- [ ] All components properly themed (no unstyled elements)
- [ ] System theme auto-updates when OS preference changes
- [ ] Theme preference persisted in localStorage
- [ ] Proper contrast ratios for accessibility (WCAG AA)
- [ ] Theme applied before first paint (no flash of wrong theme)

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/App.tsx` - Add theme provider/context
  - `frontend/src/index.css` - Define CSS custom properties for themes
  - `frontend/src/stores/` - Add theme store or use existing settings store
- **New components:**
  - `frontend/src/components/Settings/ThemeToggle.tsx` - Theme selector component
  - `frontend/src/hooks/useTheme.ts` - Theme management hook
- **State changes:**
  - Add `theme: 'dark' | 'light' | 'system'` to settings/preferences store

### CSS Implementation
```css
/* In index.css or theme.css */
:root {
  /* Light theme (default) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-bg-tertiary: #e8e8e8;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;
  --color-accent: #6366f1;
  --color-accent-hover: #4f46e5;
  --color-border: #e0e0e0;
  --color-error: #ef4444;
  --color-success: #22c55e;
}

[data-theme="dark"] {
  --color-bg-primary: #0f0f0f;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #262626;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-text-muted: #666666;
  --color-accent: #818cf8;
  --color-accent-hover: #6366f1;
  --color-border: #333333;
  --color-error: #f87171;
  --color-success: #4ade80;
}

/* Smooth transitions */
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### Theme Hook Implementation
```typescript
// useTheme.ts
export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light' | 'system'>(() => {
    return localStorage.getItem('theme') as any || 'system';
  });

  useEffect(() => {
    const applyTheme = () => {
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }
      document.documentElement.setAttribute('data-theme', effectiveTheme);
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme === 'system') {
      mediaQuery.addEventListener('change', applyTheme);
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  return { theme, setTheme: setThemeState };
}
```

### Prevent Flash of Wrong Theme
```html
<!-- In index.html, add before other scripts -->
<script>
  (function() {
    const theme = localStorage.getItem('theme') || 'system';
    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  })();
</script>
```

### Backend Changes
- None required - theme is purely client-side

### Database Changes
- None required for initial implementation
- Future: Store theme preference in user settings for cloud sync

## Dependencies
- **Requires:** None
- **Blocks:** None

## Component Updates Required
All components using hardcoded colors need to use CSS custom properties:
- Player controls
- Navigation/sidebar
- Playlist views
- Download queue
- Settings panels
- Modals and dialogs
- Form inputs
- Buttons

## Notes
- Consider adding more themes in the future (custom themes, accent colors)
- Ensure album art and visualizations look good on both themes
- Test with various displays and color profiles
- Consider reduced motion preference for transitions
- Icons may need theme-aware variants

# Analytics & Telemetry Instructions

**Project:** YouTube Media Player - Usage Analytics  
**Purpose:** Track user behavior and application performance  
**Scope:** Frontend events, backend metrics, privacy-compliant tracking

---

## 🎯 What to Track?

### User Behavior Analytics
- **Media interactions**: Play, pause, skip, like, add to playlist
- **Search behavior**: Search queries, filter usage, result clicks
- **Download patterns**: What gets downloaded, success rates
- **Navigation**: Page views, time spent per page
- **Feature adoption**: Which features are used most

### Technical Metrics
- **Performance**: Page load time, API response time, media buffering
- **Errors**: Client errors, API failures, download errors
- **Engagement**: Session duration, media completion rate
- **Device info**: Browser, OS, screen size (no PII)

---

## 📊 Analytics Providers

### Option 1: Google Analytics 4 (GA4)

**Pros**: Free, powerful, industry standard  
**Cons**: Google-hosted, complex privacy compliance

```bash
cd frontend
pnpm add react-ga4
```

```typescript
// frontend/src/analytics/ga4.ts
import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (!GA_MEASUREMENT_ID) return;
  
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    gaOptions: {
      anonymize_ip: true, // GDPR compliance
    },
  });
};

export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};
```

### Option 2: Plausible Analytics (Recommended)

**Pros**: Privacy-friendly, simple, EU-hosted, no cookie consent needed  
**Cons**: Paid service ($9/month), fewer features than GA

```bash
pnpm add plausible-tracker
```

```typescript
// frontend/src/analytics/plausible.ts
import Plausible from 'plausible-tracker';

const plausible = Plausible({
  domain: 'your-domain.com',
  apiHost: 'https://plausible.io', // Or self-hosted
});

export const { trackPageview, trackEvent } = plausible;

// Custom events
export const trackMediaPlay = (mediaId: string, type: 'audio' | 'video') => {
  trackEvent('Media Play', { props: { mediaId, type } });
};

export const trackDownload = (url: string, quality: string) => {
  trackEvent('Download', { props: { url, quality } });
};
```

### Option 3: Self-Hosted (Umami)

**Pros**: Full control, privacy-friendly, free  
**Cons**: Requires hosting, maintenance

```bash
# Docker Compose addition
services:
  umami:
    image: ghcr.io/umami-software/umami:postgresql-latest
    environment:
      DATABASE_URL: postgresql://...
      APP_SECRET: ${UMAMI_SECRET}
    ports:
      - "3001:3000"
```

---

## 🔧 Implementation

### 1. Initialize Analytics

```typescript
// frontend/src/main.tsx
import { initAnalytics } from './analytics';

initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 2. Track Page Views

```typescript
// frontend/src/hooks/usePageTracking.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../analytics';

export const usePageTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
};
```

```typescript
// In App.tsx
export const App = () => {
  usePageTracking();
  
  return (
    <Router>
      {/* Routes */}
    </Router>
  );
};
```

### 3. Track User Events

```typescript
// frontend/src/components/Player/Controls.tsx
import { trackEvent } from '../../analytics';

export const Controls: React.FC<Props> = ({ media }) => {
  const handlePlay = () => {
    trackEvent('Player', 'Play', media.title);
    playerStore.play();
  };
  
  const handleLike = () => {
    trackEvent('Media', 'Like', media.id);
    mediaService.toggleLike(media.id);
  };
  
  return (
    <div>
      <button onClick={handlePlay}>Play</button>
      <button onClick={handleLike}>Like</button>
    </div>
  );
};
```

---

## 📈 Key Events to Track

### Media Player Events

```typescript
// frontend/src/services/analytics.service.ts

export const AnalyticsService = {
  // Playback
  trackPlay: (mediaId: string, source: string) => {
    trackEvent('Player', 'Play', source, { mediaId });
  },
  
  trackPause: (mediaId: string, position: number) => {
    trackEvent('Player', 'Pause', mediaId, { position });
  },
  
  trackComplete: (mediaId: string, duration: number) => {
    trackEvent('Player', 'Complete', mediaId, { duration });
  },
  
  trackSkip: (from: string, to: string) => {
    trackEvent('Player', 'Skip', `${from} -> ${to}`);
  },
  
  // Library
  trackSearch: (query: string, resultCount: number) => {
    trackEvent('Library', 'Search', query, { resultCount });
  },
  
  trackFilter: (filterType: string, filterValue: string) => {
    trackEvent('Library', 'Filter', `${filterType}:${filterValue}`);
  },
  
  // Downloads
  trackDownloadStart: (url: string, quality: string) => {
    trackEvent('Download', 'Start', quality, { url });
  },
  
  trackDownloadComplete: (url: string, duration: number) => {
    trackEvent('Download', 'Complete', url, { duration });
  },
  
  trackDownloadFail: (url: string, error: string) => {
    trackEvent('Download', 'Fail', error, { url });
  },
  
  // Playlists
  trackPlaylistCreate: (name: string) => {
    trackEvent('Playlist', 'Create', name);
  },
  
  trackAddToPlaylist: (playlistId: string, mediaId: string) => {
    trackEvent('Playlist', 'Add Track', playlistId, { mediaId });
  },
};
```

---

## 🎭 Performance Tracking

```typescript
// frontend/src/analytics/performance.ts

export const trackPerformance = () => {
  // Page load time
  window.addEventListener('load', () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    trackEvent('Performance', 'Page Load', 'Total', pageLoadTime);
  });
  
  // API response times
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const start = Date.now();
    const response = await originalFetch(...args);
    const duration = Date.now() - start;
    
    const url = args[0] as string;
    if (url.includes('/api/')) {
      trackEvent('Performance', 'API Call', url, duration);
    }
    
    return response;
  };
};
```

---

## 🔒 Privacy Considerations

### GDPR Compliance

```typescript
// frontend/src/analytics/consent.ts

export const AnalyticsConsent = {
  hasConsent(): boolean {
    return localStorage.getItem('analytics-consent') === 'true';
  },
  
  giveConsent(): void {
    localStorage.setItem('analytics-consent', 'true');
    initAnalytics();
  },
  
  revokeConsent(): void {
    localStorage.setItem('analytics-consent', 'false');
    // Disable tracking
  },
  
  showBanner(): boolean {
    return localStorage.getItem('analytics-consent') === null;
  },
};
```

```tsx
// frontend/src/components/CookieBanner.tsx
import { useState, useEffect } from 'react';
import { AnalyticsConsent } from '../analytics/consent';

export const CookieBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    setShow(AnalyticsConsent.showBanner());
  }, []);
  
  if (!show) return null;
  
  return (
    <div className="cookie-banner">
      <p>We use analytics to improve your experience.</p>
      <button onClick={() => {
        AnalyticsConsent.giveConsent();
        setShow(false);
      }}>
        Accept
      </button>
      <button onClick={() => {
        AnalyticsConsent.revokeConsent();
        setShow(false);
      }}>
        Decline
      </button>
    </div>
  );
};
```

### What NOT to Track

❌ Personal Identifiable Information (PII)  
❌ Email addresses, names, IP addresses  
❌ Full URLs with sensitive data  
❌ User-generated content (playlist names, etc.)  
❌ Passwords or auth tokens  

✅ Anonymized user IDs  
✅ Device type (browser, OS)  
✅ Feature usage patterns  
✅ Performance metrics  

---

## 📊 Backend Analytics

```typescript
// backend/src/middleware/analytics.middleware.ts
import { Request, Response, NextFunction } from 'express';

interface AnalyticsData {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

export const analyticsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const data: AnalyticsData = {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      timestamp: new Date(),
    };
    
    // Send to analytics service
    sendToAnalytics(data);
  });
  
  next();
};

async function sendToAnalytics(data: AnalyticsData) {
  // Send to time-series database or analytics service
  // Example: InfluxDB, TimescaleDB, or cloud service
}
```

---

## 📈 Analytics Dashboard

### Key Metrics to Display

```typescript
// Sample analytics queries

// Most played media
SELECT 
  media.title,
  COUNT(play_history.id) as play_count
FROM media
JOIN play_history ON media.id = play_history.media_id
GROUP BY media.id
ORDER BY play_count DESC
LIMIT 10;

// Download success rate
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
    COUNT(*)::float * 100, 
    2
  ) as success_rate
FROM downloads
GROUP BY DATE(created_at)
ORDER BY date DESC;

// User engagement
SELECT 
  DATE(played_at) as date,
  COUNT(DISTINCT media_id) as unique_plays,
  AVG(duration) as avg_duration,
  COUNT(*) as total_plays
FROM play_history
GROUP BY DATE(played_at)
ORDER BY date DESC;
```

---

## ✅ Best Practices

1. **Track meaningful events** - Not every click, focus on user intent
2. **Anonymize data** - No PII, use hashed IDs if needed
3. **Respect opt-out** - Always honor user privacy preferences
4. **Sampling** - For high-traffic apps, sample events (e.g., 10%)
5. **Test thoroughly** - Verify events fire correctly in dev
6. **Document events** - Maintain list of all tracked events
7. **Review regularly** - Remove unused events, add new ones
8. **Performance** - Analytics should not slow down the app

---

## 🛠️ Development Tools

```typescript
// frontend/src/analytics/debug.ts

export const debugAnalytics = () => {
  if (import.meta.env.DEV) {
    // Log all events to console
    const originalTrackEvent = trackEvent;
    window.trackEvent = (...args) => {
      console.log('[Analytics]', args);
      originalTrackEvent(...args);
    };
  }
};
```

---

## 📋 Analytics Checklist

- [ ] Choose analytics provider (Plausible recommended)
- [ ] Implement page view tracking
- [ ] Add event tracking for key user actions
- [ ] Track performance metrics
- [ ] Implement consent banner (if required by law)
- [ ] Test in development with debug logging
- [ ] Document all tracked events
- [ ] Set up analytics dashboard
- [ ] Review privacy policy
- [ ] Monitor analytics regularly

---

**Related Documentation:**
- `monitoring-observability.instructions.md` - Technical monitoring
- `privacy-security.instructions.md` - Security practices

---

**End of Analytics & Telemetry Instructions**

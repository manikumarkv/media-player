# Feature Flags Instructions

**Project:** YouTube Media Player - Feature Flags & Gradual Rollouts  
**Purpose:** Enable/disable features dynamically without deployments  
**Scope:** Development, staging, and production feature management

---

## 🎯 What Are Feature Flags?

**Feature flags** (aka feature toggles) allow you to turn features on/off at runtime without code changes or deployments.

### Why Use Feature Flags?

✅ **Gradual rollouts** - Release to 10% of users, then 50%, then 100%  
✅ **A/B testing** - Test variants with different user groups  
✅ **Kill switch** - Disable problematic features instantly  
✅ **Dev/staging/prod parity** - Same code, different features enabled  
✅ **Beta features** - Give early access to power users  
✅ **Emergency toggles** - Turn off expensive features under load

---

## 📋 Types of Feature Flags

### 1. Release Flags (Short-lived)

**Purpose:** Hide incomplete features during development

```typescript
if (featureFlags.newPlayerUI) {
  return <NewPlayerUI />;
} else {
  return <OldPlayerUI />;
}
```

**Lifecycle:** Remove after feature is stable (weeks/months)

---

### 2. Ops Flags (Long-lived)

**Purpose:** Control system behavior

```typescript
if (featureFlags.enableCaching) {
  return getCachedData();
}
return getFreshData();
```

**Lifecycle:** Permanent (part of system architecture)

---

### 3. Experiment Flags (Short-lived)

**Purpose:** A/B testing

```typescript
const variant = featureFlags.downloadButtonColor; // 'blue' or 'green'
return <Button color={variant}>Download</Button>;
```

**Lifecycle:** Remove after experiment concludes

---

### 4. Permission Flags (Long-lived)

**Purpose:** Access control

```typescript
if (featureFlags.bulkDownloadEnabled && user.isPremium) {
  return <BulkDownloadButton />;
}
```

**Lifecycle:** Permanent (business logic)

---

## 🛠️ Implementation Options

### Option 1: Environment Variables (Simplest)

**Pros:** No dependencies, simple  
**Cons:** Requires restart to change, no gradual rollouts

```typescript
// .env
ENABLE_BULK_DOWNLOAD=true
ENABLE_USB_EXPORT=false
ENABLE_ADVANCED_FEATURES=false
```

---

### Option 2: Configuration File (MVP Recommended)

**Pros:** Easy to change, version controlled  
**Cons:** Requires restart, no runtime changes

```typescript
// config/features.ts
export const features = {
  bulkDownload: true,
  usbExport: false,
  themes: true,
  analytics: false,
};
```

---

### Option 3: Database (Simple + Dynamic)

**Pros:** Runtime changes, no restart  
**Cons:** Database dependency, manual admin UI

```typescript
// Prisma schema
model FeatureFlag {
  id          String   @id @default(uuid())
  name        String   @unique
  enabled     Boolean  @default(false)
  description String?
  updatedAt   DateTime @updatedAt
}
```

---

### Option 4: SaaS (Production Recommended)

**Options:**
- **LaunchDarkly** - Enterprise, expensive
- **Unleash** - Open source, self-hosted or cloud
- **PostHog** - Free tier, includes analytics
- **GrowthBook** - Open source, A/B testing

**Pros:** Full features, UI, gradual rollouts, A/B testing  
**Cons:** External dependency, potential cost

---

## 🚀 Recommended MVP Approach

Use **configuration file** for development, **database** for production.

---

## 📝 Implementation: Configuration File

### 1. Define Feature Flags

```typescript
// shared/src/featureFlags.ts

/**
 * Feature flag definitions
 * 
 * Convention:
 * - Use camelCase for flag names
 * - Add description comments
 * - Group by feature area
 * - Remove flags after features are stable
 */

export interface FeatureFlags {
  // === Phase 2 Features ===
  
  /** Enable bulk playlist/album download */
  bulkDownload: boolean;
  
  /** Enable queue management */
  queueManagement: boolean;
  
  /** Enable shuffle and repeat modes */
  shuffleRepeat: boolean;
  
  /** Enable download notifications */
  downloadNotifications: boolean;
  
  /** Enable keyboard shortcuts */
  keyboardShortcuts: boolean;
  
  // === Phase 3 Features ===
  
  /** Enable USB/device export */
  usbExport: boolean;
  
  /** Enable audio quality selector */
  qualitySelector: boolean;
  
  /** Enable dark/light themes */
  themes: boolean;
  
  /** Enable advanced sorting options */
  advancedSorting: boolean;
  
  /** Enable bulk delete */
  bulkDelete: boolean;
  
  // === Experimental Features ===
  
  /** Enable analytics/telemetry */
  analytics: boolean;
  
  /** Enable A/B test for new player UI */
  newPlayerUI: boolean;
  
  /** Enable debug mode */
  debugMode: boolean;
}

/**
 * Default feature flags (development)
 */
export const defaultFeatureFlags: FeatureFlags = {
  // Phase 2 (enabled in dev)
  bulkDownload: true,
  queueManagement: true,
  shuffleRepeat: true,
  downloadNotifications: true,
  keyboardShortcuts: true,
  
  // Phase 3 (disabled by default)
  usbExport: false,
  qualitySelector: false,
  themes: false,
  advancedSorting: false,
  bulkDelete: false,
  
  // Experimental (disabled)
  analytics: false,
  newPlayerUI: false,
  debugMode: false,
};

/**
 * Production feature flags
 */
export const productionFeatureFlags: FeatureFlags = {
  // Phase 2 (gradually enable)
  bulkDownload: true,
  queueManagement: true,
  shuffleRepeat: true,
  downloadNotifications: true,
  keyboardShortcuts: true,
  
  // Phase 3 (not yet)
  usbExport: false,
  qualitySelector: false,
  themes: false,
  advancedSorting: false,
  bulkDelete: false,
  
  // Experimental (off in prod)
  analytics: false,
  newPlayerUI: false,
  debugMode: false,
};

/**
 * Get feature flags for current environment
 */
export function getFeatureFlags(): FeatureFlags {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return productionFeatureFlags;
  }
  
  return defaultFeatureFlags;
}
```

---

### 2. Backend Feature Flag Service

```typescript
// backend/src/services/featureFlag.service.ts
import { getFeatureFlags, FeatureFlags } from '@media-player/shared';

export class FeatureFlagService {
  private flags: FeatureFlags;
  
  constructor() {
    this.flags = getFeatureFlags();
  }
  
  /**
   * Check if feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature];
  }
  
  /**
   * Get all feature flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }
  
  /**
   * Check multiple features (AND logic)
   */
  areEnabled(...features: Array<keyof FeatureFlags>): boolean {
    return features.every(f => this.flags[f]);
  }
  
  /**
   * Check if any features enabled (OR logic)
   */
  anyEnabled(...features: Array<keyof FeatureFlags>): boolean {
    return features.some(f => this.flags[f]);
  }
}

// Singleton instance
export const featureFlagService = new FeatureFlagService();
```

---

### 3. Backend API Endpoint

```typescript
// backend/src/routes/featureFlags.routes.ts
import { Router, Request, Response } from 'express';
import { featureFlagService } from '../services/featureFlag.service';
import { ResponseHelper } from '../utils/responseHelper';

const router = Router();

/**
 * GET /api/feature-flags
 * Get all feature flags for frontend
 */
router.get('/', (req: Request, res: Response) => {
  const flags = featureFlagService.getAll();
  ResponseHelper.success(res, flags);
});

export default router;

// In server.ts
import featureFlagsRouter from './routes/featureFlags.routes';
app.use('/api/feature-flags', featureFlagsRouter);
```

---

### 4. Backend Usage in Routes

```typescript
// backend/src/routes/download.routes.ts
import { featureFlagService } from '../services/featureFlag.service';

router.post('/bulk', async (req, res) => {
  // Check feature flag
  if (!featureFlagService.isEnabled('bulkDownload')) {
    return ResponseHelper.error(
      res,
      ErrorCode.FORBIDDEN,
      'Bulk download feature is not enabled',
      403
    );
  }
  
  // Feature is enabled, proceed
  const result = await downloadService.bulkDownload(req.body.urls);
  ResponseHelper.success(res, result);
});
```

---

### 5. Frontend Feature Flag Hook

```typescript
// frontend/src/hooks/useFeatureFlags.ts
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { FeatureFlags } from '@media-player/shared';

/**
 * Hook to access feature flags
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await apiClient.get<{ data: FeatureFlags }>('/api/feature-flags');
        setFlags(response.data.data);
      } catch (error) {
        console.error('Failed to load feature flags:', error);
        // Fallback to default flags
        setFlags(getDefaultFlags());
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFlags();
  }, []);
  
  /**
   * Check if feature is enabled
   */
  const isEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags?.[feature] ?? false;
  };
  
  return { flags, isLoading, isEnabled };
}

function getDefaultFlags(): FeatureFlags {
  // All features disabled by default
  return {
    bulkDownload: false,
    queueManagement: false,
    shuffleRepeat: false,
    downloadNotifications: false,
    keyboardShortcuts: false,
    usbExport: false,
    qualitySelector: false,
    themes: false,
    advancedSorting: false,
    bulkDelete: false,
    analytics: false,
    newPlayerUI: false,
    debugMode: false,
  };
}
```

---

### 6. Frontend Usage in Components

```typescript
// frontend/src/components/Download/DownloadPage.tsx
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export const DownloadPage: React.FC = () => {
  const { isEnabled, isLoading } = useFeatureFlags();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      <h1>Download</h1>
      
      {/* Single download (always available) */}
      <SingleDownloadForm />
      
      {/* Bulk download (feature flag) */}
      {isEnabled('bulkDownload') && (
        <BulkDownloadSection />
      )}
      
      {/* Quality selector (feature flag) */}
      {isEnabled('qualitySelector') && (
        <QualitySelector />
      )}
    </div>
  );
};
```

---

### 7. Feature Flag Component

```typescript
// frontend/src/components/Common/FeatureFlag.tsx
import React from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { FeatureFlags } from '@media-player/shared';

interface FeatureFlagProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditional rendering based on feature flag
 */
export const FeatureFlag: React.FC<FeatureFlagProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const { isEnabled } = useFeatureFlags();
  
  if (isEnabled(feature)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

// Usage
<FeatureFlag feature="bulkDownload">
  <BulkDownloadButton />
</FeatureFlag>

<FeatureFlag 
  feature="themes" 
  fallback={<p>Themes coming soon!</p>}
>
  <ThemeSelector />
</FeatureFlag>
```

---

## 📊 Database Implementation (Advanced)

### 1. Prisma Schema

```prisma
// backend/src/db/schema.prisma

model FeatureFlag {
  id          String   @id @default(uuid())
  name        String   @unique
  enabled     Boolean  @default(false)
  description String?
  rolloutPct  Int      @default(0)  // 0-100 for gradual rollouts
  updatedAt   DateTime @updatedAt
  createdAt   DateTime @default(now())
  
  @@index([enabled])
}
```

### 2. Service with Database

```typescript
// backend/src/services/featureFlag.service.ts
import { PrismaClient } from '@prisma/client';
import { getFeatureFlags, FeatureFlags } from '@media-player/shared';

export class FeatureFlagService {
  private prisma: PrismaClient;
  private cache: Map<string, boolean> = new Map();
  private cacheExpiry: number = 60000; // 1 minute
  private lastCacheUpdate: number = 0;
  
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  /**
   * Check if feature is enabled
   * Uses cache for performance
   */
  async isEnabled(feature: keyof FeatureFlags, userId?: string): Promise<boolean> {
    await this.refreshCacheIfNeeded();
    
    // Check cache
    if (this.cache.has(feature)) {
      const enabled = this.cache.get(feature)!;
      
      // If gradual rollout, check user ID
      if (enabled && userId) {
        return this.isUserInRollout(feature, userId);
      }
      
      return enabled;
    }
    
    // Fallback to default config
    const defaultFlags = getFeatureFlags();
    return defaultFlags[feature];
  }
  
  /**
   * Get all feature flags
   */
  async getAll(): Promise<FeatureFlags> {
    await this.refreshCacheIfNeeded();
    
    const defaultFlags = getFeatureFlags();
    const flags: any = { ...defaultFlags };
    
    // Override with database values
    for (const [key, value] of this.cache.entries()) {
      flags[key] = value;
    }
    
    return flags;
  }
  
  /**
   * Update feature flag (admin only)
   */
  async updateFlag(name: string, enabled: boolean, rolloutPct: number = 100): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { name },
      update: { enabled, rolloutPct },
      create: { name, enabled, rolloutPct },
    });
    
    // Invalidate cache
    this.lastCacheUpdate = 0;
  }
  
  /**
   * Refresh cache if expired
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastCacheUpdate > this.cacheExpiry) {
      const flags = await this.prisma.featureFlag.findMany({
        where: { enabled: true },
      });
      
      this.cache.clear();
      flags.forEach(flag => {
        this.cache.set(flag.name, flag.enabled);
      });
      
      this.lastCacheUpdate = now;
    }
  }
  
  /**
   * Check if user is in gradual rollout
   * Uses consistent hashing so same user always gets same result
   */
  private async isUserInRollout(feature: string, userId: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { name: feature },
    });
    
    if (!flag || flag.rolloutPct === 100) {
      return true;
    }
    
    // Hash user ID to deterministic number 0-99
    const hash = this.hashUserId(userId);
    return hash < flag.rolloutPct;
  }
  
  /**
   * Simple hash function for user ID
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 100;
  }
}
```

---

## 🔧 Admin UI (Optional)

### Simple Admin Endpoint

```typescript
// backend/src/routes/admin/featureFlags.routes.ts
import { Router, Request, Response } from 'express';
import { featureFlagService } from '../../services/featureFlag.service';
import { ResponseHelper } from '../../utils/responseHelper';

const router = Router();

// TODO: Add authentication middleware
// router.use(requireAdmin);

/**
 * GET /api/admin/feature-flags
 */
router.get('/', async (req, res) => {
  const flags = await prisma.featureFlag.findMany();
  ResponseHelper.success(res, flags);
});

/**
 * PUT /api/admin/feature-flags/:name
 */
router.put('/:name', async (req, res) => {
  const { name } = req.params;
  const { enabled, rolloutPct } = req.body;
  
  await featureFlagService.updateFlag(name, enabled, rolloutPct);
  
  ResponseHelper.success(res, {
    message: `Feature flag '${name}' updated`,
  });
});

export default router;
```

---

## 📊 Gradual Rollout Strategy

### Rollout Phases

```
Phase 1: Internal (0%)        → Dev team only
Phase 2: Beta (10%)           → Power users
Phase 3: Canary (25%)         → Early adopters
Phase 4: Gradual (50%)        → Half of users
Phase 5: Majority (75%)       → Most users
Phase 6: Full (100%)          → Everyone
```

### Example Rollout

```typescript
// Week 1: Enable for 10% of users
await featureFlagService.updateFlag('bulkDownload', true, 10);

// Week 2: Increase to 25%
await featureFlagService.updateFlag('bulkDownload', true, 25);

// Week 3: Increase to 50%
await featureFlagService.updateFlag('bulkDownload', true, 50);

// Week 4: Full rollout
await featureFlagService.updateFlag('bulkDownload', true, 100);
```

---

## ✅ Best Practices

### 1. Naming Conventions

```typescript
// ✅ GOOD - Clear, descriptive
bulkDownload
queueManagement
usbExport

// ❌ BAD - Vague
feature1
newStuff
experimental
```

### 2. Flag Lifecycle

```typescript
// Add comment with creation date and expected removal
/**
 * @deprecated Remove after 2024-06-01
 * Replace with permanent solution
 */
temporaryBulkDownloadFix: boolean;
```

### 3. Clean Up Old Flags

```bash
# Find flags older than 6 months
git log --all --grep="bulkDownload" --since="6 months ago"

# If feature is stable, remove flag
# 1. Remove flag from code
# 2. Remove from feature flags config
# 3. Deploy
```

### 4. Document Flags

```typescript
// Add to MVP_FEATURES.md or separate FEATURE_FLAGS.md
/**
 * Feature Flags
 * 
 * bulkDownload - Phase 2 feature, gradual rollout started 2024-02-01
 * usbExport - Phase 3 feature, not yet released
 * newPlayerUI - A/B test, running until 2024-03-01
 */
```

---

## 📚 Related Documentation

- **Environment Config:** `.github/instructions/environment-config.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Frontend:** `.github/instructions/frontend.instructions.md`
- **MVP Features:** `.github/MVP_FEATURES.md`

---

**When to Reference:**
- ✅ Adding new features behind flags
- ✅ Doing gradual rollouts
- ✅ Running A/B tests
- ✅ Emergency feature disabling
- ✅ Managing beta features

---

**End of Feature Flags Instructions**

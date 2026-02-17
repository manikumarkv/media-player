# Feature: Cloud Sync

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Sync library metadata, playlists, and settings across devices via cloud storage. Music files remain local (too large for cloud), but all metadata, play history, and configurations sync automatically.

## User Stories
- As a user, I want my playlists on all my devices so that I can access them anywhere
- As a user, I want my play history to sync so that my listening stats are accurate across devices
- As a user, I want settings to sync so that I don't have to reconfigure on each device
- As a user, I want to control what syncs so that I can manage my privacy

## Acceptance Criteria
- [ ] Account creation/login
- [ ] Sync playlists across devices
- [ ] Sync play history/stats
- [ ] Sync settings and preferences
- [ ] Sync EQ presets
- [ ] Conflict resolution (last-write-wins or merge)
- [ ] Offline changes queue and sync when online
- [ ] Selective sync (choose what to sync)
- [ ] Data export option
- [ ] Account deletion with data removal

## Technical Approach

### Frontend Changes
- **New components:**
  - `frontend/src/components/Auth/Login.tsx` - Login form
  - `frontend/src/components/Auth/Register.tsx` - Registration form
  - `frontend/src/components/Settings/SyncSettings.tsx` - Sync configuration
  - `frontend/src/components/Settings/SyncStatus.tsx` - Sync status indicator
- **New services:**
  - `frontend/src/services/syncService.ts` - Sync management
  - `frontend/src/services/authService.ts` - Authentication
- **State changes:**
  - Add auth state to store
  - Add sync state (status, lastSync, conflicts)

### Auth Components
```typescript
// Login.tsx
function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { token, user } = await authService.login(email, password);
      localStorage.setItem('authToken', token);
      onSuccess(user);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-error text-sm">{error}</p>}
      <Button type="submit" disabled={loading} fullWidth>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

### Sync Service
```typescript
// syncService.ts
interface SyncState {
  lastSyncAt: Date | null;
  status: 'idle' | 'syncing' | 'error';
  pendingChanges: number;
  conflicts: SyncConflict[];
}

interface SyncableData {
  playlists: Playlist[];
  playHistory: PlayEvent[];
  settings: UserSettings;
  eqPresets: EQPreset[];
}

class SyncService {
  private syncState: SyncState = {
    lastSyncAt: null,
    status: 'idle',
    pendingChanges: 0,
    conflicts: []
  };

  private pendingChanges: Map<string, Change> = new Map();

  async sync(): Promise<void> {
    if (this.syncState.status === 'syncing') return;

    this.syncState.status = 'syncing';
    this.notifyListeners();

    try {
      // Get server state
      const serverData = await api.get('/api/sync/pull');

      // Get local state
      const localData = await this.getLocalData();

      // Merge changes
      const merged = this.mergeData(localData, serverData, this.pendingChanges);

      // Push merged data
      await api.post('/api/sync/push', merged);

      // Apply server changes locally
      await this.applyServerChanges(serverData);

      // Clear pending changes
      this.pendingChanges.clear();

      this.syncState = {
        lastSyncAt: new Date(),
        status: 'idle',
        pendingChanges: 0,
        conflicts: merged.conflicts
      };
    } catch (error) {
      this.syncState.status = 'error';
    }

    this.notifyListeners();
  }

  trackChange(type: string, id: string, data: any): void {
    const key = `${type}:${id}`;
    this.pendingChanges.set(key, {
      type,
      id,
      data,
      timestamp: new Date()
    });
    this.syncState.pendingChanges = this.pendingChanges.size;
    this.notifyListeners();

    // Auto-sync after delay
    this.scheduleSyncDebounced();
  }

  private mergeData(
    local: SyncableData,
    server: SyncableData,
    pending: Map<string, Change>
  ): MergedResult {
    const conflicts: SyncConflict[] = [];
    const merged: SyncableData = { ...server };

    // Merge playlists
    for (const localPlaylist of local.playlists) {
      const serverPlaylist = server.playlists.find(p => p.id === localPlaylist.id);

      if (!serverPlaylist) {
        // New local playlist
        merged.playlists.push(localPlaylist);
      } else if (localPlaylist.updatedAt > serverPlaylist.updatedAt) {
        // Local is newer - use local
        const idx = merged.playlists.findIndex(p => p.id === localPlaylist.id);
        merged.playlists[idx] = localPlaylist;
      }
      // Otherwise keep server version
    }

    // Merge play history (always additive)
    const allHistory = [...server.playHistory, ...local.playHistory];
    merged.playHistory = this.deduplicateHistory(allHistory);

    // Merge settings (last-write-wins)
    if (local.settings.updatedAt > server.settings.updatedAt) {
      merged.settings = local.settings;
    }

    return { data: merged, conflicts };
  }

  private scheduleSyncDebounced = debounce(() => {
    if (navigator.onLine) {
      this.sync();
    }
  }, 5000);
}

export const syncService = new SyncService();
```

### Sync Settings Component
```typescript
// SyncSettings.tsx
function SyncSettings() {
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    enabled: true,
    syncPlaylists: true,
    syncPlayHistory: true,
    syncSettings: true,
    syncEQPresets: true,
    autoSync: true,
    syncInterval: 5 // minutes
  });

  const { status, lastSyncAt, pendingChanges } = useSyncState();

  return (
    <div className="sync-settings space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Cloud Sync</h3>
          <p className="text-sm text-text-secondary">
            Keep your library in sync across devices
          </p>
        </div>
        <Toggle
          checked={syncConfig.enabled}
          onChange={(v) => setSyncConfig({ ...syncConfig, enabled: v })}
        />
      </div>

      {syncConfig.enabled && (
        <>
          <SyncStatusIndicator status={status} lastSync={lastSyncAt} pending={pendingChanges} />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">What to sync</h4>
            <Toggle
              label="Playlists"
              checked={syncConfig.syncPlaylists}
              onChange={(v) => setSyncConfig({ ...syncConfig, syncPlaylists: v })}
            />
            <Toggle
              label="Play history & stats"
              checked={syncConfig.syncPlayHistory}
              onChange={(v) => setSyncConfig({ ...syncConfig, syncPlayHistory: v })}
            />
            <Toggle
              label="Settings & preferences"
              checked={syncConfig.syncSettings}
              onChange={(v) => setSyncConfig({ ...syncConfig, syncSettings: v })}
            />
            <Toggle
              label="EQ presets"
              checked={syncConfig.syncEQPresets}
              onChange={(v) => setSyncConfig({ ...syncConfig, syncEQPresets: v })}
            />
          </div>

          <div className="pt-4 border-t border-border space-y-2">
            <Button variant="secondary" onClick={() => syncService.sync()}>
              Sync Now
            </Button>
            <Button variant="ghost" onClick={handleExportData}>
              Export My Data
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/auth.service.ts` - Authentication
  - `backend/src/services/sync.service.ts` - Sync logic
- **New endpoints:**
  - `POST /api/auth/register` - Create account
  - `POST /api/auth/login` - Login
  - `POST /api/auth/logout` - Logout
  - `GET /api/sync/pull` - Get server state
  - `POST /api/sync/push` - Push changes
  - `GET /api/sync/status` - Get sync status
  - `POST /api/account/export` - Export all data
  - `DELETE /api/account` - Delete account

### Sync Service (Backend)
```typescript
// sync.service.ts
class SyncService {
  async pull(userId: string): Promise<SyncableData> {
    const [playlists, playHistory, settings, eqPresets] = await Promise.all([
      prisma.playlist.findMany({ where: { userId } }),
      prisma.play.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10000
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.eqPreset.findMany({ where: { userId } })
    ]);

    return { playlists, playHistory, settings, eqPresets };
  }

  async push(userId: string, data: SyncableData): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Upsert playlists
      for (const playlist of data.playlists) {
        await tx.playlist.upsert({
          where: { id: playlist.id },
          create: { ...playlist, userId },
          update: playlist
        });
      }

      // Insert new play history (deduped)
      const existingIds = await tx.play.findMany({
        where: { userId },
        select: { id: true }
      });
      const existingIdSet = new Set(existingIds.map(p => p.id));

      const newHistory = data.playHistory.filter(p => !existingIdSet.has(p.id));
      if (newHistory.length > 0) {
        await tx.play.createMany({ data: newHistory.map(p => ({ ...p, userId })) });
      }

      // Update settings
      await tx.userSettings.upsert({
        where: { userId },
        create: { ...data.settings, userId },
        update: data.settings
      });

      // Sync EQ presets
      for (const preset of data.eqPresets) {
        await tx.eqPreset.upsert({
          where: { id: preset.id },
          create: { ...preset, userId },
          update: preset
        });
      }
    });
  }
}
```

### Database Changes
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  playlists    Playlist[]
  plays        Play[]
  settings     UserSettings?
  eqPresets    EQPreset[]
}

model UserSettings {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  theme         String   @default("system")
  volume        Float    @default(1)
  crossfade     Int      @default(0)
  // ... other settings
  updatedAt     DateTime @updatedAt
}

model EQPreset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  bands     Float[]
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Dependencies
- **Requires:** User accounts, authentication system
- **Blocks:** Multi-device feature

## Conflict Resolution Strategies

| Data Type | Strategy |
|-----------|----------|
| Playlists | Last-write-wins by `updatedAt` |
| Play History | Always merge (union) |
| Settings | Last-write-wins |
| EQ Presets | Last-write-wins |

## Notes
- Consider end-to-end encryption for sensitive data
- May want to limit history sync to last N entries
- Consider WebSocket for real-time sync
- Handle large playlists efficiently (batch sync)
- May want to offer local-only mode
- GDPR compliance: data export and deletion

# Feature: YouTube Likes Sync

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
High

## Overview
Automatically download songs when they're liked on YouTube. Connects to user's YouTube account via OAuth, monitors liked videos, and auto-downloads new music likes to the local library.

## User Stories
- As a user, I want my YouTube liked videos to automatically download so that my library stays in sync with my YouTube likes
- As a user, I want to control which liked videos get downloaded so that I don't download non-music content
- As a user, I want to see my YouTube likes history and import past likes so that I can catch up on previously liked content
- As a user, I want to disconnect my account at any time so that I maintain control over the integration

## Acceptance Criteria
- [ ] OAuth authentication with YouTube/Google
- [ ] View YouTube liked videos in app
- [ ] Auto-download new likes (configurable)
- [ ] Manual sync/import of existing likes
- [ ] Filter options: music only, specific channels, duration
- [ ] Disconnect account option
- [ ] Sync status indicator
- [ ] Handle rate limits gracefully
- [ ] Skip already downloaded videos

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/components/Settings/` - Add YouTube integration settings
- **New components:**
  - `frontend/src/components/Settings/YouTubeSync.tsx` - Sync settings
  - `frontend/src/components/Settings/YouTubeLikes.tsx` - Browse likes
  - `frontend/src/components/Settings/YouTubeFilters.tsx` - Filter config
  - `frontend/src/components/Settings/OAuthConnect.tsx` - OAuth flow
- **State changes:**
  - Add YouTube sync state to settings store

### OAuth Connection Flow
```typescript
// OAuthConnect.tsx
function OAuthConnect({ provider, onConnect }: OAuthConnectProps) {
  const [connecting, setConnecting] = useState(false);

  const initiateOAuth = async () => {
    setConnecting(true);

    // Get OAuth URL from backend
    const { authUrl } = await api.get('/api/auth/youtube/url');

    // Open popup for OAuth
    const popup = window.open(
      authUrl,
      'youtube-oauth',
      'width=500,height=600'
    );

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'oauth-success') {
        onConnect(event.data.tokens);
        popup?.close();
      } else if (event.data.type === 'oauth-error') {
        // Handle error
        popup?.close();
      }
      setConnecting(false);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  };

  return (
    <Button onClick={initiateOAuth} disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect YouTube Account'}
    </Button>
  );
}
```

### YouTube Sync Settings
```typescript
// YouTubeSync.tsx
interface YouTubeSyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  filters: {
    musicOnly: boolean;
    minDuration: number;
    maxDuration: number;
    excludeChannels: string[];
    includeChannels: string[]; // if set, only these
  };
}

function YouTubeSync() {
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<YouTubeAccount | null>(null);
  const [settings, setSettings] = useState<YouTubeSyncSettings>({
    enabled: true,
    autoSync: true,
    syncInterval: 30,
    filters: {
      musicOnly: true,
      minDuration: 60,
      maxDuration: 600,
      excludeChannels: [],
      includeChannels: []
    }
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/api/youtube/sync');
      setLastSync(new Date());
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await api.delete('/api/youtube/disconnect');
    setConnected(false);
    setAccount(null);
  };

  if (!connected) {
    return (
      <div className="youtube-sync">
        <h3 className="font-bold mb-4">YouTube Sync</h3>
        <p className="text-text-secondary mb-4">
          Connect your YouTube account to automatically download liked videos.
        </p>
        <OAuthConnect
          provider="youtube"
          onConnect={() => {
            setConnected(true);
            loadAccount();
          }}
        />
      </div>
    );
  }

  return (
    <div className="youtube-sync space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={account?.avatar}
            className="w-10 h-10 rounded-full"
            alt={account?.name}
          />
          <div>
            <p className="font-medium">{account?.name}</p>
            <p className="text-sm text-text-secondary">{account?.email}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>

      <div className="space-y-4">
        <Toggle
          label="Auto-sync new likes"
          checked={settings.autoSync}
          onChange={(v) => setSettings({ ...settings, autoSync: v })}
        />

        <div>
          <label className="text-sm font-medium">Sync interval</label>
          <Select
            value={settings.syncInterval}
            onChange={(v) => setSettings({ ...settings, syncInterval: v })}
          >
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
            <option value={360}>Every 6 hours</option>
          </Select>
        </div>

        <Toggle
          label="Music videos only"
          description="Only download videos categorized as music"
          checked={settings.filters.musicOnly}
          onChange={(v) => setSettings({
            ...settings,
            filters: { ...settings.filters, musicOnly: v }
          })}
        />

        <div>
          <label className="text-sm font-medium">Duration range</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={settings.filters.minDuration}
              onChange={(e) => setSettings({
                ...settings,
                filters: { ...settings.filters, minDuration: parseInt(e.target.value) }
              })}
              className="w-20"
            />
            <span>to</span>
            <Input
              type="number"
              value={settings.filters.maxDuration}
              onChange={(e) => setSettings({
                ...settings,
                filters: { ...settings.filters, maxDuration: parseInt(e.target.value) }
              })}
              className="w-20"
            />
            <span>seconds</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div>
          <p className="text-sm text-text-secondary">
            Last synced: {lastSync ? formatRelative(lastSync) : 'Never'}
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/youtube-auth.service.ts` - OAuth handling
  - `backend/src/services/youtube-sync.service.ts` - Sync logic
- **New endpoints:**
  - `GET /api/auth/youtube/url` - Get OAuth URL
  - `GET /api/auth/youtube/callback` - OAuth callback
  - `DELETE /api/youtube/disconnect` - Disconnect account
  - `GET /api/youtube/likes` - Get liked videos
  - `POST /api/youtube/sync` - Trigger sync
  - `GET /api/youtube/sync/status` - Get sync status

### YouTube Auth Service
```typescript
// youtube-auth.service.ts
import { google } from 'googleapis';

class YouTubeAuthService {
  private oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    });
  }

  async handleCallback(code: string): Promise<YouTubeTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Store tokens
    await prisma.youTubeAccount.upsert({
      where: { email: userInfo.email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date!)
      },
      create: {
        email: userInfo.email!,
        name: userInfo.name!,
        avatar: userInfo.picture,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt: new Date(tokens.expiry_date!)
      }
    });

    return tokens;
  }
}
```

### YouTube Sync Service
```typescript
// youtube-sync.service.ts
class YouTubeSyncService {
  async syncLikes(accountId: string): Promise<SyncResult> {
    const account = await prisma.youTubeAccount.findUnique({
      where: { id: accountId }
    });

    // Refresh token if needed
    const tokens = await this.refreshTokenIfNeeded(account);

    const youtube = google.youtube({
      version: 'v3',
      auth: this.getAuthClient(tokens)
    });

    // Get liked videos
    const result: SyncResult = {
      total: 0,
      downloaded: 0,
      skipped: 0,
      failed: 0
    };

    let pageToken: string | undefined;

    do {
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails'],
        myRating: 'like',
        maxResults: 50,
        pageToken
      });

      for (const video of response.data.items || []) {
        result.total++;

        // Check filters
        if (!this.passesFilters(video, account.settings.filters)) {
          result.skipped++;
          continue;
        }

        // Check if already downloaded
        const existing = await prisma.media.findFirst({
          where: { sourceId: video.id }
        });
        if (existing) {
          result.skipped++;
          continue;
        }

        // Download
        try {
          await downloadService.downloadSingle(
            `https://www.youtube.com/watch?v=${video.id}`
          );
          result.downloaded++;
        } catch (error) {
          result.failed++;
        }
      }

      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    // Update last sync time
    await prisma.youTubeAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() }
    });

    return result;
  }

  private passesFilters(video: any, filters: YouTubeSyncFilters): boolean {
    const duration = this.parseDuration(video.contentDetails.duration);

    if (duration < filters.minDuration || duration > filters.maxDuration) {
      return false;
    }

    if (filters.musicOnly && video.snippet.categoryId !== '10') {
      return false;
    }

    if (filters.excludeChannels.includes(video.snippet.channelId)) {
      return false;
    }

    if (filters.includeChannels.length > 0 &&
        !filters.includeChannels.includes(video.snippet.channelId)) {
      return false;
    }

    return true;
  }

  // Run as background job
  async startAutoSync(): void {
    const accounts = await prisma.youTubeAccount.findMany({
      where: {
        settings: { path: ['autoSync'], equals: true }
      }
    });

    for (const account of accounts) {
      const interval = account.settings.syncInterval || 30;
      const lastSync = account.lastSyncAt || new Date(0);
      const nextSync = new Date(lastSync.getTime() + interval * 60 * 1000);

      if (new Date() >= nextSync) {
        await this.syncLikes(account.id);
      }
    }
  }
}
```

### Database Changes
```prisma
model YouTubeAccount {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String
  avatar       String?
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  settings     Json      @default("{}")  // YouTubeSyncSettings
  lastSyncAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

## Dependencies
- **Requires:** Core download functionality, Google OAuth credentials
- **Blocks:** None

## Security Considerations
- Store refresh tokens securely (encrypted)
- Minimal OAuth scopes (readonly access only)
- Allow easy disconnection
- Clear tokens on disconnect
- Handle token expiration gracefully

## Notes
- Google API has rate limits (10,000 units/day)
- Consider webhook approach for real-time sync (requires YouTube Data API push notifications)
- May want to show preview before auto-download
- Consider notification when new likes are synced
- Handle YouTube Premium content that may not be downloadable
- May need to handle age-restricted content

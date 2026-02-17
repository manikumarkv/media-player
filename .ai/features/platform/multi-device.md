# Feature: Multi-device

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P3 (Nice to Have)

## Complexity
High

## Overview
Control playback from other devices, similar to Spotify Connect. View and control what's playing on one device from another, transfer playback between devices, and use one device as a remote for another.

## User Stories
- As a user, I want to control my desktop player from my phone so that I don't have to get up
- As a user, I want to transfer playback between devices so that I can switch from phone to desktop seamlessly
- As a user, I want to see what's playing on my other devices so that I know my current listening state
- As a user, I want to queue songs from my phone to my desktop so that I can add to the queue remotely

## Acceptance Criteria
- [ ] Device discovery (same account)
- [ ] See all active devices
- [ ] View currently playing on each device
- [ ] Control playback on any device (play/pause/skip)
- [ ] Transfer playback between devices
- [ ] Add to queue on remote device
- [ ] Volume control for remote devices
- [ ] Low-latency control (<500ms)
- [ ] Works on same network and remotely

## Technical Approach

### Architecture Options

#### Option 1: WebSocket Hub (Recommended)
- Central server manages device connections
- Devices connect via WebSocket
- Commands routed through server
- Works across networks

#### Option 2: Direct P2P (Complex)
- Devices discover each other on LAN
- WebRTC for direct connections
- Fallback to server when not on same network
- Lower latency on LAN

### Frontend Changes
- **New components:**
  - `frontend/src/components/Devices/DeviceList.tsx` - Available devices
  - `frontend/src/components/Devices/DevicePicker.tsx` - Transfer playback UI
  - `frontend/src/components/Devices/RemoteControl.tsx` - Control interface
  - `frontend/src/components/Devices/CurrentDevice.tsx` - This device info
- **New services:**
  - `frontend/src/services/deviceService.ts` - Device management
  - `frontend/src/services/remoteControl.ts` - Remote commands
- **State changes:**
  - Add devices state
  - Add remote playback state

### Device Service
```typescript
// deviceService.ts
interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'web';
  isActive: boolean;
  isPlaying: boolean;
  volume: number;
  currentTrack: Track | null;
  lastSeen: Date;
}

class DeviceService {
  private ws: WebSocket | null = null;
  private devices: Map<string, Device> = new Map();
  private thisDevice: Device;
  private listeners: Set<(devices: Device[]) => void> = new Set();

  constructor() {
    this.thisDevice = this.createDeviceInfo();
  }

  async connect(): Promise<void> {
    const token = localStorage.getItem('authToken');
    this.ws = new WebSocket(`wss://api.example.com/devices?token=${token}`);

    this.ws.onopen = () => {
      this.registerDevice();
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      // Reconnect after delay
      setTimeout(() => this.connect(), 5000);
    };
  }

  private registerDevice(): void {
    this.send({
      type: 'register',
      device: this.thisDevice
    });
  }

  private handleMessage(message: DeviceMessage): void {
    switch (message.type) {
      case 'devices':
        // Update device list
        this.devices.clear();
        for (const device of message.devices) {
          this.devices.set(device.id, device);
        }
        this.notifyListeners();
        break;

      case 'deviceUpdate':
        // Single device updated
        this.devices.set(message.device.id, message.device);
        this.notifyListeners();
        break;

      case 'command':
        // Remote command for this device
        this.handleRemoteCommand(message.command);
        break;

      case 'playbackTransfer':
        // Playback transferred to this device
        this.handlePlaybackTransfer(message.playbackState);
        break;
    }
  }

  private handleRemoteCommand(command: RemoteCommand): void {
    switch (command.action) {
      case 'play':
        playerStore.play();
        break;
      case 'pause':
        playerStore.pause();
        break;
      case 'next':
        playerStore.nextTrack();
        break;
      case 'prev':
        playerStore.prevTrack();
        break;
      case 'seek':
        playerStore.seek(command.position);
        break;
      case 'setVolume':
        playerStore.setVolume(command.volume);
        break;
      case 'addToQueue':
        playerStore.addToQueue(command.trackId);
        break;
    }
  }

  sendCommand(deviceId: string, action: string, params?: any): void {
    this.send({
      type: 'command',
      targetDeviceId: deviceId,
      command: { action, ...params }
    });
  }

  transferPlayback(targetDeviceId: string): void {
    const playbackState = {
      trackId: playerStore.currentTrack?.id,
      position: playerStore.currentTime,
      isPlaying: playerStore.isPlaying,
      queue: playerStore.queue
    };

    this.send({
      type: 'transferPlayback',
      targetDeviceId,
      playbackState
    });

    // Pause on this device
    playerStore.pause();
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private createDeviceInfo(): Device {
    return {
      id: this.getOrCreateDeviceId(),
      name: this.getDeviceName(),
      type: this.getDeviceType(),
      isActive: true,
      isPlaying: false,
      volume: 1,
      currentTrack: null,
      lastSeen: new Date()
    };
  }

  private getDeviceType(): Device['type'] {
    const ua = navigator.userAgent;
    if (/tablet/i.test(ua)) return 'tablet';
    if (/mobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getDeviceName(): string {
    // Try to get meaningful name
    const platform = navigator.platform;
    const browser = this.getBrowserName();
    return `${platform} • ${browser}`;
  }
}

export const deviceService = new DeviceService();
```

### Device List Component
```typescript
// DeviceList.tsx
function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  useEffect(() => {
    return deviceService.subscribe(setDevices);
  }, []);

  const thisDeviceId = deviceService.getThisDeviceId();

  return (
    <div className="device-list">
      <h3 className="font-medium mb-4">Available Devices</h3>

      <div className="space-y-2">
        {devices.map(device => (
          <div
            key={device.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg cursor-pointer',
              'hover:bg-bg-tertiary',
              selectedDevice === device.id && 'bg-accent/10'
            )}
            onClick={() => setSelectedDevice(device.id)}
          >
            <DeviceIcon type={device.type} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{device.name}</p>
                {device.id === thisDeviceId && (
                  <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                    This device
                  </span>
                )}
              </div>
              {device.currentTrack && (
                <p className="text-sm text-text-secondary">
                  {device.isPlaying ? '▶' : '⏸'} {device.currentTrack.title}
                </p>
              )}
            </div>
            {device.isActive && (
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </div>
        ))}
      </div>

      {selectedDevice && selectedDevice !== thisDeviceId && (
        <div className="mt-4 pt-4 border-t border-border">
          <RemoteControl deviceId={selectedDevice} />
        </div>
      )}
    </div>
  );
}
```

### Remote Control Component
```typescript
// RemoteControl.tsx
function RemoteControl({ deviceId }: { deviceId: string }) {
  const device = useDevice(deviceId);

  if (!device) return null;

  const sendCommand = (action: string, params?: any) => {
    deviceService.sendCommand(deviceId, action, params);
  };

  return (
    <div className="remote-control">
      <div className="flex items-center gap-3 mb-4">
        <img
          src={device.currentTrack?.albumArt}
          className="w-16 h-16 rounded"
          alt=""
        />
        <div>
          <p className="font-medium">{device.currentTrack?.title || 'Not playing'}</p>
          <p className="text-sm text-text-secondary">{device.currentTrack?.artist}</p>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4">
        <button onClick={() => sendCommand('prev')}>
          <SkipBack className="w-6 h-6" />
        </button>
        <button
          onClick={() => sendCommand(device.isPlaying ? 'pause' : 'play')}
          className="w-12 h-12 bg-accent rounded-full flex items-center justify-center"
        >
          {device.isPlaying ? <Pause /> : <Play />}
        </button>
        <button onClick={() => sendCommand('next')}>
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      <div className="mt-4">
        <VolumeSlider
          value={device.volume}
          onChange={(v) => sendCommand('setVolume', { volume: v })}
        />
      </div>

      <Button
        className="mt-4 w-full"
        onClick={() => deviceService.transferPlayback(deviceId)}
      >
        Transfer playback here
      </Button>
    </div>
  );
}
```

### Backend Changes
- **New services:**
  - `backend/src/services/device.service.ts` - Device management
  - `backend/src/websocket/deviceHub.ts` - WebSocket handler
- **New endpoints:**
  - `WS /devices` - WebSocket connection for device communication

### WebSocket Device Hub
```typescript
// deviceHub.ts
import { WebSocket, WebSocketServer } from 'ws';

interface ConnectedDevice {
  ws: WebSocket;
  userId: string;
  device: Device;
}

class DeviceHub {
  private devices: Map<string, ConnectedDevice> = new Map();

  handleConnection(ws: WebSocket, userId: string, deviceInfo: Device): void {
    const deviceId = deviceInfo.id;

    this.devices.set(deviceId, {
      ws,
      userId,
      device: deviceInfo
    });

    // Send current device list to new connection
    this.sendDeviceList(ws, userId);

    // Broadcast updated device list to all user's devices
    this.broadcastDeviceList(userId);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(deviceId, message);
    });

    ws.on('close', () => {
      this.devices.delete(deviceId);
      this.broadcastDeviceList(userId);
    });
  }

  private handleMessage(fromDeviceId: string, message: any): void {
    const fromDevice = this.devices.get(fromDeviceId);
    if (!fromDevice) return;

    switch (message.type) {
      case 'command':
        this.forwardCommand(fromDevice.userId, message.targetDeviceId, message.command);
        break;

      case 'transferPlayback':
        this.transferPlayback(fromDevice.userId, message.targetDeviceId, message.playbackState);
        break;

      case 'updateState':
        fromDevice.device = { ...fromDevice.device, ...message.state };
        this.broadcastDeviceList(fromDevice.userId);
        break;
    }
  }

  private forwardCommand(userId: string, targetDeviceId: string, command: any): void {
    const target = this.devices.get(targetDeviceId);
    if (target && target.userId === userId) {
      target.ws.send(JSON.stringify({
        type: 'command',
        command
      }));
    }
  }

  private transferPlayback(userId: string, targetDeviceId: string, playbackState: any): void {
    const target = this.devices.get(targetDeviceId);
    if (target && target.userId === userId) {
      target.ws.send(JSON.stringify({
        type: 'playbackTransfer',
        playbackState
      }));
    }
  }

  private broadcastDeviceList(userId: string): void {
    const userDevices = Array.from(this.devices.values())
      .filter(d => d.userId === userId)
      .map(d => d.device);

    for (const [deviceId, connected] of this.devices) {
      if (connected.userId === userId) {
        connected.ws.send(JSON.stringify({
          type: 'devices',
          devices: userDevices
        }));
      }
    }
  }

  private sendDeviceList(ws: WebSocket, userId: string): void {
    const userDevices = Array.from(this.devices.values())
      .filter(d => d.userId === userId)
      .map(d => d.device);

    ws.send(JSON.stringify({
      type: 'devices',
      devices: userDevices
    }));
  }
}

export const deviceHub = new DeviceHub();
```

### Database Changes
```prisma
model Device {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  name        String
  type        String
  lastSeenAt  DateTime  @default(now())
  createdAt   DateTime  @default(now())

  @@index([userId])
}
```

## Dependencies
- **Requires:** Cloud Sync (user accounts)
- **Blocks:** None

## Latency Targets

| Action | Target Latency |
|--------|----------------|
| Play/Pause | <200ms |
| Skip track | <300ms |
| Volume change | <100ms |
| Transfer playback | <1s |
| Device discovery | <2s |

## Notes
- WebSocket keeps connection alive, low latency
- Consider heartbeat to detect disconnected devices
- Handle reconnection gracefully
- May want to show "Last seen" for offline devices
- Consider push notifications for playback transfer on mobile
- May want to support casting to Chromecast/AirPlay in future
- Handle conflicts (two devices controlling same playback)

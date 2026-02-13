# Cross-Platform Compatibility Instructions

## 🌍 Purpose
Ensure the application works seamlessly on **Windows**, **macOS**, and **Linux** for both development and deployment.

---

## 📋 Target Operating Systems

### Development Environments
- **Windows 10/11** (PowerShell, Git Bash, WSL2)
- **macOS** (13+ Ventura, 14+ Sonoma)
- **Linux** (Ubuntu 20.04+, Debian, Fedora, Arch)

### Deployment Targets
- **Docker** (primary - OS-agnostic)
- **Native installations** (optional - OS-specific)

---

## 🎯 Cross-Platform Strategy

### Layer 1: Docker (Primary - Recommended)
**Benefits:**
- OS-agnostic containers
- Consistent environment across all platforms
- No OS-specific installations needed (except Docker)

**Requires:**
- Docker Desktop (Windows/Mac)
- Docker Engine (Linux)

### Layer 2: Native Development (Secondary)
**Benefits:**
- Faster development iteration
- Direct file system access
- No Docker overhead

**Requires:**
- OS-specific dependency installation
- Cross-platform code patterns

---

## 🔧 File System Compatibility

### Path Handling Rules

#### ✅ DO: Use Node.js `path` Module
```javascript
// CORRECT - Works on all OS
const path = require('path');
const mediaPath = path.join(process.env.MEDIA_PATH, 'downloads', filename);
const configPath = path.resolve(__dirname, '..', 'config', 'settings.json');
```

#### ❌ DON'T: Hardcode Paths
```javascript
// WRONG - Breaks on Windows
const mediaPath = '/app/media/downloads/' + filename;

// WRONG - Breaks on Unix
const configPath = 'C:\\Users\\data\\config.json';
```

### Path Separator Detection
```javascript
const path = require('path');

// Automatic OS detection
console.log(path.sep); // '\' on Windows, '/' on Unix

// Build paths safely
const filePath = ['app', 'media', 'songs', 'track.mp3'].join(path.sep);
// Windows: app\media\songs\track.mp3
// Unix: app/media/songs/track.mp3
```

### Environment Variable Defaults
```javascript
// Cross-platform default paths
const DEFAULTS = {
  MEDIA_PATH: process.platform === 'win32' 
    ? path.join(process.env.APPDATA || 'C:\\ProgramData', 'media-player', 'media')
    : process.platform === 'darwin'
      ? path.join(process.env.HOME, 'Library', 'Application Support', 'media-player', 'media')
      : path.join(process.env.HOME, '.local', 'share', 'media-player', 'media'),
  
  DOWNLOADS_PATH: process.platform === 'win32'
    ? path.join(process.env.USERPROFILE, 'Downloads')
    : path.join(process.env.HOME, 'Downloads')
};

const mediaPath = process.env.MEDIA_PATH || DEFAULTS.MEDIA_PATH;
```

---

## 🐳 Docker Configuration

### Volume Paths (Cross-Platform)

#### docker-compose.yml
```yaml
services:
  backend:
    volumes:
      # Named volume (OS-agnostic) - RECOMMENDED
      - media_files:/app/media
      
      # Bind mount (OS-specific paths)
      # Windows (PowerShell): Use absolute Windows path
      - ${MEDIA_PATH:-./media}:/app/media
      
      # Windows (Git Bash/WSL): Use Unix-style path
      # ./media maps to current directory on all OS
      - ./media:/app/media

volumes:
  media_files:
    driver: local
```

### Windows-Specific Docker Notes

**Drive Sharing (Docker Desktop):**
- Settings → Resources → File Sharing
- Enable drive (C:, D:, etc.)
- Required for bind mounts outside project directory

**Path Formats:**
```bash
# PowerShell (Windows native)
docker run -v C:\Users\username\media:/app/media

# Git Bash (Unix-style on Windows)
docker run -v /c/Users/username/media:/app/media

# WSL2 (Linux subsystem)
docker run -v /mnt/c/Users/username/media:/app/media
```

---

## 📦 Dependencies Installation

### FFmpeg (Required for MP3 Conversion)

#### Windows
```powershell
# Using Chocolatey (recommended)
choco install ffmpeg

# Manual:
# 1. Download from https://ffmpeg.org/download.html
# 2. Extract to C:\ffmpeg
# 3. Add C:\ffmpeg\bin to PATH
```

#### macOS
```bash
# Using Homebrew
brew install ffmpeg

# Using MacPorts
sudo port install ffmpeg
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y ffmpeg

# Fedora/RHEL
sudo dnf install -y ffmpeg

# Arch
sudo pacman -S ffmpeg
```

### Python & yt-dlp (Alternative Downloader)

#### Windows
```powershell
# Install Python
choco install python

# Install yt-dlp
pip install yt-dlp

# Or use standalone executable
choco install yt-dlp
```

#### macOS
```bash
# Python usually pre-installed, or:
brew install python

# Install yt-dlp
pip3 install yt-dlp

# Or via Homebrew
brew install yt-dlp
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt install python3-pip
pip3 install yt-dlp

# Or use package manager
sudo apt install yt-dlp
```

### Node.js (All Platforms)

#### Windows
```powershell
# Using Chocolatey
choco install nodejs

# Or download installer from nodejs.org
```

#### macOS
```bash
# Using Homebrew
brew install node

# Or download installer from nodejs.org
```

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

---

## 🔌 USB/Device Detection (Export Feature)

### Cross-Platform Device Detection

```javascript
const drivelist = require('drivelist');
const os = require('os');

async function detectRemovableDevices() {
  const drives = await drivelist.list();
  
  return drives.filter(drive => {
    // Filter removable devices
    if (!drive.isRemovable) return false;
    
    // Platform-specific filtering
    switch (process.platform) {
      case 'win32':
        // Windows: Drive letters (E:, F:, etc.)
        return drive.mountpoints.length > 0;
        
      case 'darwin':
        // macOS: /Volumes/NAME
        return drive.mountpoints.some(mp => 
          mp.path.startsWith('/Volumes/')
        );
        
      case 'linux':
        // Linux: /media/username/NAME or /mnt/NAME
        return drive.mountpoints.some(mp => 
          mp.path.startsWith('/media/') || 
          mp.path.startsWith('/mnt/')
        );
        
      default:
        return false;
    }
  }).map(drive => ({
    name: drive.description || drive.device,
    path: drive.mountpoints[0]?.path || '',
    size: drive.size,
    label: drive.mountpoints[0]?.label || 'Removable Drive'
  }));
}

// Usage
const devices = await detectRemovableDevices();
// Windows: [{ name: 'USB Drive', path: 'E:\\', size: 32000000000, label: 'MY_USB' }]
// macOS: [{ name: 'USB Drive', path: '/Volumes/MY_USB', size: 32000000000, label: 'MY_USB' }]
// Linux: [{ name: 'USB Drive', path: '/media/user/MY_USB', size: 32000000000, label: 'MY_USB' }]
```

### NPM Package
```bash
npm install drivelist
```

---

## ⚙️ Environment Variables

### Cross-Platform .env Template

```bash
# .env.example

# Database (works on all OS)
DATABASE_URL=postgresql://admin:password@localhost:5432/media_player_dev

# Media storage path (OS-specific defaults)
# Windows: C:\ProgramData\media-player\media
# macOS: ~/Library/Application Support/media-player/media
# Linux: ~/.local/share/media-player/media
MEDIA_PATH=

# FFmpeg binary path (if not in PATH)
# Windows: C:\ffmpeg\bin\ffmpeg.exe
# macOS/Linux: /usr/local/bin/ffmpeg (usually auto-detected)
FFMPEG_PATH=

# yt-dlp binary path (if using alternative downloader)
YTDLP_PATH=

# Port configuration
PORT=3000
FRONTEND_PORT=5173

# CORS origin (development)
CORS_ORIGIN=http://localhost:5173
```

### Loading Environment Variables
```javascript
require('dotenv').config();
const path = require('path');

// Get environment variable with fallback
function getEnvPath(key, defaultPath) {
  const envPath = process.env[key];
  if (envPath) {
    return path.resolve(envPath);
  }
  return defaultPath;
}

const config = {
  mediaPath: getEnvPath('MEDIA_PATH', path.join(__dirname, 'media')),
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg', // Assumes in PATH
  ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp'
};
```

---

## 🧪 Testing on Multiple OS

### GitHub Actions CI/CD

```yaml
name: Cross-Platform Tests

on: [push, pull_request]

jobs:
  test:
    name: Test on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install FFmpeg (Ubuntu)
        if: runner.os == 'Linux'
        run: sudo apt install -y ffmpeg
      
      - name: Install FFmpeg (macOS)
        if: runner.os == 'macOS'
        run: brew install ffmpeg
      
      - name: Install FFmpeg (Windows)
        if: runner.os == 'Windows'
        run: choco install ffmpeg -y
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          cd ../frontend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
          cd ../frontend
          npm test
      
      - name: Test file operations
        run: node test/cross-platform-paths.test.js
```

### Local Testing Script

```javascript
// test/cross-platform-paths.test.js
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Cross-Platform File Operations', () => {
  test('should create directories on all OS', async () => {
    const testDir = path.join(os.tmpdir(), 'media-player-test');
    await fs.promises.mkdir(testDir, { recursive: true });
    
    const exists = fs.existsSync(testDir);
    expect(exists).toBe(true);
    
    await fs.promises.rmdir(testDir);
  });
  
  test('should handle path separators correctly', () => {
    const filePath = path.join('app', 'media', 'song.mp3');
    
    if (process.platform === 'win32') {
      expect(filePath).toBe('app\\media\\song.mp3');
    } else {
      expect(filePath).toBe('app/media/song.mp3');
    }
  });
  
  test('should resolve relative paths consistently', () => {
    const resolved = path.resolve('media', 'downloads');
    expect(path.isAbsolute(resolved)).toBe(true);
  });
});
```

---

## 📝 Documentation for Developers

### README.md - OS-Specific Setup

````markdown
## Development Setup

### Prerequisites by OS

#### Windows
- **Docker Desktop** (WSL2 backend recommended)
- **Node.js 18+** (via Chocolatey or installer)
- **FFmpeg** (via Chocolatey: `choco install ffmpeg`)
- **Git Bash** or **WSL2** recommended for better compatibility

#### macOS
- **Docker Desktop**
- **Node.js 18+** (via Homebrew or installer)
- **FFmpeg** (via Homebrew: `brew install ffmpeg`)
- **Xcode Command Line Tools** (`xcode-select --install`)

#### Linux
- **Docker Engine** (or Docker Desktop)
- **Node.js 18+** (via apt/dnf/nvm)
- **FFmpeg** (`sudo apt install ffmpeg`)
- **Build essentials** (`sudo apt install build-essential`)

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd media-player

# Copy environment template
cp .env.example .env

# Install dependencies (all OS)
cd backend && npm install
cd ../frontend && npm install

# Start with Docker (all OS)
docker-compose up -d

# Or start natively
cd backend && npm run dev
cd ../frontend && npm run dev
```

### OS-Specific Issues

**Windows:**
- Use Git Bash or WSL2 for best compatibility
- Docker Desktop must have file sharing enabled
- Environment variables use semicolons (`;`) for PATH separator

**macOS:**
- First run requires Xcode Command Line Tools
- May need to allow Docker in Security & Privacy settings
- Use Homebrew for dependency management

**Linux:**
- Add user to `docker` group: `sudo usermod -aG docker $USER`
- May need to start Docker service: `sudo systemctl start docker`
- File permissions may differ - use `chmod` as needed
````

---

## 🚨 Common Cross-Platform Pitfalls

### 1. Line Endings
```bash
# Configure Git to handle line endings
git config --global core.autocrlf true  # Windows
git config --global core.autocrlf input # macOS/Linux
```

### 2. Case Sensitivity
```javascript
// macOS/Windows: Case-insensitive file systems
// Linux: Case-sensitive

// WRONG - May work on Windows/Mac but fail on Linux
import SomeComponent from './somecomponent';

// CORRECT - Always match exact filename
import SomeComponent from './SomeComponent';
```

### 3. Max Path Length (Windows)
```javascript
// Windows has 260 character path limit (can be disabled)
// Keep paths short or enable long paths:
// HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem
// Set LongPathsEnabled to 1
```

### 4. File Permissions
```javascript
const fs = require('fs');

// Unix: chmod 755
// Windows: Ignores Unix permissions

// Cross-platform permission check
if (fs.existsSync(filePath)) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    console.log('File is readable and writable');
  } catch (err) {
    console.error('Permission denied');
  }
}
```

---

## ✅ Best Practices

### Code Standards
1. **Always use `path.join()` or `path.resolve()`**
2. **Never hardcode file paths**
3. **Use environment variables for configurable paths**
4. **Test on all target OS before release**
5. **Handle OS-specific features with conditional logic**
6. **Document OS-specific requirements clearly**

### Docker Strategy
1. **Primary deployment method** - Use Docker for production
2. **Named volumes** for data persistence (OS-agnostic)
3. **Bind mounts** for development only (document OS-specific paths)
4. **Multi-platform builds** - Build images for linux/amd64 and linux/arm64

### Testing Strategy
1. **CI/CD on all OS** - Test matrix: Ubuntu, Windows, macOS
2. **Local VM testing** - Use VirtualBox or cloud instances
3. **Path testing suite** - Automated tests for file operations
4. **Device testing** - Test USB export on each OS

---

## 🔗 Resources

### NPM Packages for Cross-Platform
- **`cross-env`** - Set environment variables cross-platform
- **`rimraf`** - Cross-platform `rm -rf`
- **`mkdirp`** - Cross-platform `mkdir -p`
- **`drivelist`** - Detect USB/removable drives
- **`proper-lockfile`** - File locking (all OS)
- **`find-process`** - Find processes cross-platform

### Tools
- **Docker Desktop** - Windows/macOS
- **Docker Engine** - Linux
- **Chocolatey** - Windows package manager
- **Homebrew** - macOS package manager
- **WSL2** - Linux subsystem for Windows

---

**Note:** This application is **Docker-first** to minimize OS-specific issues. Native development is supported but requires more setup per OS. For production deployment, **always use Docker** for consistency across all platforms.

# Environment Configuration Guide

**Project:** YouTube Media Player - Environment Management  
**Purpose:** Define environment variables, configuration, and deployment targets  
**Scope:** Development, staging, and production environments

---

## 🎯 Overview

This project uses **environment variables** for configuration to support:
- Different deployment targets (dev/staging/production)
- Cross-platform compatibility (Windows/macOS/Linux)
- Docker containerization
- Secrets management

---

## 📋 Environment Variables

### Backend (.env)

```bash
# ================================
# APPLICATION
# ================================
NODE_ENV=development              # development | staging | production
PORT=3000                         # Backend API port
LOG_LEVEL=info                    # error | warn | info | debug
APP_NAME="Media Player API"

# ================================
# DATABASE
# ================================
DATABASE_URL="postgresql://admin:password@localhost:5432/media_player"
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# For Docker
DATABASE_URL="postgresql://admin:password@postgres:5432/media_player"

# Connection pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ================================
# FRONTEND URL (CORS)
# ================================
FRONTEND_URL=http://localhost:5173    # Dev
# FRONTEND_URL=https://app.example.com  # Production

# ================================
# MEDIA STORAGE
# ================================
# Local filesystem path
MEDIA_PATH=/app/media              # Docker path
# MEDIA_PATH=/Users/you/media      # macOS
# MEDIA_PATH=C:\Users\you\media    # Windows
# MEDIA_PATH=/home/you/media       # Linux

# Maximum file size (bytes)
MAX_FILE_SIZE=524288000            # 500 MB

# Allowed file types
ALLOWED_AUDIO_TYPES=mp3,m4a,aac,flac,wav
ALLOWED_VIDEO_TYPES=mp4,webm,mkv

# ================================
# YOUTUBE DOWNLOAD
# ================================
# Download quality preference
DEFAULT_VIDEO_QUALITY=720p
DEFAULT_AUDIO_QUALITY=192k

# Concurrent downloads
MAX_CONCURRENT_DOWNLOADS=3

# Download timeout (seconds)
DOWNLOAD_TIMEOUT=300

# ================================
# RATE LIMITING
# ================================
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window

# ================================
# LOGGING
# ================================
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m                  # 10 megabytes
LOG_MAX_FILES=7                   # Keep 7 days

# ================================
# WEBSOCKET
# ================================
WS_PATH=/ws                       # WebSocket endpoint
WS_PING_INTERVAL=30000            # 30 seconds
WS_PING_TIMEOUT=5000              # 5 seconds

# ================================
# SECURITY (Production only)
# ================================
# JWT_SECRET=your-super-secret-key-change-this-in-production
# SESSION_SECRET=another-secret-key
# ENCRYPTION_KEY=encryption-key-for-sensitive-data

# ================================
# FFMPEG (for audio conversion)
# ================================
FFMPEG_PATH=/usr/bin/ffmpeg       # Docker/Linux
# FFMPEG_PATH=/usr/local/bin/ffmpeg  # macOS (Homebrew)
# FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe  # Windows

# ================================
# FEATURE FLAGS (Optional)
# ================================
ENABLE_ANALYTICS=false
ENABLE_TELEMETRY=false
ENABLE_BULK_DOWNLOAD=true
ENABLE_USB_EXPORT=false           # Phase 3 feature
```

---

### Frontend (.env)

```bash
# ================================
# API
# ================================
VITE_API_URL=http://localhost:3000   # Backend API URL
# VITE_API_URL=https://api.example.com  # Production

VITE_WS_URL=ws://localhost:3000      # WebSocket URL
# VITE_WS_URL=wss://api.example.com    # Production

# ================================
# APPLICATION
# ================================
VITE_APP_NAME="Media Player"
VITE_APP_VERSION=1.0.0

# ================================
# FEATURES
# ================================
VITE_ENABLE_DEBUG=true               # Show debug info
VITE_ENABLE_ANALYTICS=false

# ================================
# PLAYER SETTINGS
# ================================
VITE_DEFAULT_VOLUME=80               # 0-100
VITE_SEEK_STEP=10                    # Seconds to skip
VITE_MAX_QUEUE_SIZE=500

# ================================
# UI SETTINGS
# ================================
VITE_DEFAULT_THEME=dark              # dark | light
VITE_ITEMS_PER_PAGE=20               # Default pagination
```

---

### Database (.env for PostgreSQL Container)

```bash
# ================================
# POSTGRES
# ================================
POSTGRES_USER=admin
POSTGRES_PASSWORD=secure_password_change_me
POSTGRES_DB=media_player

# Connection
POSTGRES_HOST=localhost              # or 'postgres' in Docker
POSTGRES_PORT=5432

# Performance
POSTGRES_MAX_CONNECTIONS=100
POSTGRES_SHARED_BUFFERS=256MB
```

---

## 📂 Environment Files

### File Structure

```
downloder/
├── .env.example                 # Template (checked into git)
├── .env                         # Local dev (NOT in git)
├── .env.development             # Development overrides
├── .env.staging                 # Staging environment
├── .env.production              # Production environment
├── backend/
│   ├── .env.example             # Backend template
│   └── .env                     # Backend local (NOT in git)
└── frontend/
    ├── .env.example             # Frontend template
    └── .env                     # Frontend local (NOT in git)
```

### .gitignore Configuration

```gitignore
# Environment files
.env
.env.local
.env.*.local
.env.development.local
.env.staging.local
.env.production.local

# But keep examples
!.env.example
!.env.*.example
```

---

## 🚀 Deployment Targets

### 1. Local Development

**Purpose:** Development on your machine  
**Database:** Docker PostgreSQL container  
**Media Storage:** Local filesystem

**.env.development:**
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://admin:devpass@localhost:5432/media_player_dev
FRONTEND_URL=http://localhost:5173
MEDIA_PATH=./media
LOG_LEVEL=debug
ENABLE_DEBUG=true
```

**Start:**
```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env

# Start services
docker-compose up -d postgres
cd backend && pnpm dev
cd frontend && pnpm dev
```

---

### 2. Docker Compose (All Containers)

**Purpose:** Full containerized stack  
**Database:** PostgreSQL container  
**Media Storage:** Docker volume

**docker-compose.yml uses:**
```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-media_player}
  
  backend:
    environment:
      NODE_ENV: ${NODE_ENV:-production}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      MEDIA_PATH: /app/media
      PORT: 3000
  
  frontend:
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3000}
```

**Start:**
```bash
# Copy and configure
cp .env.example .env
nano .env

# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f
```

---

### 3. Production (Cloud/Server)

**Purpose:** Production deployment  
**Database:** Managed PostgreSQL (AWS RDS, etc.)  
**Media Storage:** Persistent volume or S3

**.env.production:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/media_player
FRONTEND_URL=https://app.example.com
MEDIA_PATH=/var/media
LOG_LEVEL=warn
ENABLE_DEBUG=false

# Security
JWT_SECRET=super-secret-production-key-change-this
SESSION_SECRET=another-production-secret

# Rate limiting (stricter)
RATE_LIMIT_MAX_REQUESTS=50

# Production optimizations
DATABASE_POOL_MAX=20
MAX_CONCURRENT_DOWNLOADS=5
```

---

## 🔐 Secrets Management

### Development (Local)

Use `.env` files (not committed to git)

```bash
# Copy example
cp .env.example .env

# Add your secrets
echo "DATABASE_PASSWORD=my_secret_password" >> .env
```

---

### Production Options

#### Option 1: Environment Variables (Recommended for Docker)

```bash
# Set in shell before starting
export DATABASE_PASSWORD="secret_password"
docker-compose up -d
```

#### Option 2: Docker Secrets

```yaml
# docker-compose.yml
services:
  backend:
    secrets:
      - db_password
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

```bash
# Create secret
mkdir secrets
echo "my_secret_password" > secrets/db_password.txt
chmod 600 secrets/db_password.txt
```

#### Option 3: Cloud Provider Secrets (AWS, GCP, Azure)

```typescript
// backend/src/config/secrets.ts
import { SecretsManager } from 'aws-sdk';

export async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManager({ region: 'us-east-1' });
  const result = await client.getSecretValue({ SecretId: secretName }).promise();
  return result.SecretString || '';
}

// Usage
const dbPassword = await getSecret('prod/database/password');
```

#### Option 4: Vault (HashiCorp)

```typescript
// backend/src/config/vault.ts
import vault from 'node-vault';

const client = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN
});

export async function getVaultSecret(path: string): Promise<any> {
  const result = await client.read(path);
  return result.data;
}
```

---

## 🔧 Configuration Loading

### Backend Configuration

```typescript
// backend/src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'staging'
  ? '.env.staging'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Validation schema
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production']),
  port: z.number().min(1024).max(65535),
  databaseUrl: z.string().url(),
  frontendUrl: z.string().url(),
  mediaPath: z.string(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
  maxFileSize: z.number().positive(),
  defaultVideoQuality: z.enum(['144p', '240p', '360p', '480p', '720p', '1080p']),
  maxConcurrentDownloads: z.number().min(1).max(10),
});

// Parse and validate
export const config = configSchema.parse({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: process.env.FRONTEND_URL,
  mediaPath: process.env.MEDIA_PATH,
  logLevel: process.env.LOG_LEVEL || 'info',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000', 10),
  defaultVideoQuality: process.env.DEFAULT_VIDEO_QUALITY || '720p',
  maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || '3', 10),
});

// Type-safe config
export type Config = z.infer<typeof configSchema>;

// Validate on startup
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

console.log('Configuration loaded:', {
  ...config,
  databaseUrl: '***REDACTED***', // Don't log secrets
});
```

### Frontend Configuration

```typescript
// frontend/src/config/index.ts

// Vite automatically exposes VITE_* variables
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'Media Player',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  defaultVolume: parseInt(import.meta.env.VITE_DEFAULT_VOLUME || '80', 10),
  seekStep: parseInt(import.meta.env.VITE_SEEK_STEP || '10', 10),
  itemsPerPage: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '20', 10),
  defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'dark',
} as const;

// Validate critical values
if (!config.apiUrl) {
  throw new Error('VITE_API_URL is required');
}

console.log('Frontend config:', config);
```

---

## 🧪 Testing Environments

### Test Configuration (.env.test)

```bash
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://admin:test@localhost:5432/media_player_test
MEDIA_PATH=./test-media
LOG_LEVEL=error
ENABLE_ANALYTICS=false
```

**Usage:**
```bash
# Run tests with test environment
NODE_ENV=test pnpm test

# Or in package.json
{
  "scripts": {
    "test": "NODE_ENV=test vitest",
    "test:e2e": "NODE_ENV=test playwright test"
  }
}
```

---

## 📊 Environment Comparison

| Variable | Development | Staging | Production |
|----------|------------|---------|------------|
| NODE_ENV | development | staging | production |
| LOG_LEVEL | debug | info | warn |
| ENABLE_DEBUG | true | true | false |
| DATABASE_POOL_MAX | 5 | 10 | 20 |
| RATE_LIMIT_MAX | 1000 | 100 | 50 |
| MAX_CONCURRENT_DOWNLOADS | 1 | 3 | 5 |
| FRONTEND_URL | localhost:5173 | staging.example.com | app.example.com |

---

## ✅ Validation Checklist

**Before deploying to any environment:**

- [ ] All required variables are set
- [ ] Secrets are not hardcoded
- [ ] Database URL is correct
- [ ] Frontend URL matches deployment
- [ ] Media path exists and is writable
- [ ] FFmpeg path is correct
- [ ] Log directory exists
- [ ] Rate limits are appropriate
- [ ] CORS settings allow frontend
- [ ] File size limits are reasonable
- [ ] Test configuration loading

---

## 🐛 Troubleshooting

### Problem: "DATABASE_URL is required"

**Solution:**
```bash
# Check if .env file exists
ls -la .env

# Copy example if missing
cp .env.example .env

# Verify DATABASE_URL is set
cat .env | grep DATABASE_URL
```

### Problem: "Cannot connect to database"

**Solutions:**
```bash
# 1. Check database is running
docker-compose ps postgres

# 2. Check connection string format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# 3. Test connection
docker-compose exec backend npx prisma db pull
```

### Problem: "Media path not found"

**Solutions:**
```bash
# 1. Create directory
mkdir -p /path/to/media

# 2. Set permissions
chmod 755 /path/to/media

# 3. Update .env
echo "MEDIA_PATH=/path/to/media" >> .env
```

### Problem: "CORS error in browser"

**Solution:**
```bash
# Update backend .env
FRONTEND_URL=http://localhost:5173

# Or your frontend URL
FRONTEND_URL=https://app.example.com
```

---

## 📚 Related Documentation

- **Docker:** `.github/instructions/docker.instructions.md`
- **Database:** `.github/instructions/database.instructions.md`
- **Security:** `.github/instructions/security.instructions.md`
- **Cross-platform:** `.github/instructions/cross-platform.instructions.md`

---

## 🚀 Quick Setup Commands

```bash
# === Development Setup ===
cp .env.example .env
nano .env  # Edit with your values
docker-compose up -d postgres
cd backend && pnpm install && pnpm prisma migrate dev
cd frontend && pnpm install
pnpm dev

# === Docker Setup (All containers) ===
cp .env.example .env
nano .env
docker-compose up -d
docker-compose logs -f

# === Production Setup ===
cp .env.example .env.production
nano .env.production
export $(cat .env.production | xargs)
docker-compose -f docker-compose.prod.yml up -d
```

---

**When to Reference:**
- ✅ Initial project setup
- ✅ Deploying to new environment
- ✅ Troubleshooting configuration issues
- ✅ Adding new environment variables
- ✅ Setting up CI/CD

---

**End of Environment Configuration Guide**

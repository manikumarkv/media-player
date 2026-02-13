# Docker & Containerization Instructions

## Overview
This skill provides expertise for Docker containerization of the media player application using a multi-container architecture with docker-compose.

## Architecture
- **3 Containers**: Frontend (Nginx + React), Backend (Node.js), Database (PostgreSQL)
- **Docker Compose**: Orchestrates all services
- **Volumes**: Persistent storage for database and media files
- **Networking**: Internal bridge network for inter-container communication

---

## Multi-Container Architecture

### Services Overview

```yaml
services:
  postgres:     # Database container
  backend:      # Node.js API server
  frontend:     # Nginx serving React build
```

**Communication Flow:**
```
User → Frontend (Port 80)
    ↓
Frontend → Backend (Internal network)
    ↓
Backend → PostgreSQL (Internal network)
```

---

## Docker Compose Configuration

### docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: media-player-db
    environment:
      POSTGRES_DB: media_player_prod
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d media_player_prod"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Backend API Server
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: media-player-backend
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/media_player_prod
      MEDIA_PATH: /app/media
    volumes:
      - media_files:/app/media
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Frontend Web Server
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: media-player-frontend
    ports:
      - "${PORT:-8080}:80"
    depends_on:
      - backend
    networks:
      - app-network
    restart: unless-stopped

# Named volumes for persistence
volumes:
  postgres_data:
    name: media-player-db-data
  media_files:
    name: media-player-downloads

# Internal network
networks:
  app-network:
    driver: bridge
    name: media-player-network
```

### Environment Variables
```bash
# .env
DB_PASSWORD=your_secure_password_here
PORT=8080
```

---

## Backend Dockerfile

### Multi-Stage Build for Optimization
```dockerfile
# backend/Dockerfile

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    ca-certificates

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY tsconfig.json ./

# Install dev dependencies for build
RUN npm install --only=development

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Create downloads directory
RUN mkdir -p /app/media && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### Backend .dockerignore
```
node_modules/
dist/
*.log
.env
.env.local
.git/
.gitignore
README.md
coverage/
.nyc_output/
*.md
.vscode/
.idea/
downloads/
```

---

## Frontend Dockerfile

### Multi-Stage Build
```dockerfile
# frontend/Dockerfile

# Stage 1: Build React application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Stage 2: Nginx server
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx content
RUN rm -rf ./*

# Copy built application
COPY --from=builder /app/dist .

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration
```nginx
# frontend/nginx.conf

server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support for Socket.io
    location /socket.io {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Frontend .dockerignore
```
node_modules/
dist/
*.log
.env
.env.local
.git/
.gitignore
README.md
coverage/
.vscode/
.idea/
```

---

## Database Initialization

### init.sql (Optional)
```sql
-- database/init.sql
-- Any initial database setup can go here
-- Prisma will handle schema creation via migrations

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Docker Commands

### Build and Start All Services
```bash
# Build and start all containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Development Commands
```bash
# Restart single service
docker-compose restart backend

# Rebuild single service
docker-compose up -d --build backend

# Access container shell
docker-compose exec backend sh
docker-compose exec postgres psql -U admin -d youtube_downloader

# View running containers
docker-compose ps

# Check health status
docker-compose ps --services --filter "status=running"
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect media-player-downloads

# Backup database
docker-compose exec postgres pg_dump -U admin youtube_downloader > backup.sql

# Restore database
docker-compose exec -T postgres psql -U admin youtube_downloader < backup.sql
```

---

## Development vs Production

### Development Configuration
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      target: dependencies  # Stop at dependencies stage
    command: npm run dev  # Use dev server with hot reload
    volumes:
      - ./backend/src:/app/src  # Mount source for live reload
    environment:
      NODE_ENV: development

  frontend:
    build:
      context: ./frontend
      target: builder  # Use builder stage
    command: npm run dev
    volumes:
      - ./frontend/src:/app/src
    ports:
      - "5173:5173"  # Vite dev server
```

### Production Configuration
Use the main `docker-compose.yml` (already optimized for production)

---

## Networking

### Internal Communication
All services communicate via the `app-network` bridge network:
- Frontend → Backend: `http://backend:3000`
- Backend → PostgreSQL: `postgresql://admin:password@postgres:5432/youtube_downloader`

### External Access
Only frontend port is exposed to host:
- User accesses: `http://localhost:8080`
- Nginx proxies `/api` requests to backend internally

---

## Volume Strategy

### PostgreSQL Data
```yaml
postgres_data:
  # Persists database across container restarts
  # Location: Docker managed volume
```

### Media Files
```yaml
media_files:
  # Stores downloaded videos/audio
  # Shared between backend (writes) and user (reads via API)
```

### Accessing Downloads from Host
```bash
# Method 1: Use docker cp
docker cp media-player-backend:/app/media/song.mp3 ./

# Method 2: Bind mount (add to docker-compose.yml)
volumes:
  - ./local-media_files:/app/media
```

---

## Health Checks

### Backend Health Endpoint
```typescript
// Add to backend/src/server.ts
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

### PostgreSQL Health
```bash
pg_isready -U admin -d youtube_downloader
```

---

## Security Best Practices

### 1. Non-Root User
```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 2. Secrets Management
```bash
# Never commit .env file
# Use docker secrets for production
docker secret create db_password ./db_password.txt
```

### 3. Network Isolation
- Only expose necessary ports
- Use internal network for service communication
- Implement firewall rules if deployed publicly

### 4. Image Updates
```bash
# Regularly update base images
docker pull node:18-alpine
docker pull postgres:15-alpine
docker pull nginx:alpine
```

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check health status
docker-compose ps

# Inspect container
docker inspect media-player-backend
```

### Database Connection Issues
```bash
# Test database connectivity
docker-compose exec backend sh
wget -qO- http://postgres:5432

# Check environment variables
docker-compose exec backend env | grep DATABASE
```

### Permission Issues
```bash
# Fix file permissions
docker-compose exec backend chown -R nodejs:nodejs /app/media
```

### Out of Disk Space
```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

---

## Production Deployment Checklist

- [ ] Set strong DATABASE_PASSWORD in .env
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS (add nginx https config)
- [ ] Enable log rotation
- [ ] Set up automated backups
- [ ] Configure monitoring (Prometheus, Grafana)
- [ ] Set resource limits in docker-compose
- [ ] Use secrets management
- [ ] Regular security updates
- [ ] Test disaster recovery

---

## Resource Limits (Optional)

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Common Pitfalls

### ❌ Don't
- Don't expose database port to host
- Don't hardcode secrets in Dockerfiles
- Don't run as root user
- Don't ignore .dockerignore
- Don't use `latest` tag in production

### ✅ Do
- Use multi-stage builds
- Implement health checks
- Use named volumes for persistence
- Keep images small (alpine)
- Regular security updates
- Monitor resource usage

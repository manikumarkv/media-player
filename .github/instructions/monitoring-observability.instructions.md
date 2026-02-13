# Monitoring & Observability Instructions

**Project:** YouTube Media Player - Monitoring & Observability  
**Purpose:** Setup logging, metrics, tracing, and alerting for production readiness  
**Scope:** Development, staging, and production environments

---

## 🎯 Overview

**Observability** = Logging + Metrics + Tracing

This guide covers how to monitor your application's health, performance, and user experience.

### Why Observability Matters

- 🔍 **Debug production issues** - Find root causes quickly
- 📊 **Track performance** - Identify bottlenecks
- 🚨 **Get alerted** - Know about problems before users complain
- 📈 **Make decisions** - Data-driven improvements

---

## 📋 Three Pillars of Observability

### 1. Logging (What happened?)

**Events, errors, and messages**

```typescript
logger.info('User downloaded media', { mediaId, userId, duration });
logger.error('Download failed', { error, url });
```

### 2. Metrics (How much/how fast?)

**Quantitative measurements**

```typescript
downloadCounter.inc();
downloadDuration.observe(duration);
activeUsers.set(count);
```

### 3. Tracing (Where did it go?)

**Request flows through services**

```typescript
span.start('downloadVideo');
// ... download logic
span.end();
```

---

## 🛠️ Tech Stack Recommendations

### For MVP (Simple & Free)

**Logging:** Winston + File rotation  
**Metrics:** Custom endpoint `/metrics`  
**Monitoring:** Manual checks + cron health checks

**Pros:** Simple, no external dependencies  
**Cons:** Manual, limited insights

---

### For Production (Recommended)

**Option 1: Open Source Stack**
- **Logging:** Winston → Loki (or ELK)
- **Metrics:** Prometheus
- **Tracing:** Jaeger (optional for MVP)
- **Dashboards:** Grafana
- **Alerting:** Grafana alerts

**Pros:** Free, powerful, self-hosted  
**Cons:** Setup complexity, maintenance

---

**Option 2: SaaS (Easiest)**
- **All-in-one:** Datadog, New Relic, or Sentry
- **Logging:** Logtail, Papertrail
- **Metrics:** Datadog, CloudWatch
- **Errors:** Sentry

**Pros:** Easy setup, managed  
**Cons:** Cost (free tiers available)

---

## 📝 Logging Implementation

### Backend Logging Setup

```typescript
// backend/src/config/logger.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'media-player-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console output (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    
    // Error logs (separate file)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    
    // All logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Production: Add external service
if (process.env.NODE_ENV === 'production') {
  // Option: Send to Logtail
  // logger.add(new LogtailTransport({
  //   sourceToken: process.env.LOGTAIL_TOKEN,
  // }));
  
  // Option: Send to Datadog
  // logger.add(new DatadogTransport({
  //   apiKey: process.env.DATADOG_API_KEY,
  // }));
}
```

---

### Logging Best Practices

```typescript
// ✅ GOOD - Structured logging
logger.info('Download started', {
  mediaId: '123',
  url: 'https://youtube.com/...',
  quality: '720p',
  userId: 'user-456',
  timestamp: new Date().toISOString(),
});

// ✅ GOOD - Error with context
logger.error('Download failed', {
  error: error.message,
  stack: error.stack,
  mediaId: '123',
  url: 'https://youtube.com/...',
});

// ✅ GOOD - Performance tracking
const start = Date.now();
await downloadVideo(url);
logger.info('Download completed', {
  duration: Date.now() - start,
  mediaId: '123',
});

// ❌ BAD - Unstructured
logger.info('User downloaded a video');

// ❌ BAD - Too verbose
logger.debug('Line 45 executed');
logger.debug('Variable x is 5');

// ❌ BAD - Sensitive data
logger.info('User password:', password); // NEVER!
```

---

### Request Logging Middleware

```typescript
// backend/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate request ID
  const requestId = uuidv4();
  req.id = requestId;
  
  // Start time
  const start = Date.now();
  
  // Log request
  logger.info('Request received', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
    
    // Warn on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        path: req.path,
        duration,
      });
    }
  });
  
  next();
}

// Usage in server.ts
app.use(requestLogger);
```

---

## 📊 Metrics Implementation

### Prometheus Metrics Setup

```typescript
// backend/src/config/metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

// Create registry
export const register = new Registry();

// Default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register });

// Custom metrics
export const metrics = {
  // Counters (always increasing)
  httpRequestsTotal: new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status'],
    registers: [register],
  }),
  
  downloadsTotal: new Counter({
    name: 'downloads_total',
    help: 'Total number of downloads',
    labelNames: ['type', 'quality', 'status'],
    registers: [register],
  }),
  
  downloadsFailedTotal: new Counter({
    name: 'downloads_failed_total',
    help: 'Total number of failed downloads',
    labelNames: ['reason'],
    registers: [register],
  }),
  
  // Histograms (distributions)
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register],
  }),
  
  downloadDuration: new Histogram({
    name: 'download_duration_seconds',
    help: 'Download duration in seconds',
    labelNames: ['type', 'quality'],
    buckets: [10, 30, 60, 120, 300],
    registers: [register],
  }),
  
  downloadSize: new Histogram({
    name: 'download_size_bytes',
    help: 'Download size in bytes',
    labelNames: ['type'],
    buckets: [1e6, 10e6, 50e6, 100e6, 500e6],
    registers: [register],
  }),
  
  // Gauges (current value)
  activeDownloads: new Gauge({
    name: 'active_downloads',
    help: 'Number of active downloads',
    registers: [register],
  }),
  
  mediaLibrarySize: new Gauge({
    name: 'media_library_size_total',
    help: 'Total number of media items',
    registers: [register],
  }),
  
  databaseConnections: new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
    registers: [register],
  }),
};
```

---

### Metrics Endpoint

```typescript
// backend/src/routes/metrics.routes.ts
import { Router, Request, Response } from 'express';
import { register } from '../config/metrics';

const router = Router();

/**
 * GET /metrics - Prometheus metrics endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

export default router;

// In server.ts
import metricsRouter from './routes/metrics.routes';
app.use('/metrics', metricsRouter);
```

---

### Using Metrics in Code

```typescript
// In your service
import { metrics } from '../config/metrics';

export class DownloadService {
  async downloadVideo(url: string, quality: string): Promise<Media> {
    // Increment active downloads
    metrics.activeDownloads.inc();
    
    const startTime = Date.now();
    
    try {
      // Download logic
      const video = await ytdl(url, { quality });
      
      // Record success
      metrics.downloadsTotal.inc({ 
        type: 'video', 
        quality,
        status: 'success' 
      });
      
      // Record duration
      const duration = (Date.now() - startTime) / 1000;
      metrics.downloadDuration.observe({ type: 'video', quality }, duration);
      
      // Record size
      metrics.downloadSize.observe({ type: 'video' }, video.size);
      
      return video;
      
    } catch (error) {
      // Record failure
      metrics.downloadsTotal.inc({ 
        type: 'video', 
        quality,
        status: 'failed' 
      });
      
      metrics.downloadsFailedTotal.inc({ 
        reason: error.message 
      });
      
      throw error;
      
    } finally {
      // Decrement active downloads
      metrics.activeDownloads.dec();
    }
  }
}
```

---

### HTTP Metrics Middleware

```typescript
// backend/src/middleware/metricsMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { metrics } from '../config/metrics';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    // Record request count
    metrics.httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });
    
    // Record duration
    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        path: req.route?.path || req.path,
        status: res.statusCode,
      },
      duration
    );
  });
  
  next();
}

// Usage
app.use(metricsMiddleware);
```

---

## 📈 Health Checks

### Health Check Endpoint

```typescript
// backend/src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import fs from 'fs/promises';

const router = Router();

/**
 * GET /health - Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /health/ready - Readiness check (for Kubernetes)
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check media directory
    await fs.access(process.env.MEDIA_PATH!);
    
    res.json({
      status: 'ready',
      checks: {
        database: 'ok',
        filesystem: 'ok',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /health/live - Liveness check (for Kubernetes)
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

export default router;

// In server.ts
import healthRouter from './routes/health.routes';
app.use('/health', healthRouter);
```

---

## 🔍 Distributed Tracing (Advanced)

### OpenTelemetry Setup

```typescript
// backend/src/config/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

// Only in production
if (process.env.ENABLE_TRACING === 'true') {
  const sdk = new NodeSDK({
    serviceName: 'media-player-api',
    traceExporter: new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  sdk.start();
}
```

---

## 📊 Grafana Dashboard (Prometheus)

### docker-compose.yml

```yaml
services:
  # ... existing services
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - app-network
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - app-network
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

### prometheus.yml

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'media-player-api'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
```

---

## 🚨 Alerting

### Alerting Rules (Prometheus)

```yaml
# alerts.yml
groups:
  - name: media_player_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"
      
      # Slow requests
      - alert: SlowRequests
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile latency is high"
          description: "P95 latency is {{ $value }}s"
      
      # Many download failures
      - alert: HighDownloadFailureRate
        expr: rate(downloads_failed_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High download failure rate"
          description: "{{ $value }} downloads/sec are failing"
      
      # Service down
      - alert: ServiceDown
        expr: up{job="media-player-api"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "Service has been down for 1 minute"
      
      # Disk space low
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/app/media"} / node_filesystem_size_bytes < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low"
          description: "Less than 10% disk space remaining"
```

---

## 📱 Frontend Monitoring

### Error Tracking (Sentry)

```typescript
// frontend/src/config/monitoring.ts
import * as Sentry from '@sentry/react';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Usage
export function logError(error: Error, context?: Record<string, any>) {
  console.error(error);
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
```

### Performance Monitoring

```typescript
// frontend/src/utils/performance.ts

export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  
  // Log slow operations
  if (duration > 100) {
    console.warn(`Slow operation: ${name} took ${duration}ms`);
  }
  
  // Send to analytics (optional)
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name,
      value: Math.round(duration),
      event_category: 'Performance',
    });
  }
}
```

---

## 📊 Key Metrics to Track

### Backend Metrics

**Request Metrics:**
- Request count (by endpoint, status)
- Request duration (P50, P95, P99)
- Error rate (4xx, 5xx)

**Download Metrics:**
- Downloads started/completed/failed
- Download duration
- Download size
- Concurrent downloads

**Resource Metrics:**
- CPU usage
- Memory usage
- Disk space
- Database connections

**Business Metrics:**
- Total media items
- Total storage used
- Active users
- Most downloaded content

---

### Frontend Metrics

**User Experience:**
- Page load time
- Time to interactive
- First contentful paint
- Largest contentful paint

**Errors:**
- JavaScript errors
- API errors (by endpoint)
- Network errors

**User Actions:**
- Plays per user
- Downloads per user
- Playlist creations
- Search queries

---

## ✅ Implementation Checklist

**Phase 1: MVP (Basic)**
- [ ] Winston logging setup
- [ ] Request logging middleware
- [ ] Error logging
- [ ] Log rotation
- [ ] Health check endpoint
- [ ] Basic metrics endpoint

**Phase 2: Production (Essential)**
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Alert rules
- [ ] Frontend error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Log aggregation

**Phase 3: Advanced (Optional)**
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Custom Grafana dashboards
- [ ] PagerDuty/Slack alerts
- [ ] User session replay
- [ ] A/B testing analytics

---

## 📚 Related Documentation

- **Error Handling:** `.github/instructions/error-handling.instructions.md`
- **Performance:** `.github/instructions/performance.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Frontend:** `.github/instructions/frontend.instructions.md`

---

**When to Reference:**
- ✅ Setting up logging
- ✅ Adding metrics
- ✅ Debugging production issues
- ✅ Performance optimization
- ✅ Setting up alerts

---

**End of Monitoring & Observability Instructions**

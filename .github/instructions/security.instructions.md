# Security Best Practices Instructions

**Project:** YouTube Media Player - Security Standards  
**Purpose:** Define security patterns, input validation, rate limiting, secure headers  
**Scope:** API security, input sanitization, authentication, CORS, secrets management

---

## 🎯 Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal permissions
3. **Fail Securely** - Errors don't expose sensitive data
4. **Input Validation** - Never trust user input
5. **Security by Default** - Secure configurations out of the box

---

## 🛡️ Essential Security Packages

### Backend Dependencies

\`\`\`json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "cors": "^2.8.5",
    "zod": "^3.22.0",
    "express-validator": "^7.0.0",
    "bcrypt": "^5.1.0"
  }
}
\`\`\`

---

## 🔒 Helmet.js Configuration

### Security Headers Setup

\`\`\`typescript
// backend/src/middleware/security.middleware.ts
import helmet from 'helmet';
import { Express } from 'express';

export function configureSecurity(app: Express) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));
}
\`\`\`

---

## ⚡ Rate Limiting

### API Rate Limiting

\`\`\`typescript
// backend/src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Download endpoint rate limit (stricter)
export const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 downloads per hour
  message: 'Download limit exceeded, please try again later',
  skipSuccessfulRequests: true,
});

// Usage in routes
app.use('/api', apiLimiter);
app.use('/api/download', downloadLimiter);
\`\`\`

---

## ✅ Input Validation with Zod

### Request Validation Schemas

\`\`\`typescript
// backend/src/schemas/media.schema.ts
import { z } from 'zod';

export const downloadVideoSchema = z.object({
  url: z.string()
    .url('Invalid YouTube URL')
    .regex(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//, 'Must be a YouTube URL'),
  quality: z.enum(['1080p', '720p', '480p', '360p']).optional(),
  type: z.enum(['video', 'audio']),
});

export const createPlaylistSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
});

// Validation middleware
export function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Usage in routes
app.post('/api/download', validate(downloadVideoSchema), downloadController);
\`\`\`

---

## 🌐 CORS Configuration

### Cross-Origin Setup

\`\`\`typescript
// backend/src/middleware/cors.middleware.ts
import cors from 'cors';

export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
\`\`\`

---

## 🔐 Environment Variables

### Secrets Management

\`\`\`bash
# .env.example
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Security
SESSION_SECRET=CHANGE_THIS_IN_PRODUCTION
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION

# File Storage
DOWNLOADS_PATH=/app/downloads
MAX_FILE_SIZE_MB=500

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

**Never commit .env to Git!**

\`\`\`gitignore
# .gitignore
.env
.env.local
.env.production
\`\`\`

---

## 🛡️ SQL Injection Prevention

### Use Parameterized Queries

\`\`\`typescript
// ❌ BAD - Vulnerable to SQL injection
const media = await prisma.$queryRaw\`
  SELECT * FROM media WHERE title = '\${userInput}'
\`;

// ✅ GOOD - Use Prisma ORM (safe by default)
const media = await prisma.media.findMany({
  where: {
    title: {
      contains: userInput,
    },
  },
});
\`\`\`

---

## 🚫 Path Traversal Prevention

### Secure File Operations

\`\`\`typescript
// backend/src/utils/file.utils.ts
import path from 'path';
import { DOWNLOADS_PATH } from '../config/constants';

export function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
}

export function getSecureFilePath(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const fullPath = path.join(DOWNLOADS_PATH, sanitized);
  
  // Ensure path is within allowed directory
  if (!fullPath.startsWith(DOWNLOADS_PATH)) {
    throw new Error('Invalid file path');
  }
  
  return fullPath;
}
\`\`\`

---

## 🔍 Security Scanning

### NPM Audit

\`\`\`bash
# Run regularly
npm audit

# Fix automatically (use with caution)
npm audit fix

# Check for high/critical only
npm audit --audit-level=high
\`\`\`

### Snyk Integration

\`\`\`bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
\`\`\`

---

## 🚨 Error Handling

### Secure Error Messages

\`\`\`typescript
// backend/src/middleware/error.middleware.ts
export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
    });
  } else {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  }
}
\`\`\`

---

## 📋 Security Checklist

### Before Production

- [ ] All dependencies up to date (\`npm outdated\`)
- [ ] No high/critical vulnerabilities (\`npm audit\`)
- [ ] Environment variables in .env (not hardcoded)
- [ ] Helmet.js configured with strict CSP
- [ ] Rate limiting on all public endpoints
- [ ] Input validation on all user inputs
- [ ] CORS restricted to frontend domain
- [ ] SQL injection prevention (use ORM)
- [ ] Path traversal prevention (sanitize filenames)
- [ ] Error messages don't expose sensitive info
- [ ] Secrets not committed to Git
- [ ] HTTPS enabled (production)
- [ ] Database backups configured
- [ ] Security headers tested (securityheaders.com)

---

## 📚 Related Instructions

- **Backend:** \`.github/instructions/backend.instructions.md\`
- **CI/CD:** \`.github/instructions/cicd.instructions.md\`
- **API Testing:** \`.github/instructions/api-testing.instructions.md\`

---

**When to Reference:**
- ✅ Before production deployment
- ✅ Adding new API endpoints
- ✅ Handling user input
- ✅ Security code reviews
- ✅ After security incidents

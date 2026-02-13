# OpenAPI/Swagger Documentation Instructions

**Project:** YouTube Media Player - API Documentation  
**Purpose:** Auto-generate interactive API documentation  
**Scope:** All REST API endpoints

---

## 🎯 What is OpenAPI/Swagger?

**OpenAPI** (formerly Swagger) is a standard for describing REST APIs. It provides:

✅ **Interactive docs** - Try API endpoints in browser  
✅ **Auto-generated clients** - Generate TypeScript/Python/etc clients  
✅ **API validation** - Ensure requests/responses match spec  
✅ **Team collaboration** - Single source of truth for API

---

## 📋 Setup with Express

### 1. Install Dependencies

```bash
cd backend
pnpm add swagger-jsdoc swagger-ui-express
pnpm add -D @types/swagger-jsdoc @types/swagger-ui-express
```

### 2. Swagger Configuration

```typescript
// backend/src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Media Player API',
      version: '1.0.0',
      description: 'Offline-first media player with YouTube download support',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {},
      responses: {},
      securitySchemes: {
        // For future authentication
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/types/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

### 3. Swagger UI Route

```typescript
// backend/src/server.ts
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
```

Access at: `http://localhost:3000/api-docs`

---

## 📝 Documenting Endpoints

### Example: Media Endpoints

```typescript
// backend/src/routes/media.routes.ts

/**
 * @openapi
 * /api/media:
 *   get:
 *     summary: Get all media
 *     description: Retrieve paginated list of media items with optional filters
 *     tags: [Media]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title/artist
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [audio, video]
 *         description: Filter by media type
 *       - in: query
 *         name: liked
 *         schema:
 *           type: boolean
 *         description: Filter liked media only
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/', async (req, res) => {
  // Implementation
});

/**
 * @openapi
 * /api/media/{id}:
 *   get:
 *     summary: Get media by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res) => {
  // Implementation
});
```

---

## 🔧 Schema Definitions

```typescript
// backend/src/types/schemas.ts

/**
 * @openapi
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         artist:
 *           type: string
 *         album:
 *           type: string
 *         duration:
 *           type: integer
 *           description: Duration in seconds
 *         type:
 *           type: string
 *           enum: [audio, video]
 *         thumbnailUrl:
 *           type: string
 *           format: uri
 *         playCount:
 *           type: integer
 *         liked:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         lastPlayedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - title
 *         - duration
 *         - type
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         hasNext:
 *           type: boolean
 *         hasPrev:
 *           type: boolean
 *     
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *             message:
 *               type: string
 *             details:
 *               type: object
 *             timestamp:
 *               type: string
 *               format: date-time
 *   
 *   responses:
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *           example:
 *             success: false
 *             error:
 *               code: NOT_FOUND
 *               message: Media with id '123' not found
 *               timestamp: 2024-02-13T21:00:00Z
 *     
 *     InternalError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 */
```

---

## 📚 Best Practices

1. **Document all endpoints** - Public and internal
2. **Use tags** - Group related endpoints
3. **Add examples** - Show realistic data
4. **Describe errors** - Document all error codes
5. **Keep it updated** - Update docs with code changes

---

**Related Documentation:**
- `api-standards.instructions.md` - API standards
- `backend.instructions.md` - Backend implementation

---

**End of OpenAPI/Swagger Instructions**

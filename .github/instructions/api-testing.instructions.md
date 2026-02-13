# API Testing with Bruno Instructions

**Project:** YouTube Media Player - API Testing Strategy  
**Tool:** Bruno - Open-source API testing (Git-friendly)  
**Purpose:** Define API testing patterns, Bruno collection structure, and testing workflows

---

## 🎯 Why Bruno?

Bruno is an open-source alternative to Postman with key advantages:

**Benefits:**
- ✅ **Git-friendly** - Collections stored as plain text in repo
- ✅ **Offline-first** - No cloud sync required (perfect for our offline app)
- ✅ **Open source** - Free, no account needed
- ✅ **Fast & lightweight** - Native desktop app
- ✅ **Version control** - Track API changes in Git
- ✅ **Team collaboration** - Share collections via repo
- ✅ **Environment support** - Dev, staging, prod configs
- ✅ **Scriptable** - JavaScript for pre/post-request scripts

**Website:** https://www.usebruno.com/

---

## 📁 Bruno Collection Structure

```
project-root/
├── bruno/
│   ├── environments/
│   │   ├── local.bru              # Local development
│   │   ├── docker.bru             # Docker containers
│   │   └── production.bru         # Production (if deployed)
│   ├── Media/
│   │   ├── List All Media.bru
│   │   ├── Get Media By ID.bru
│   │   ├── Search Media.bru
│   │   ├── Get Liked Media.bru
│   │   ├── Get Frequent Media.bru
│   │   ├── Update Media.bru
│   │   └── Delete Media.bru
│   ├── Playlists/
│   │   ├── List Playlists.bru
│   │   ├── Create Playlist.bru
│   │   ├── Get Playlist.bru
│   │   ├── Add Media to Playlist.bru
│   │   ├── Remove Media from Playlist.bru
│   │   └── Delete Playlist.bru
│   ├── Player/
│   │   ├── Record Play.bru
│   │   ├── Resume Playback.bru
│   │   ├── Update Position.bru
│   │   └── Get Play History.bru
│   ├── Downloads/
│   │   ├── Start Download.bru
│   │   ├── Get Download Status.bru
│   │   ├── Cancel Download.bru
│   │   └── List Downloads.bru
│   ├── Search/
│   │   ├── Global Search.bru
│   │   ├── Search Media.bru
│   │   └── Search Playlists.bru
│   └── bruno.json                  # Bruno configuration
└── .gitignore                      # Include bruno/ folder
```

---

## 🔧 Setup Instructions

### 1. Install Bruno

```bash
# macOS (Homebrew)
brew install bruno

# Or download from https://www.usebruno.com/downloads

# Windows (Chocolatey)
choco install bruno

# Linux (Snap)
snap install bruno
```

### 2. Initialize Bruno Collection

```bash
# Create bruno directory
mkdir -p bruno/environments

# Bruno will auto-detect when you open the directory
# File > Open Collection > Select bruno/
```

### 3. Create `bruno/bruno.json`

```json
{
  "version": "1",
  "name": "Media Player API",
  "type": "collection",
  "ignore": [
    "node_modules",
    ".git"
  ]
}
```

---

## 🌍 Environment Configuration

### Local Development (`bruno/environments/local.bru`)

```
vars {
  baseUrl: http://localhost:3000/api
  wsUrl: ws://localhost:3000
}

vars:secret {
  # Add any API keys or secrets here (not committed)
}
```

### Docker Environment (`bruno/environments/docker.bru`)

```
vars {
  baseUrl: http://localhost:3000/api
  wsUrl: ws://localhost:3000
}
```

### Production Environment (`bruno/environments/production.bru`)

```
vars {
  baseUrl: https://your-domain.com/api
  wsUrl: wss://your-domain.com
}
```

---

## 📝 Request Examples

### Media: List All Media (`bruno/Media/List All Media.bru`)

```
meta {
  name: List All Media
  type: http
  seq: 1
}

get {
  url: {{baseUrl}}/media
  body: none
  auth: none
}

params:query {
  limit: 50
  offset: 0
  ~liked: true
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  test("Response has data array", function() {
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.be.an('array');
  });
  
  test("Each item has required fields", function() {
    const item = res.body.data[0];
    expect(item).to.have.property('id');
    expect(item).to.have.property('title');
    expect(item).to.have.property('artist');
    expect(item).to.have.property('duration');
  });
}

docs {
  Get a paginated list of all media in the library.
  
  Query Parameters:
  - limit: Number of items per page (default: 50)
  - offset: Number of items to skip (default: 0)
  - liked: Filter by liked status (optional)
}
```

---

### Media: Get By ID (`bruno/Media/Get Media By ID.bru`)

```
meta {
  name: Get Media By ID
  type: http
  seq: 2
}

get {
  url: {{baseUrl}}/media/:id
  body: none
  auth: none
}

params:path {
  id: {{mediaId}}
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  test("Response has data", function() {
    expect(res.body).to.have.property('data');
    expect(res.body.data).to.be.an('object');
  });
  
  test("Media has all fields", function() {
    const media = res.body.data;
    expect(media).to.have.property('id');
    expect(media).to.have.property('title');
    expect(media).to.have.property('artist');
    expect(media).to.have.property('album');
    expect(media).to.have.property('duration');
    expect(media).to.have.property('filename');
    expect(media).to.have.property('playCount');
    expect(media).to.have.property('liked');
  });
}

script:pre-request {
  // Set a default mediaId if not set
  if (!bru.getEnvVar('mediaId')) {
    bru.setEnvVar('mediaId', 'test-media-id-123');
  }
}

docs {
  Get a single media item by ID.
  
  Path Parameters:
  - id: Media ID (UUID)
}
```

---

### Media: Search (`bruno/Media/Search Media.bru`)

```
meta {
  name: Search Media
  type: http
  seq: 3
}

get {
  url: {{baseUrl}}/media/search
  body: none
  auth: none
}

params:query {
  q: {{searchQuery}}
  ~artist: 
  ~album: 
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  test("Results match search query", function() {
    const query = bru.getEnvVar('searchQuery').toLowerCase();
    res.body.data.forEach(item => {
      const matchesTitle = item.title.toLowerCase().includes(query);
      const matchesArtist = item.artist.toLowerCase().includes(query);
      expect(matchesTitle || matchesArtist).to.be.true;
    });
  });
}

script:pre-request {
  // Set default search query
  if (!bru.getEnvVar('searchQuery')) {
    bru.setEnvVar('searchQuery', 'test');
  }
}

docs {
  Search media by title, artist, or album.
  
  Query Parameters:
  - q: Search query (required)
  - artist: Filter by artist name (optional)
  - album: Filter by album name (optional)
}
```

---

### Playlist: Create (`bruno/Playlists/Create Playlist.bru`)

```
meta {
  name: Create Playlist
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/playlists
  body: json
  auth: none
}

body:json {
  {
    "name": "My Awesome Playlist",
    "description": "Collection of favorite tracks"
  }
}

tests {
  test("Status is 201", function() {
    expect(res.status).to.equal(201);
  });
  
  test("Returns created playlist", function() {
    expect(res.body.data).to.have.property('id');
    expect(res.body.data).to.have.property('name');
    expect(res.body.data.name).to.equal('My Awesome Playlist');
  });
}

script:post-response {
  // Save playlist ID for subsequent requests
  if (res.status === 201) {
    bru.setEnvVar('playlistId', res.body.data.id);
  }
}

docs {
  Create a new playlist.
  
  Request Body:
  - name: Playlist name (required)
  - description: Playlist description (optional)
}
```

---

### Player: Record Play (`bruno/Player/Record Play.bru`)

```
meta {
  name: Record Play
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/player/play/:id
  body: none
  auth: none
}

params:path {
  id: {{mediaId}}
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  test("Returns success", function() {
    expect(res.body).to.have.property('success');
    expect(res.body.success).to.be.true;
  });
}

script:post-response {
  // Log play event
  console.log(`Recorded play for media: ${bru.getEnvVar('mediaId')}`);
}

docs {
  Record a play event for a media item.
  Updates play count and last played timestamp.
  
  Path Parameters:
  - id: Media ID
}
```

---

### Download: Start (`bruno/Downloads/Start Download.bru`)

```
meta {
  name: Start Download
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/downloads/start
  body: json
  auth: none
}

body:json {
  {
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "format": "mp3",
    "quality": "highest"
  }
}

tests {
  test("Status is 202 (Accepted)", function() {
    expect(res.status).to.equal(202);
  });
  
  test("Returns download ID", function() {
    expect(res.body.data).to.have.property('id');
    expect(res.body.data).to.have.property('status');
    expect(res.body.data.status).to.equal('pending');
  });
}

script:post-response {
  // Save download ID for status checks
  if (res.status === 202) {
    bru.setEnvVar('downloadId', res.body.data.id);
    console.log(`Download started: ${res.body.data.id}`);
  }
}

docs {
  Start downloading a YouTube video/audio.
  
  Request Body:
  - youtubeUrl: YouTube video URL (required)
  - format: Output format - 'mp3' or 'mp4' (default: 'mp3')
  - quality: Quality - 'highest', 'medium', 'lowest' (default: 'highest')
}
```

---

## 🧪 Testing Workflows

### 1. **Smoke Test** (Basic Health Check)

Run these in sequence to verify API is working:

1. List All Media
2. Get Media By ID (use first from list)
3. List Playlists
4. Get Play History

**Success Criteria:** All return 200 status

---

### 2. **Media Management Flow**

Test complete media CRUD operations:

1. List All Media (get baseline count)
2. Start Download (create new media)
3. Wait for download to complete (poll status)
4. List All Media (verify count increased)
5. Get Media By ID (verify new media exists)
6. Update Media (change title/artist)
7. Search Media (verify updates appear)
8. Delete Media
9. List All Media (verify count decreased)

---

### 3. **Playlist Management Flow**

Test playlist operations:

1. Create Playlist
2. List Playlists (verify new playlist)
3. Add Media to Playlist (multiple items)
4. Get Playlist (verify media list)
5. Reorder Playlist Items
6. Remove Media from Playlist
7. Delete Playlist

---

### 4. **Player Flow**

Test playback tracking:

1. Record Play (start playback)
2. Update Position (at 30 seconds)
3. Update Position (at 60 seconds)
4. Get Play History (verify entry exists)
5. Resume Playback (verify position restored)

---

### 5. **Search Flow**

Test search functionality:

1. Search by title keyword
2. Search by artist name
3. Search with filters (artist + album)
4. Global search (all resources)

---

## 📋 Pre-request Scripts

### Set Dynamic Variables

```javascript
// bruno/Media/Get Media By ID.bru

script:pre-request {
  // Get first media ID from previous list request
  const listResponse = bru.getVar('listMediaResponse');
  if (listResponse && listResponse.data.length > 0) {
    bru.setEnvVar('mediaId', listResponse.data[0].id);
  }
}
```

### Generate Test Data

```javascript
// bruno/Playlists/Create Playlist.bru

script:pre-request {
  // Generate unique playlist name
  const timestamp = new Date().getTime();
  const playlistName = `Test Playlist ${timestamp}`;
  
  bru.setVar('playlistName', playlistName);
  
  // Update request body
  req.setBody({
    name: playlistName,
    description: 'Auto-generated test playlist'
  });
}
```

---

## 🧪 Post-response Scripts

### Save Response Data

```javascript
script:post-response {
  // Save entire response for next request
  bru.setVar('listMediaResponse', res.body);
  
  // Extract and save specific fields
  if (res.body.data && res.body.data.length > 0) {
    bru.setEnvVar('firstMediaId', res.body.data[0].id);
    bru.setEnvVar('firstMediaTitle', res.body.data[0].title);
  }
}
```

### Chain Requests

```javascript
script:post-response {
  // After creating playlist, automatically add media
  if (res.status === 201) {
    const playlistId = res.body.data.id;
    bru.setEnvVar('playlistId', playlistId);
    
    // Trigger next request in chain
    console.log(`Playlist created: ${playlistId}`);
    console.log('Now run: Add Media to Playlist');
  }
}
```

---

## ✅ Test Assertions

### Common Test Patterns

```javascript
tests {
  // Status codes
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  // Response structure
  test("Has data property", function() {
    expect(res.body).to.have.property('data');
  });
  
  // Array responses
  test("Returns array", function() {
    expect(res.body.data).to.be.an('array');
  });
  
  test("Array not empty", function() {
    expect(res.body.data.length).to.be.greaterThan(0);
  });
  
  // Object properties
  test("Has required fields", function() {
    const item = res.body.data;
    expect(item).to.have.property('id');
    expect(item).to.have.property('title');
  });
  
  // Value validation
  test("ID is valid UUID", function() {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(res.body.data.id).to.match(uuidRegex);
  });
  
  // Response time
  test("Response time under 500ms", function() {
    expect(res.responseTime).to.be.below(500);
  });
  
  // Content type
  test("Content-Type is JSON", function() {
    expect(res.headers['content-type']).to.include('application/json');
  });
}
```

---

## 🔄 Integration with Development

### 1. **During Development**

When implementing a new API endpoint:

1. Write the endpoint implementation
2. Create Bruno request in appropriate folder
3. Add tests for success cases
4. Add tests for error cases (404, 400, etc.)
5. Document in `docs` section
6. Run and verify
7. Commit Bruno file with code

### 2. **Before Committing**

```bash
# Run all requests in a collection folder
bruno run bruno/Media --env local

# Run specific folder
bruno run bruno/Playlists --env local

# Run single request
bruno run bruno/Media/List\ All\ Media.bru --env local
```

### 3. **CI/CD Integration**

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for API
        run: |
          timeout 60 sh -c 'until curl -f http://localhost:3000/api/health; do sleep 2; done'
      
      - name: Install Bruno CLI
        run: npm install -g @usebruno/cli
      
      - name: Run API tests
        run: |
          bruno run bruno/Media --env docker
          bruno run bruno/Playlists --env docker
          bruno run bruno/Player --env docker
      
      - name: Stop services
        run: docker-compose down
```

---

## 📚 Best Practices

### 1. **Organization**

- ✅ Group requests by resource (Media, Playlists, etc.)
- ✅ Use clear, descriptive names
- ✅ Number requests in logical order (seq)
- ✅ Keep folder structure flat (max 2 levels)

### 2. **Environment Variables**

```
✅ Use {{baseUrl}} for all URLs
✅ Use {{mediaId}} for dynamic IDs
✅ Store secrets in vars:secret (not committed)
✅ Document all variables in environment files
```

### 3. **Tests**

- ✅ Test status codes
- ✅ Test response structure
- ✅ Test required fields exist
- ✅ Test data types and formats
- ✅ Test response times
- ✅ Add descriptive test names

### 4. **Documentation**

```
✅ Add docs section to every request
✅ Document all parameters
✅ Include example values
✅ Explain expected behavior
```

### 5. **Version Control**

```bash
# Commit Bruno files with code
git add bruno/Media/
git commit -m "Add Media API endpoints and tests"

# .gitignore
bruno/environments/*.bru.secret  # Secret variables
```

---

## 🚀 Quick Start Checklist

Phase 1 (Setup):
- [ ] Install Bruno
- [ ] Create `bruno/` directory
- [ ] Add `bruno.json` config
- [ ] Create environment files
- [ ] Add to `.gitignore` if needed

Phase 2 (Basic Requests):
- [ ] Create Media folder
- [ ] Add List All Media request
- [ ] Add Get By ID request
- [ ] Test both requests work
- [ ] Add tests to requests

Phase 3 (Complete Collection):
- [ ] Add all Media endpoints
- [ ] Add Playlist endpoints
- [ ] Add Player endpoints
- [ ] Add Download endpoints
- [ ] Document all requests

Phase 4 (Advanced):
- [ ] Add pre-request scripts
- [ ] Add post-response scripts
- [ ] Chain related requests
- [ ] Add comprehensive tests
- [ ] Setup CI/CD integration

---

## 📖 Resources

- **Bruno Docs:** https://docs.usebruno.com/
- **Bruno GitHub:** https://github.com/usebruno/bruno
- **Bruno CLI:** https://www.npmjs.com/package/@usebruno/cli
- **Example Collections:** https://github.com/usebruno/bruno-examples

---

## 🔗 Related Instructions

- **API Routes:** `.github/instructions/api-routes.instructions.md`
- **Backend:** `.github/instructions/backend.instructions.md`
- **Architecture:** `.github/instructions/architecture.instructions.md`

---

**When to Reference:**
- ✅ Implementing new API endpoints
- ✅ Testing API functionality
- ✅ Debugging API issues
- ✅ Documenting API behavior
- ✅ Setting up CI/CD for API tests

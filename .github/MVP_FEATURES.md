# MVP Feature Specification

## 🎯 Product Vision

**Mission:** Enable users to download music from YouTube and play it offline, anytime, anywhere.

**Core Value Proposition:**
- **Offline-first**: Works without internet after download
- **Simple**: Download → Play (no complex setup)
- **Efficient**: Bulk download playlists (not just single songs)

**Target Users:**
- **Jamie** (Casual): Wants simplicity - download a few songs, play offline
- **Alex** (Enthusiast): Builds library, creates playlists, daily listener
- **Morgan** (Power User): Downloads in bulk, exports to devices

---

## 📋 MVP Scope Strategy

### Phase Approach
We're using a **3-phase rollout** to balance speed-to-market with user delight:

- **Phase 1 (CORE)**: Minimum features to solve the core problem → Launch quickly
- **Phase 2 (DELIGHT)**: High-value features that create "wow" moments → Add based on feedback
- **Phase 3 (POLISH)**: Advanced features for power users → Build for retention

---

## ✅ PHASE 1 - CORE MVP (Launch Features)

**Goal:** Get a working product in users' hands ASAP  
**Timeline:** 3-4 weeks (1 developer)  
**Success Metric:** Users can download and play songs offline

### Feature 1.1: Single Download
**User Story:** As Jamie, I want to download a song from YouTube so I can listen offline.

**Acceptance Criteria:**
- [ ] User can paste YouTube URL (song or video)
- [ ] System validates URL format
- [ ] Shows download progress (0-100%)
- [ ] Displays estimated time remaining
- [ ] Shows error if URL is invalid/blocked
- [ ] Auto-converts video to MP3 (audio-only)
- [ ] Saves to local storage with metadata (title, artist, thumbnail)
- [ ] Notifies user when download complete

**Technical Notes:**
- Use ytdl-core (Node.js) or yt-dlp (Python)
- FFmpeg for MP3 conversion
- Socket.io for real-time progress updates
- Store in PostgreSQL: title, artist, filePath, duration, thumbnailUrl

**Out of Scope:**
- Quality selection (hardcode to 192kbps)
- Resume failed downloads
- Download history

---

### Feature 1.2: Media Player
**User Story:** As Jamie, I want to play my downloaded songs so I can listen to music.

**Acceptance Criteria:**
- [ ] Playback controls: Play, Pause, Skip Forward, Skip Backward
- [ ] Volume control (0-100%, mute button)
- [ ] Seek bar (scrubbing through song)
- [ ] Shows current time and total duration
- [ ] Displays now playing: title, artist, thumbnail
- [ ] Auto-plays next song in queue/playlist
- [ ] Works 100% offline (no internet required)
- [ ] Keyboard shortcuts: Space (play/pause), Arrow keys (seek ±10s), Up/Down (volume)

**Technical Notes:**
- HTML5 Audio API
- Preload next track for gapless playback
- Store playback state in Zustand (frontend)
- Update playCount and lastPlayedAt in database

**Out of Scope:**
- Shuffle/Repeat (Phase 2)
- Equalizer/Audio effects
- Crossfade between tracks

---

### Feature 1.3: Persistent Player Bar
**User Story:** As Alex, I want music to keep playing while I browse my library.

**Acceptance Criteria:**
- [ ] Player bar always visible at bottom of screen
- [ ] Continues playing when navigating between pages
- [ ] Shows mini version of now playing (title, artist, small thumbnail)
- [ ] Quick controls: Play/Pause, Skip
- [ ] Click to expand to full player view
- [ ] Persists across browser refresh (save state to localStorage)

**Technical Notes:**
- Fixed position component in React
- Zustand for global player state
- LocalStorage for persistence
- Portal pattern for overlay modals

**Out of Scope:**
- Lock screen controls (mobile PWA - Phase 3)
- Picture-in-picture

---

### Feature 1.4: Library View
**User Story:** As Alex, I want to see all my downloaded songs so I can choose what to play.

**Acceptance Criteria:**
- [ ] Grid view of all downloaded media (thumbnails)
- [ ] List view option (compact rows)
- [ ] Shows: title, artist, duration, thumbnail
- [ ] Click song to play immediately
- [ ] Shows download date
- [ ] Empty state: "No songs yet. Download your first song!"
- [ ] Pagination or infinite scroll (50 items per page)

**Technical Notes:**
- Virtual scrolling for large libraries (react-window)
- Lazy load thumbnails
- Cache images in browser
- GET /api/media endpoint with pagination

**Out of Scope:**
- Album view (group by album)
- Artist view (group by artist)
- Advanced sorting (Phase 2)

---

### Feature 1.5: Search Library
**User Story:** As Alex, I want to search my library so I can quickly find a specific song.

**Acceptance Criteria:**
- [ ] Search bar at top of library view
- [ ] Searches by: title, artist
- [ ] Real-time results (as user types)
- [ ] Shows "No results found" if empty
- [ ] Clear search button (X)
- [ ] Debounced API calls (wait 300ms after typing stops)

**Technical Notes:**
- PostgreSQL full-text search (ts_vector)
- Index on title and artist columns
- Frontend debounce with lodash or custom hook
- GET /api/media?search=query

**Out of Scope:**
- Fuzzy matching
- Search by album, genre, year
- Search history

---

### Feature 1.6: Basic Playlists
**User Story:** As Alex, I want to create playlists so I can organize songs by mood/activity.

**Acceptance Criteria:**
- [ ] Create new playlist (name + optional description)
- [ ] Add songs to playlist (from library)
- [ ] Remove songs from playlist
- [ ] Delete playlist
- [ ] View all playlists (grid with thumbnail mosaic)
- [ ] Play entire playlist (start with first song)
- [ ] Shows song count and total duration

**Technical Notes:**
- Playlist model: id, name, description, createdAt
- PlaylistMedia join table: playlistId, mediaId, position
- Drag-and-drop reordering (Phase 2)
- POST /api/playlists, GET /api/playlists/:id/media

**Out of Scope:**
- Smart playlists (auto-populate based on rules)
- Collaborative playlists
- Playlist import/export

---

### Feature 1.7: Offline Indicator
**User Story:** As Jamie, I want to know the app works offline so I trust it during my commute.

**Acceptance Criteria:**
- [ ] Icon in header shows connection status
- [ ] Green icon + "Offline Mode" when no internet
- [ ] Gray icon + "Online" when connected
- [ ] Tooltip explains: "Your music plays offline"
- [ ] Player still works when offline
- [ ] Downloads disabled when offline (show message)

**Technical Notes:**
- Use navigator.onLine API
- Listen to online/offline events
- Zustand store for connection state
- Service worker for true offline support (Phase 3)

**Out of Scope:**
- Queue downloads to sync when back online
- Offline analytics

---

### Feature 1.8: Recently Played
**User Story:** As Alex, I want to quickly access songs I played recently.

**Acceptance Criteria:**
- [ ] "Recently Played" section on home screen
- [ ] Shows last 10 played songs
- [ ] Sorted by lastPlayedAt (most recent first)
- [ ] Click to play again
- [ ] Updates in real-time as user plays songs

**Technical Notes:**
- Query: SELECT * FROM media WHERE lastPlayedAt IS NOT NULL ORDER BY lastPlayedAt DESC LIMIT 10
- Index on lastPlayedAt column
- Update lastPlayedAt on every play

**Out of Scope:**
- Listening history (full chronological list)
- Stats (most played, total listen time)

---

### Feature 1.9: Like/Favorite Songs
**User Story:** As Alex, I want to mark my favorite songs so I can find them easily.

**Acceptance Criteria:**
- [ ] Heart icon on each song (filled = liked, outline = not liked)
- [ ] Click to toggle like status
- [ ] "Liked Songs" section/filter in library
- [ ] Shows like count in library

**Technical Notes:**
- Boolean field: liked (default: false)
- PATCH /api/media/:id with { liked: true/false }
- Index on liked column for fast filtering

**Out of Scope:**
- Multiple rating levels (1-5 stars)
- Dislike/hide songs

---

### Feature 1.10: Volume & Seek Controls
**User Story:** As Jamie, I want to control volume and jump to different parts of the song.

**Acceptance Criteria:**
- [ ] Volume slider (0-100%)
- [ ] Mute button
- [ ] Seek bar (scrubbing)
- [ ] Shows current time (e.g., 1:23) and total duration (e.g., 3:45)
- [ ] Keyboard shortcuts: ←/→ (seek ±10s), ↑/↓ (volume)

**Technical Notes:**
- HTML5 Audio API: audio.volume, audio.currentTime, audio.duration
- Store volume preference in localStorage
- Throttle seek bar updates (60fps)

**Out of Scope:**
- Speed control (1.5x, 2x playback)
- Jump to specific timestamp

---

## 📊 Phase 1 Summary

**Total Features:** 10  
**Estimated Effort:** 3-4 weeks (1 developer)  
**Deliverable:** Functional offline music player with YouTube download

**What Users Can Do:**
✅ Download songs from YouTube  
✅ Play music offline  
✅ Browse and search library  
✅ Create playlists  
✅ Mark favorites  
✅ See recently played  

**What's Missing:**
❌ Bulk downloads (Phase 2)  
❌ Queue management (Phase 2)  
❌ Export to devices (Phase 3)  

---

## ⭐ PHASE 2 - DELIGHT (Post-Launch)

**Goal:** Add "wow" features that differentiate from competitors  
**Timeline:** 1-2 weeks  
**Success Metric:** Increased engagement, user retention

### Feature 2.1: Bulk Download (Playlists)
**User Story:** As Morgan, I want to download entire YouTube playlists so I don't have to download 30 songs one by one.

**Acceptance Criteria:**
- [ ] Paste YouTube playlist URL
- [ ] Auto-detect playlist (shows "X songs found")
- [ ] Preview song list (with checkboxes to deselect)
- [ ] Estimated download time and storage size
- [ ] Option to auto-create playlist after download
- [ ] Download all songs concurrently (max 3 at a time)
- [ ] Overall progress bar (e.g., "15/30 songs")
- [ ] Individual song status (downloading, done, failed)
- [ ] Pause/Resume bulk download
- [ ] Retry failed downloads
- [ ] Summary screen: "27 of 30 songs downloaded successfully"

**Technical Notes:**
- Parse playlist with ytdl-core.getPlaylist() or yt-dlp
- Queue system with max concurrency (BullMQ or simple in-memory queue)
- Socket.io for real-time progress of each song
- Create playlist automatically in database

**Priority:** HIGH - Major differentiator, huge user value

---

### Feature 2.2: Queue Management ("Up Next")
**User Story:** As Alex, I want to queue up songs while listening so I control what plays next.

**Acceptance Criteria:**
- [ ] "Add to Queue" button on each song
- [ ] "Up Next" panel shows queued songs
- [ ] Drag to reorder queue
- [ ] Remove from queue
- [ ] Clear entire queue
- [ ] Shows current song + upcoming songs
- [ ] Queue persists across page navigation
- [ ] Auto-plays next song from queue

**Technical Notes:**
- Queue array in Zustand store
- LocalStorage persistence
- Drag-and-drop with @dnd-kit/core

**Priority:** HIGH - Expected feature in modern players

---

### Feature 2.3: Shuffle & Repeat
**User Story:** As Alex, I want to shuffle my playlist and repeat songs I love.

**Acceptance Criteria:**
- [ ] Shuffle button (randomizes playlist/queue order)
- [ ] Repeat modes: Off, Repeat All, Repeat One
- [ ] Icons change based on active mode
- [ ] Shuffle algorithm ensures no back-to-back repeats
- [ ] State persists across refresh

**Technical Notes:**
- Fisher-Yates shuffle algorithm
- Store mode in Zustand + localStorage
- When repeat one: replay current song on end

**Priority:** MEDIUM - Easy to add, users expect it

---

### Feature 2.4: Download Progress Notifications
**User Story:** As Jamie, I want to be notified when my download finishes so I know it's ready.

**Acceptance Criteria:**
- [ ] Desktop notification: "Song Title downloaded successfully"
- [ ] Notification has thumbnail and action: "Play Now"
- [ ] Click notification to navigate to song
- [ ] Works even if app is in background tab
- [ ] User can disable notifications in settings

**Technical Notes:**
- Notification API (browser permission required)
- Service worker for background notifications (PWA)
- Fallback to toast/banner if notifications blocked

**Priority:** LOW - Nice polish, not critical

---

### Feature 2.5: Keyboard Shortcuts
**User Story:** As Alex (power user), I want keyboard shortcuts so I can control playback quickly.

**Acceptance Criteria:**
- [ ] Space: Play/Pause
- [ ] ←/→: Seek ±10 seconds
- [ ] ↑/↓: Volume up/down
- [ ] Shift+←/→: Previous/Next track
- [ ] M: Mute/Unmute
- [ ] L: Like current song
- [ ] ? or /: Show keyboard shortcuts help modal

**Technical Notes:**
- Global keydown listener in React
- Prevent conflicts with input fields (check event.target)
- Display shortcuts in Help modal

**Priority:** LOW - Power users love it, easy to add

---

## 📊 Phase 2 Summary

**Total Features:** 5  
**Estimated Effort:** 1-2 weeks  
**Deliverable:** Bulk downloads + Queue + Polish

**Key Additions:**
✅ Bulk download playlists (🔥 Major feature!)  
✅ Queue management  
✅ Shuffle & Repeat  
✅ Notifications  
✅ Keyboard shortcuts  

---

## 🔄 PHASE 3 - POLISH (Post-MVP)

**Goal:** Advanced features for power users and edge cases  
**Timeline:** 2-3 weeks  
**Success Metric:** Retention of Morgan persona (power users)

### Feature 3.1: Export to USB/Devices
**User Story:** As Morgan, I want to export playlists to my USB drive so I can play them in my car.

**Acceptance Criteria:**
- [ ] Detect connected USB/SD devices
- [ ] Select playlists or individual songs to export
- [ ] Choose organization: By Playlist, By Artist/Album, Flat
- [ ] Options: Include artwork, .m3u playlist files, ID3 tags
- [ ] Preview export structure before starting
- [ ] Export progress bar
- [ ] Verify all files copied successfully
- [ ] "Safe to remove" notification

**Technical Notes:**
- drivelist NPM package for USB detection
- OS-specific paths (Windows: E:, macOS: /Volumes, Linux: /media)
- Node.js fs.copyFile() for file transfer
- Generate .m3u playlist files

**Priority:** MEDIUM - Complex, serves niche use case

---

### Feature 3.2: Audio Quality Selector
**User Story:** As Alex, I want to choose download quality so I balance file size and audio fidelity.

**Acceptance Criteria:**
- [ ] Quality options: 128kbps (small), 192kbps (balanced), 320kbps (high)
- [ ] Shows estimated file size for each option
- [ ] Default: 192kbps
- [ ] Preference saved for future downloads

**Technical Notes:**
- ytdl-core format selection based on bitrate
- FFmpeg encoding with -b:a flag
- Store preference in user settings (localStorage or DB)

**Priority:** LOW - Most users don't care about quality

---

### Feature 3.3: Dark/Light Theme Toggle
**User Story:** As Jamie, I want to switch to light mode so it's easier to see in bright sunlight.

**Acceptance Criteria:**
- [ ] Toggle button in settings/header
- [ ] Smooth transition between themes
- [ ] Preference persists across sessions
- [ ] System default option (auto-detect OS preference)

**Technical Notes:**
- CSS variables for theme colors
- LocalStorage for preference
- prefers-color-scheme media query for system default

**Priority:** LOW - Dark theme is default, light is optional

---

### Feature 3.4: Advanced Sorting
**User Story:** As Alex, I want to sort my library by play count or date added.

**Acceptance Criteria:**
- [ ] Sort options: Title (A-Z), Artist, Date Added, Play Count, Last Played
- [ ] Ascending/Descending toggle
- [ ] Preference persists

**Technical Notes:**
- GET /api/media?sort=playCount&order=desc
- Frontend dropdown for sort selection

**Priority:** LOW - Search covers most use cases

---

### Feature 3.5: Bulk Delete
**User Story:** As Morgan, I want to delete multiple songs at once to free up storage.

**Acceptance Criteria:**
- [ ] Multi-select mode (checkboxes appear)
- [ ] "Select All" option
- [ ] Bulk delete button
- [ ] Confirmation dialog: "Delete X songs?"
- [ ] Progress indicator for large deletions

**Technical Notes:**
- DELETE /api/media with body: { ids: [...] }
- Batch delete in database
- Delete physical files from storage

**Priority:** LOW - Users rarely delete

---

## 📊 Phase 3 Summary

**Total Features:** 5  
**Estimated Effort:** 2-3 weeks  
**Deliverable:** Power user features + Polish

**Key Additions:**
✅ Export to USB/devices  
✅ Quality selector  
✅ Themes  
✅ Advanced sorting  
✅ Bulk operations  

---

## 🚫 OUT OF SCOPE (Not in MVP)

### Features We're NOT Building:

1. **Multi-user / User Accounts**
   - Why: Adds auth complexity, local app doesn't need it
   - Maybe Later: Post-MVP if needed for cloud sync

2. **Cloud Sync / Backup**
   - Why: Defeats offline-first purpose, adds infrastructure cost
   - Maybe Later: Optional feature for premium users

3. **Music Recommendations / Discovery**
   - Why: Complex ML, not core value prop
   - Maybe Later: Simple "Similar songs" based on genre/artist

4. **Social Features (Sharing, Following)**
   - Why: Out of scope for personal offline player
   - Maybe Later: Share playlists via export

5. **Lyrics Display**
   - Why: Nice-to-have, not differentiator
   - Maybe Later: Genius API integration

6. **Equalizer / Audio Effects**
   - Why: Complex, serves niche audiophile users
   - Maybe Later: Simple presets (bass boost, etc.)

7. **Podcast Support**
   - Why: Different UX (chapters, resume position, speed control)
   - Maybe Later: Separate product or major feature

8. **Video Playback**
   - Why: Offline video is large files, complex UX
   - Maybe Later: If users demand it

9. **Mobile App (iOS/Android)**
   - Why: PWA covers most mobile use cases
   - Maybe Later: React Native if web isn't enough

10. **Music Library Import (iTunes, Spotify)**
    - Why: Complex integrations, legal gray area
    - Maybe Later: CSV/M3U import

---

## 📈 Success Metrics

### Phase 1 (Launch)
- **Activation:** % of users who download ≥1 song
- **Engagement:** Average songs downloaded per user
- **Retention:** % of users who return after 7 days
- **Core Loop:** Time from "discover song" → "listening offline"

### Phase 2 (Growth)
- **Feature Adoption:** % using bulk download
- **Playlist Creation:** Average playlists per active user
- **Queue Usage:** % of sessions with queue
- **Retention:** 30-day retention rate

### Phase 3 (Retention)
- **Export Usage:** % of Morgan persona using USB export
- **Library Size:** Average songs per power user
- **Advanced Features:** % using shortcuts, quality selection

---

## 🛠️ Technical Stack Alignment

All features align with chosen tech stack:
- **Frontend:** React 19, Zustand (global state), Vite
- **Backend:** Node.js, Express, Socket.io (progress), Prisma
- **Database:** PostgreSQL (media, playlists)
- **Download:** ytdl-core + FFmpeg
- **Deployment:** Docker multi-container

---

## 📋 Development Order

**Recommended implementation sequence:**

### Week 1-2: Foundation
1. Database schema (Prisma)
2. Basic Express API (CRUD media)
3. React app scaffold + routing
4. Docker setup (containers)

### Week 2-3: Core Features
5. Single download (backend + frontend)
6. Media player (HTML5 Audio)
7. Persistent player bar
8. Library view + search

### Week 3-4: Playlists & Polish
9. Playlist CRUD
10. Recently played
11. Like/favorite
12. Offline indicator

### Week 5-6: Phase 2 (Post-Launch)
13. Bulk download (playlists)
14. Queue management
15. Shuffle/Repeat
16. Notifications + Shortcuts

### Week 7-8: Phase 3 (As Needed)
17. Export to devices
18. Quality selector
19. Themes + Advanced sorting
20. Bulk operations

---

## ✅ Done Criteria

**Phase 1 is done when:**
- [ ] User can download a YouTube song
- [ ] Song plays offline (no internet)
- [ ] User can search and find song in library
- [ ] User can create playlist with 5 songs
- [ ] Player bar persists across navigation
- [ ] Recently played shows last 10 songs
- [ ] User can like a song
- [ ] All 10 features deployed to production
- [ ] No critical bugs
- [ ] Tested on Windows, macOS, Linux

**Ready to ship!** 🚀

---

## 🎯 Key Principles

1. **Offline-first always** - Every feature must work without internet
2. **Keep it simple** - Don't over-engineer (YAGNI)
3. **User value over complexity** - Prioritize impact/effort ratio
4. **Ship fast, iterate** - Phase 1 in 3-4 weeks max
5. **Test with real users** - Get feedback before Phase 2
6. **Focus on core loop** - Download → Play → Organize → Repeat

---

**Last Updated:** 2026-02-13  
**Version:** 1.0 (MVP Specification)  
**Status:** Ready for Implementation

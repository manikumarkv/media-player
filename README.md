# 🎵 Media Player - Offline-First YouTube Media Manager

<p align="center">
  <img src="assets/logo.png" alt="Media Player Logo" width="200" />
</p>

<p align="center">
  <strong>An offline-first media player with YouTube download support</strong>
  <br />
  Built with React, Express, PostgreSQL, and Docker
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-legal-disclaimer">Legal Disclaimer</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/For-Educational%20Purposes-orange.svg" alt="Educational" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/AI-Enabled%20Development-purple.svg" alt="AI Enabled" />
</p>

---

## ⚠️ IMPORTANT LEGAL NOTICE

**🔴 READ THIS BEFORE USING THIS SOFTWARE 🔴**

This software is provided for **EDUCATIONAL AND RESEARCH PURPOSES ONLY**.

- ❌ Downloading content from YouTube may violate [YouTube's Terms of Service](https://www.youtube.com/t/terms)
- ⚖️ You are solely responsible for compliance with all applicable laws
- 📜 You must have legal rights to download any content
- 🚫 This tool is NOT for piracy or copyright infringement

**By using this software, you acknowledge that:**
1. You have read and agree to the [DISCLAIMER.md](./DISCLAIMER.md)
2. You will use this tool responsibly and legally
3. You accept all risks and liability for your actions
4. The developers are not responsible for your use of this tool

**For complete legal information, see [DISCLAIMER.md](./DISCLAIMER.md)**

---

## ✨ Features

### 🎵 Media Library Management
- **Offline-First Architecture** - Works without internet after initial download
- **Smart Organization** - Auto-categorize by artist, album, genre
- **Playlist Management** - Create, edit, and organize custom playlists
- **Search & Filter** - Powerful search across your entire library

### 📥 Download Support
- **YouTube Integration** - Download audio/video (with proper authorization)
- **Quality Selection** - Choose video quality or audio-only mode
- **Batch Downloads** - Queue multiple downloads
- **Progress Tracking** - Real-time download progress with WebSockets

### 🎧 Media Player
- **Audio & Video Playback** - Native HTML5 player
- **Queue Management** - Next up, shuffle, repeat modes
- **Keyboard Controls** - Full keyboard navigation
- **Cross-Platform** - Windows, macOS, Linux support

### 📊 Smart Features
- **Recently Played** - Track your listening history
- **Favorites** - Mark and quickly access your favorite media
- **Frequently Played** - Auto-generated based on play count
- **Export to Device** - Sync to mobile devices or portable players

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Installation (Docker - Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/media-player.git
cd media-player

# Start with Docker Compose
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# API Docs: http://localhost:3000/api-docs
```

### Installation (Local Development)

```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

## 📚 Documentation

### For Users
- **[User Guide](./docs/user-guide.md)** - How to use the application
- **[Installation Guide](./docs/installation.md)** - Detailed setup instructions
- **[FAQ](./docs/faq.md)** - Frequently asked questions

### For Developers
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- **[Architecture](./docs/architecture.md)** - System design and patterns
- **[API Documentation](http://localhost:3000/api-docs)** - Interactive API docs (Swagger)
- **[Development Setup](./docs/development.md)** - Local development guide

### AI-Assisted Development
This project uses comprehensive instruction files for AI-assisted development:
- 📂 **[.github/instructions/](./.github/instructions/)** - 28 instruction files
- 🤖 **[.github/README.md](./.github/README.md)** - Complete documentation index
- 🎯 **[Agentic Coordination](./.github/instructions/agentic-coordination.instructions.md)** - Multi-agent workflows

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **React Query** - Server state management
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **pnpm** - Package manager
- **GitHub Actions** - CI/CD

---

## 🎨 User Personas

This application is designed for three primary personas:

### 🎵 Alex - The Music Enthusiast
- **Goal:** Organize and play downloaded music library
- **Use Case:** Building a personal music collection offline

### 🎥 Jordan - The Video Curator
- **Goal:** Archive educational videos for offline viewing
- **Use Case:** Research and educational content preservation

### 📱 Morgan - The Mobile User
- **Goal:** Sync media to portable devices
- **Use Case:** Transfer library to phone/music player for on-the-go

See [UX Design Documentation](./.github/instructions/ux-design.instructions.md) for complete user journeys.

---

## 🤝 Contributing

We welcome contributions! This project follows modern development practices:

- ✅ **AI-Assisted Development** - We use GitHub Copilot, Claude, Cursor
- ✅ **Automated Testing** - All code must have tests
- ✅ **Code Quality** - ESLint, Prettier, TypeScript strict mode
- ✅ **Conventional Commits** - Standardized commit messages

**Before contributing:**
1. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
2. Review [Code of Conduct](./CODE_OF_CONDUCT.md)
3. Check [Open Issues](https://github.com/your-username/media-player/issues)

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

- ✅ Open source and free to use
- ✅ Modifications must remain open source
- ⚠️ For educational purposes only
- ⚠️ See [LICENSE](./LICENSE) and [DISCLAIMER.md](./DISCLAIMER.md)

---

## ⚖️ Legal Disclaimer

**This software does NOT:**
- ❌ Endorse or encourage copyright infringement
- ❌ Circumvent DRM or technological protection measures
- ❌ Violate DMCA anti-circumvention provisions
- ❌ Take responsibility for user actions

**Users are solely responsible for:**
- ✅ Ensuring legal right to download content
- ✅ Complying with YouTube Terms of Service
- ✅ Following copyright laws in their jurisdiction
- ✅ Respecting content creators' rights

**For complete legal information, read [DISCLAIMER.md](./DISCLAIMER.md)**

---

## 📞 Support

- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/your-username/media-player/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/your-username/media-player/discussions)
- 📧 **Email:** support@your-domain.com (if applicable)

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Express.js](https://expressjs.com/) - Backend framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [ytdl-core](https://github.com/fent/node-ytdl-core) - YouTube download library

Developed with AI assistance from:
- [GitHub Copilot](https://github.com/features/copilot)
- [Claude Code](https://claude.ai/)
- [Cursor](https://cursor.sh/)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/media-player&type=Date)](https://star-history.com/#your-username/media-player&Date)

---

<p align="center">
  <strong>⚖️ Use Responsibly • Respect Copyright • Follow the Law ⚖️</strong>
  <br />
  <sub>Made with ❤️ and AI assistance</sub>
</p>

<p align="center">
  <a href="#-media-player---offline-first-youtube-media-manager">Back to Top</a>
</p>

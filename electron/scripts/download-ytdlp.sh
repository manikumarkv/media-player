#!/bin/bash

# Download yt-dlp binaries for all platforms
# Run this script before building the Electron app

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESOURCES_DIR="$SCRIPT_DIR/../resources/binaries"

# Latest yt-dlp release URL
YT_DLP_VERSION="2024.01.01"
BASE_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download"

echo "Downloading yt-dlp binaries..."

# macOS ARM64 (Apple Silicon)
echo "Downloading macOS ARM64..."
mkdir -p "$RESOURCES_DIR/darwin-arm64"
curl -L "$BASE_URL/yt-dlp_macos" -o "$RESOURCES_DIR/darwin-arm64/yt-dlp"
chmod +x "$RESOURCES_DIR/darwin-arm64/yt-dlp"

# macOS x64 (Intel)
echo "Downloading macOS x64..."
mkdir -p "$RESOURCES_DIR/darwin-x64"
curl -L "$BASE_URL/yt-dlp_macos" -o "$RESOURCES_DIR/darwin-x64/yt-dlp"
chmod +x "$RESOURCES_DIR/darwin-x64/yt-dlp"

# Windows x64
echo "Downloading Windows x64..."
mkdir -p "$RESOURCES_DIR/win32-x64"
curl -L "$BASE_URL/yt-dlp.exe" -o "$RESOURCES_DIR/win32-x64/yt-dlp.exe"

# Linux x64
echo "Downloading Linux x64..."
mkdir -p "$RESOURCES_DIR/linux-x64"
curl -L "$BASE_URL/yt-dlp_linux" -o "$RESOURCES_DIR/linux-x64/yt-dlp"
chmod +x "$RESOURCES_DIR/linux-x64/yt-dlp"

echo "All yt-dlp binaries downloaded successfully!"
echo ""
echo "Binary locations:"
ls -la "$RESOURCES_DIR"/*/yt-dlp*

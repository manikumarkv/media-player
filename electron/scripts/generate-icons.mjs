#!/usr/bin/env node
/**
 * Generate app icons for Music Player
 * Creates a modern music player icon with a gradient background and play symbol
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '../resources/icons');
const SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

/**
 * Generate SVG for the app icon
 */
function generateIconSvg(size) {
  const cornerRadius = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  // Play triangle points (slightly offset to center visually)
  const triangleSize = size * 0.28;
  const offsetX = size * 0.03;
  const x1 = cx - triangleSize * 0.4 + offsetX;
  const y1 = cy - triangleSize;
  const x2 = cx - triangleSize * 0.4 + offsetX;
  const y2 = cy + triangleSize;
  const x3 = cx + triangleSize * 0.8 + offsetX;
  const y3 = cy;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea"/>
      <stop offset="50%" style="stop-color:#764ba2"/>
      <stop offset="100%" style="stop-color:#f953c6"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${size * 0.01}" stdDeviation="${size * 0.02}" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Rounded square background -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}" fill="url(#bgGradient)"/>

  <!-- Vinyl record circle (subtle) -->
  <circle cx="${cx}" cy="${cy}" r="${radius * 0.95}" fill="rgba(255,255,255,0.12)"/>
  <circle cx="${cx}" cy="${cy}" r="${radius * 0.82}" fill="rgba(0,0,0,0.15)"/>

  <!-- Play triangle -->
  <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="white" filter="url(#shadow)"/>
</svg>`;
}

/**
 * Generate SVG for tray icon (simple play symbol)
 */
function generateTraySvg(size, color = 'white') {
  const cx = size / 2;
  const cy = size / 2;
  const triangleSize = size * 0.35;

  const x1 = cx - triangleSize * 0.4;
  const y1 = cy - triangleSize;
  const x2 = cx - triangleSize * 0.4;
  const y2 = cy + triangleSize;
  const x3 = cx + triangleSize * 0.8;
  const y3 = cy;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="${color}"/>
</svg>`;
}

async function main() {
  console.log('🎨 Generating Music Player icons...\n');

  // Generate PNG icons at all sizes
  for (const size of SIZES) {
    const svg = generateIconSvg(size);
    const outputPath = path.join(ICONS_DIR, `${size}x${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`  ✓ Generated ${size}x${size}.png`);
  }

  // Generate tray icons (22px is standard macOS tray size)
  const tray22 = generateTraySvg(22, 'white');
  await sharp(Buffer.from(tray22)).png().toFile(path.join(ICONS_DIR, 'tray.png'));
  console.log('  ✓ Generated tray.png');

  // Template version (black, macOS will invert for dark mode)
  const tray22Template = generateTraySvg(22, 'black');
  await sharp(Buffer.from(tray22Template)).png().toFile(path.join(ICONS_DIR, 'tray-Template.png'));
  console.log('  ✓ Generated tray-Template.png');

  // @2x versions for Retina
  const tray44 = generateTraySvg(44, 'white');
  await sharp(Buffer.from(tray44)).png().toFile(path.join(ICONS_DIR, 'tray@2x.png'));
  console.log('  ✓ Generated tray@2x.png');

  const tray44Template = generateTraySvg(44, 'black');
  await sharp(Buffer.from(tray44Template)).png().toFile(path.join(ICONS_DIR, 'tray-Template@2x.png'));
  console.log('  ✓ Generated tray-Template@2x.png');

  // Create main icon.png for electron-builder
  fs.copyFileSync(
    path.join(ICONS_DIR, '512x512.png'),
    path.join(ICONS_DIR, 'icon.png')
  );
  console.log('  ✓ Created icon.png');

  // Create iconset for macOS .icns
  console.log('\n📦 Creating macOS .icns file...');
  const iconsetPath = path.join(ICONS_DIR, 'icon.iconset');
  if (!fs.existsSync(iconsetPath)) {
    fs.mkdirSync(iconsetPath);
  }

  // Copy and rename files for iconset
  const iconsetSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  for (const { size, name } of iconsetSizes) {
    const srcPath = path.join(ICONS_DIR, `${size}x${size}.png`);
    const destPath = path.join(iconsetPath, name);
    fs.copyFileSync(srcPath, destPath);
  }

  // Use iconutil to create .icns (macOS only)
  try {
    execSync(`iconutil -c icns "${iconsetPath}" -o "${path.join(ICONS_DIR, 'icon.icns')}"`, { stdio: 'pipe' });
    console.log('  ✓ Created icon.icns');
    // Clean up iconset
    fs.rmSync(iconsetPath, { recursive: true });
  } catch (error) {
    console.log('  ⚠ Could not create .icns (iconutil not available or failed)');
    console.log('    This is normal on non-macOS systems');
  }

  // Create Windows .ico using sharp/png2ico or note for electron-builder
  console.log('\n📦 For Windows .ico:');
  console.log('  ℹ electron-builder will automatically convert icon.png to icon.ico');

  console.log('\n✅ Icon generation complete!');
  console.log(`   Icons saved to: ${ICONS_DIR}`);

  // List generated files
  console.log('\n📁 Generated files:');
  const files = fs.readdirSync(ICONS_DIR).sort();
  for (const file of files) {
    const stats = fs.statSync(path.join(ICONS_DIR, file));
    console.log(`   ${file} (${Math.round(stats.size / 1024)}KB)`);
  }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Bundle the backend into a single CommonJS file for Electron
 * This avoids ESM issues when running the backend in Electron's Node.js runtime
 */

import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDir = path.join(__dirname, '../../backend');
const outputDir = path.join(__dirname, '../dist/backend');
const prismaOutputDir = path.join(outputDir, 'prisma');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(prismaOutputDir)) {
  fs.mkdirSync(prismaOutputDir, { recursive: true });
}

/**
 * Copy Prisma SQLite client and engine binaries
 */
function copyPrismaClient() {
  console.log('📋 Copying Prisma SQLite client...');

  const prismaClientSrc = path.join(backendDir, 'node_modules/.prisma-sqlite/client');

  if (!fs.existsSync(prismaClientSrc)) {
    console.error('❌ Prisma SQLite client not found. Run: cd backend && npx prisma generate --schema=prisma/schema.sqlite.prisma');
    process.exit(1);
  }

  // Copy all Prisma client files
  const filesToCopy = [
    'index.js',
    'index.d.ts',
    'package.json',
    'schema.prisma',
  ];

  // Copy JS/TS files
  for (const file of filesToCopy) {
    const src = path.join(prismaClientSrc, file);
    const dest = path.join(prismaOutputDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   Copied: ${file}`);
    }
  }

  // Copy runtime directory
  const runtimeSrc = path.join(prismaClientSrc, 'runtime');
  const runtimeDest = path.join(prismaOutputDir, 'runtime');
  if (fs.existsSync(runtimeSrc)) {
    fs.cpSync(runtimeSrc, runtimeDest, { recursive: true });
    console.log('   Copied: runtime/');
  }

  // Copy native engine binaries based on platform
  const engineFiles = fs.readdirSync(prismaClientSrc).filter(f =>
    f.endsWith('.node') || f.endsWith('.dylib.node') || f.endsWith('.so.node') || f.endsWith('.dll.node')
  );

  for (const engineFile of engineFiles) {
    const src = path.join(prismaClientSrc, engineFile);
    const dest = path.join(prismaOutputDir, engineFile);
    fs.copyFileSync(src, dest);
    console.log(`   Copied: ${engineFile}`);
  }

  console.log('✅ Prisma client copied\n');
}

/**
 * Create a shim for @prisma/client that points to our bundled SQLite client
 */
function createPrismaShim() {
  const shimContent = `
// Prisma client shim for Electron - redirects to SQLite client
const path = require('path');
const prismaPath = path.join(__dirname, 'prisma', 'index.js');
module.exports = require(prismaPath);
`;

  fs.writeFileSync(path.join(outputDir, 'prisma-shim.js'), shimContent.trim());
  console.log('   Created: prisma-shim.js');
}

/**
 * esbuild plugin to redirect @prisma/client imports
 */
const prismaRedirectPlugin = {
  name: 'prisma-redirect',
  setup(build) {
    // Redirect @prisma/client to our shim
    build.onResolve({ filter: /^@prisma\/client$/ }, () => {
      return {
        path: path.join(outputDir, 'prisma-shim.js'),
        external: false,
      };
    });
  },
};

async function bundle() {
  console.log('📦 Bundling backend for Electron...\n');

  // Step 1: Copy Prisma client
  copyPrismaClient();

  // Step 2: Create Prisma shim
  createPrismaShim();

  // Step 3: Bundle backend
  try {
    await esbuild.build({
      entryPoints: [path.join(backendDir, 'src/server.ts')],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs', // CommonJS for Electron compatibility
      outfile: path.join(outputDir, 'server.js'),
      external: [
        // Keep native/problematic modules external
        'fsevents',
        'better-sqlite3',
        // We handle @prisma/client separately with our shim
      ],
      plugins: [prismaRedirectPlugin],
      sourcemap: true,
      minify: false, // Keep readable for debugging
      // Handle ESM imports
      mainFields: ['module', 'main'],
      resolveExtensions: ['.ts', '.js', '.mjs', '.json'],
      define: {
        'import.meta.url': 'undefined',
      },
      alias: {
        // Redirect @prisma/client imports to our bundled version
        '@prisma/client': path.join(outputDir, 'prisma-shim.js'),
      },
    });

    console.log('✅ Backend bundled successfully!');
    console.log(`   Output: ${path.join(outputDir, 'server.js')}`);

    // Create a minimal package.json for CJS (without "type": "module")
    const packageJson = {
      name: "@media-player/backend-bundled",
      version: "1.0.0",
      main: "server.js",
      // Note: No "type": "module" so server.js is treated as CommonJS
    };

    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('   Created: package.json (CJS compatible)');

  } catch (error) {
    console.error('❌ Bundle failed:', error);
    process.exit(1);
  }

  // Copy database initialization SQL
  const sqlSrc = path.join(__dirname, 'init-database.sql');
  const sqlDest = path.join(outputDir, 'init-database.sql');
  if (fs.existsSync(sqlSrc)) {
    fs.copyFileSync(sqlSrc, sqlDest);
    console.log('   Copied: init-database.sql');
  }

  console.log('\n✅ Backend bundle complete!');
  console.log(`   Location: ${outputDir}`);

  // List output files
  const files = fs.readdirSync(outputDir);
  console.log('\n📁 Output files:');
  for (const file of files) {
    const stat = fs.statSync(path.join(outputDir, file));
    const size = stat.isDirectory() ? 'DIR' : `${Math.round(stat.size / 1024)}KB`;
    console.log(`   ${file} (${size})`);
  }
}

bundle();

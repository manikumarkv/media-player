import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { getAppPaths } from './paths';

/**
 * Initialize the SQLite database with the required schema
 * This is called on first run when the database is empty
 */
export async function initializeDatabase(): Promise<boolean> {
  const paths = getAppPaths();
  const dbPath = paths.database;

  console.log('Checking database at:', dbPath);

  // Check if database has the required tables (not just file size)
  if (fs.existsSync(dbPath)) {
    try {
      // Use sqlite3 to check if Media table exists
      const result = execSync(
        `sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table' AND name='Media';"`,
        { stdio: 'pipe', encoding: 'utf-8' }
      );
      if (result.trim() === 'Media') {
        console.log('Database already initialized with tables');
        return true;
      }
    } catch {
      // Error checking tables, continue to initialization
    }
  }

  console.log('Database needs initialization...');

  // Find the SQL initialization file
  const sqlPath = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'init-database.sql')
    : path.join(__dirname, '../../dist/backend/init-database.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('Database initialization SQL not found at:', sqlPath);
    // Try alternate path
    const altSqlPath = path.join(__dirname, '../../scripts/init-database.sql');
    if (fs.existsSync(altSqlPath)) {
      return initializeDatabaseWithSql(dbPath, altSqlPath);
    }
    return false;
  }

  return initializeDatabaseWithSql(dbPath, sqlPath);
}

/**
 * Initialize database using SQL file via sqlite3 CLI
 */
function initializeDatabaseWithSql(dbPath: string, sqlPath: string): boolean {
  try {
    console.log('Initializing database with sqlite3 CLI...');
    console.log('  Database:', dbPath);
    console.log('  SQL file:', sqlPath);

    // Use sqlite3 CLI to initialize the database
    execSync(`sqlite3 "${dbPath}" < "${sqlPath}"`, { stdio: 'pipe' });
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database with sqlite3 CLI:', error);
    return false;
  }
}

/**
 * Check if database has the required tables
 */
export function isDatabaseInitialized(): boolean {
  const paths = getAppPaths();
  const dbPath = paths.database;

  if (!fs.existsSync(dbPath)) {
    return false;
  }

  try {
    // Check if Media table exists
    const result = execSync(
      `sqlite3 "${dbPath}" "SELECT name FROM sqlite_master WHERE type='table' AND name='Media';"`,
      { stdio: 'pipe', encoding: 'utf-8' }
    );
    return result.trim() === 'Media';
  } catch {
    return false;
  }
}

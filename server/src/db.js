import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDir, '../.env')
});

const serverRoot = path.resolve(currentDir, '..');

const configured = process.env.DB_FILE || './data/business_analytics.db';

const dbPath = path.isAbsolute(configured)
  ? configured
  : path.resolve(serverRoot, configured);

const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

export const db = new DatabaseSync(
  dbPath,
  isVercel ? { readOnly: true } : {}
);

if (!isVercel) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
} else {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
}

export function closeDatabase() {
  db.close();
}
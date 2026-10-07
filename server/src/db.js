import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configured = process.env.DB_FILE || './data/business_analytics.db';
const dbPath = path.isAbsolute(configured) ? configured : path.resolve(serverRoot, configured);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
export function closeDatabase(){ db.close(); }

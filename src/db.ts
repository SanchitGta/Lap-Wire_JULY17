import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './config';

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

export const db = new Database(config.databasePath);

export function initDb(): void {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS slack_installations (
      team_id       TEXT NOT NULL,
      enterprise_id TEXT NOT NULL DEFAULT '',
      bot_token     TEXT NOT NULL,
      bot_id        TEXT,
      bot_user_id   TEXT NOT NULL,
      app_id        TEXT,
      installed_at  INTEGER NOT NULL,
      PRIMARY KEY (team_id, enterprise_id)
    );
  `);
}

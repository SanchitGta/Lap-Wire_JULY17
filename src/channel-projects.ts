import { db } from './db';

db.exec(`
  CREATE TABLE IF NOT EXISTS channel_projects (
    channel_id   TEXT NOT NULL PRIMARY KEY,
    project_slug TEXT NOT NULL,
    linked_by    TEXT NOT NULL,
    linked_at    INTEGER NOT NULL
  );
`);

const selectStmt = db.prepare(
  'SELECT project_slug FROM channel_projects WHERE channel_id = ?'
);

const upsertStmt = db.prepare(
  'INSERT OR REPLACE INTO channel_projects (channel_id, project_slug, linked_by, linked_at) VALUES (?, ?, ?, ?)'
);

export function getChannelProject(channelId: string): string | null {
  const row = selectStmt.get(channelId) as { project_slug: string } | undefined;
  return row?.project_slug ?? null;
}

export function setChannelProject(channelId: string, projectSlug: string, userId: string): void {
  upsertStmt.run(channelId, projectSlug, userId, Date.now());
}

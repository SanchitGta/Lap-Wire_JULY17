import type { Installation, InstallationQuery, InstallationStore } from '@slack/bolt';
import { db } from '../db';

interface InstallationRow {
  team_id: string;
  enterprise_id: string;
  bot_token: string;
  bot_id: string | null;
  bot_user_id: string;
  app_id: string | null;
  installed_at: number;
}

export const sqliteInstallationStore: InstallationStore = {
  async storeInstallation(installation: Installation): Promise<void> {
    db.prepare(`
      INSERT OR REPLACE INTO slack_installations
        (team_id, enterprise_id, bot_token, bot_id, bot_user_id, app_id, installed_at)
      VALUES
        (@team_id, @enterprise_id, @bot_token, @bot_id, @bot_user_id, @app_id, @installed_at)
    `).run({
      team_id: installation.team?.id ?? '',
      enterprise_id: installation.enterprise?.id ?? '',
      bot_token: installation.bot.token,
      bot_id: installation.bot.id ?? null,
      bot_user_id: installation.bot.userId,
      app_id: installation.appId ?? null,
      installed_at: Date.now(),
    });
  },

  async fetchInstallation(query: InstallationQuery): Promise<Installation> {
    const row = db.prepare(`
      SELECT * FROM slack_installations
      WHERE team_id = ? AND enterprise_id = ?
    `).get(query.teamId, query.enterpriseId ?? '') as InstallationRow | undefined;

    if (!row) {
      throw new Error('Installation not found');
    }

    return {
      team: row.team_id ? { id: row.team_id } : undefined,
      enterprise: row.enterprise_id ? { id: row.enterprise_id } : undefined,
      user: { id: row.bot_user_id, token: undefined, scopes: undefined },
      bot: {
        token: row.bot_token,
        id: row.bot_id ?? undefined,
        userId: row.bot_user_id,
        scopes: [],
      },
      appId: row.app_id ?? undefined,
      tokenType: 'bot',
    } as Installation;
  },

  async deleteInstallation(query: InstallationQuery): Promise<void> {
    db.prepare(`
      DELETE FROM slack_installations
      WHERE team_id = ? AND enterprise_id = ?
    `).run(query.teamId, query.enterpriseId ?? '');
  },
};

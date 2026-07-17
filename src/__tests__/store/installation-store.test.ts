import type { Installation, InstallationQuery } from '@slack/bolt';

jest.mock('../../../db', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS slack_installations (
      team_id       TEXT NOT NULL,
      enterprise_id TEXT NOT NULL DEFAULT '',
      bot_token     TEXT NOT NULL,
      bot_id        TEXT,
      bot_user_id   TEXT NOT NULL,
      app_id        TEXT,
      installed_at  INTEGER NOT NULL,
      PRIMARY KEY (team_id, enterprise_id)
    )
  `);
  return { db, initDb: jest.fn() };
});

import { sqliteInstallationStore } from '../../../store/installation-store';

const baseInstallation: Installation = {
  team: { id: 'T123', name: 'Test Team' },
  enterprise: undefined,
  user: { id: 'U123', token: undefined, scopes: undefined },
  bot: { token: 'xoxb-test-token', id: 'B123', userId: 'U456', scopes: [] },
  appId: 'A123',
  tokenType: 'bot',
} as Installation;

describe('sqliteInstallationStore', () => {
  beforeEach(async () => {
    await sqliteInstallationStore.deleteInstallation?.({ teamId: 'T123', enterpriseId: undefined, isEnterpriseInstall: false } as InstallationQuery);
    await sqliteInstallationStore.deleteInstallation?.({ teamId: 'T_ENT', enterpriseId: 'E999', isEnterpriseInstall: true } as InstallationQuery);
  });

  describe('storeInstallation + fetchInstallation', () => {
    it('stores a bot token and fetches it back', async () => {
      await sqliteInstallationStore.storeInstallation(baseInstallation);
      const result = await sqliteInstallationStore.fetchInstallation({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      } as InstallationQuery);
      expect(result.bot?.token).toBe('xoxb-test-token');
      expect(result.bot?.id).toBe('B123');
      expect(result.bot?.userId).toBe('U456');
      expect(result.team?.id).toBe('T123');
      expect(result.appId).toBe('A123');
    });

    it('upserts on re-install (INSERT OR REPLACE)', async () => {
      await sqliteInstallationStore.storeInstallation(baseInstallation);
      const updated: Installation = {
        ...baseInstallation,
        bot: { ...baseInstallation.bot!, token: 'xoxb-new-token' },
      } as Installation;
      await sqliteInstallationStore.storeInstallation(updated);
      const result = await sqliteInstallationStore.fetchInstallation({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      } as InstallationQuery);
      expect(result.bot?.token).toBe('xoxb-new-token');
    });

    it('stores enterprise_id as empty string for non-Grid workspaces', async () => {
      await sqliteInstallationStore.storeInstallation(baseInstallation);
      const result = await sqliteInstallationStore.fetchInstallation({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      } as InstallationQuery);
      expect(result.enterprise).toBeUndefined();
    });

    it('stores and fetches an Enterprise Grid installation', async () => {
      const entInstallation: Installation = {
        ...baseInstallation,
        team: { id: 'T_ENT' },
        enterprise: { id: 'E999', name: 'Big Corp' },
      } as Installation;
      await sqliteInstallationStore.storeInstallation(entInstallation);
      const result = await sqliteInstallationStore.fetchInstallation({
        teamId: 'T_ENT',
        enterpriseId: 'E999',
        isEnterpriseInstall: true,
      } as InstallationQuery);
      expect(result.enterprise?.id).toBe('E999');
    });
  });

  describe('fetchInstallation — missing team', () => {
    it('throws "Installation not found" for an unknown team', async () => {
      await expect(
        sqliteInstallationStore.fetchInstallation({
          teamId: 'NONEXISTENT',
          enterpriseId: undefined,
          isEnterpriseInstall: false,
        } as InstallationQuery)
      ).rejects.toThrow('Installation not found');
    });
  });

  describe('deleteInstallation', () => {
    it('deletes an installation so it cannot be fetched', async () => {
      await sqliteInstallationStore.storeInstallation(baseInstallation);
      await sqliteInstallationStore.deleteInstallation?.({
        teamId: 'T123',
        enterpriseId: undefined,
        isEnterpriseInstall: false,
      } as InstallationQuery);
      await expect(
        sqliteInstallationStore.fetchInstallation({
          teamId: 'T123',
          enterpriseId: undefined,
          isEnterpriseInstall: false,
        } as InstallationQuery)
      ).rejects.toThrow('Installation not found');
    });

    it('is idempotent — deleting a non-existent row does not throw', async () => {
      await expect(
        sqliteInstallationStore.deleteInstallation?.({
          teamId: 'NEVER_INSTALLED',
          enterpriseId: undefined,
          isEnterpriseInstall: false,
        } as InstallationQuery)
      ).resolves.toBeUndefined();
    });
  });
});

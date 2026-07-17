import { App } from '@slack/bolt';
import { config } from './config';
import { sqliteInstallationStore } from './store/installation-store';

export const app = new App({
  signingSecret: config.slackSigningSecret,
  clientId: config.slackClientId,
  clientSecret: config.slackClientSecret,
  stateSecret: config.slackStateSecret,
  scopes: ['commands', 'chat:write', 'users:read', 'channels:history'],
  installationStore: sqliteInstallationStore,
  installerOptions: {
    directInstall: true,
    redirectUriPath: '/slack/oauth_redirect',
  },
});

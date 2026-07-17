import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const appUrl = requireEnv('APP_URL');
if (!appUrl.startsWith('https://')) {
  throw new Error('APP_URL must start with https://');
}

export const config = {
  slackClientId: requireEnv('SLACK_CLIENT_ID'),
  slackClientSecret: requireEnv('SLACK_CLIENT_SECRET'),
  slackSigningSecret: requireEnv('SLACK_SIGNING_SECRET'),
  slackStateSecret: requireEnv('SLACK_STATE_SECRET'),
  databasePath: requireEnv('DATABASE_PATH'),
  appUrl,
  port: parseInt(process.env['PORT'] ?? '3000', 10),
};

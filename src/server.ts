import 'dotenv/config';
import { config } from './config';
import { initDb } from './db';
import { app } from './app';
import { registerCommands } from './commands';
import { registerErrorMiddleware } from './middleware/error';

async function main(): Promise<void> {
  initDb();
  registerCommands(app);
  registerErrorMiddleware(app);

  // Story 8 adds: import { registerAuthHandlers } from './auth'
  //               registerAuthHandlers(app)

  await app.start(config.port);
  console.log(`Lap Wire listening on port ${config.port}`);
}

process.on('unhandledRejection', (reason) => {
  console.error('[lapwire] unhandled rejection:', reason);
  process.exit(1);
});

main().catch((err) => {
  console.error('[lapwire] startup error:', err);
  process.exit(1);
});

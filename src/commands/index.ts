import type { App } from '@slack/bolt';
import { run } from './run';
import { status } from './status';
import { list } from './list';
import { cancel } from './cancel';
import { retry } from './retry';
import { link } from './link';
import { whoami } from './whoami';
import { handleCommandError } from '../middleware/error';

function unknownSubcommandMessage(sub: string) {
  return {
    response_type: 'ephemeral' as const,
    text: `Unknown command: /lap ${sub}. Valid subcommands: run, status, list, cancel, retry, link, whoami.`,
  };
}

export function registerCommands(app: App): void {
  app.command('/lap', async ({ command, ack, respond }) => {
    await ack();

    const rawText = command.text.trim();
    let subcommand: string;
    let args: string[];

    if (rawText === '') {
      subcommand = '';
      args = [];
    } else {
      const [first, ...rest] = rawText.split(/\s+/);
      subcommand = first.toLowerCase();
      args = rest;
    }

    try {
      switch (subcommand) {
        case 'run':
          await run({ command, respond, args });
          break;
        case 'status':
          await status({ command, respond, args });
          break;
        case 'list':
          await list({ command, respond, args: [] });
          break;
        case 'cancel':
          await cancel({ command, respond, args: [] });
          break;
        case 'retry':
          await retry({ command, respond, args: [] });
          break;
        case 'link':
          await link({ command, respond, args });
          break;
        case 'whoami':
          await whoami({ command, respond, args: [] });
          break;
        default:
          await respond(unknownSubcommandMessage(subcommand));
      }
    } catch (error) {
      await handleCommandError(error, respond);
    }
  });
}

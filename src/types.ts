import type { SlashCommand, RespondFn } from '@slack/bolt';

export type CommandContext = {
  command: SlashCommand;
  respond: RespondFn;
  args: string[];
};

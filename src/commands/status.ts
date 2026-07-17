import type { CommandContext } from '../types';

export async function status(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap status — not yet implemented.' });
}

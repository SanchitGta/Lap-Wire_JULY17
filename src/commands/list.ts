import type { CommandContext } from '../types';

export async function list(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap list — not yet implemented.' });
}

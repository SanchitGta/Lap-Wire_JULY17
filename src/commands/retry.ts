import type { CommandContext } from '../types';

export async function retry(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap retry — not yet implemented.' });
}

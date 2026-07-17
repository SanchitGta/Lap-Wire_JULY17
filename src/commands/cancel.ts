import type { CommandContext } from '../types';

export async function cancel(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap cancel — not yet implemented.' });
}

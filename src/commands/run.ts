import type { CommandContext } from '../types';

export async function run(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap run — not yet implemented.' });
}

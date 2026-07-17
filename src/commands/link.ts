import type { CommandContext } from '../types';

// Story 9 replaces this body. Export name and CommandContext signature are the contract.
export async function link(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap link — not yet implemented.' });
}

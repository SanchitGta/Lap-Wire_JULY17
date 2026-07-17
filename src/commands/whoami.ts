import type { CommandContext } from '../types';

// Story 8 replaces this body. Export name and CommandContext signature are the contract.
export async function whoami(ctx: CommandContext): Promise<void> {
  await ctx.respond({ response_type: 'ephemeral' as const, text: '/lap whoami — not yet implemented.' });
}

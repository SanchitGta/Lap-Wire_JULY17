import type { CommandContext } from '../types';
import { requireLinkedUser } from '../auth/guard';
import { getChannelProject, setChannelProject } from '../channel-projects';

export async function link(ctx: CommandContext): Promise<void> {
  const { command, respond, args } = ctx;

  const isLinked = await requireLinkedUser(command.user_id, respond);
  if (!isLinked) return;

  if (args.length === 0) {
    const project = getChannelProject(command.channel_id);
    if (project !== null) {
      await respond({ response_type: 'ephemeral' as const, text: `This channel is linked to project: \`${project}\`` });
    } else {
      await respond({ response_type: 'ephemeral' as const, text: 'No project linked. Use /lap link <project> to link one.' });
    }
  } else {
    const projectSlug = args[0];
    setChannelProject(command.channel_id, projectSlug, command.user_id);
    await respond({ response_type: 'ephemeral' as const, text: `Channel linked to project: \`${projectSlug}\`` });
  }
}

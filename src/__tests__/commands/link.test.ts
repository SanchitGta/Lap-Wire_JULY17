import type { RespondFn, SlashCommand } from '@slack/bolt';

jest.mock('../../../auth/guard');
jest.mock('../../../channel-projects');

import { link } from '../../../commands/link';
import { requireLinkedUser } from '../../../auth/guard';
import { getChannelProject, setChannelProject } from '../../../channel-projects';

const mockRequireLinkedUser = jest.mocked(requireLinkedUser);
const mockGetChannelProject = jest.mocked(getChannelProject);
const mockSetChannelProject = jest.mocked(setChannelProject);

function makeCtx(args: string[], channelId = 'C123', userId = 'U456') {
  return {
    command: { channel_id: channelId, user_id: userId } as SlashCommand,
    respond: jest.fn() as jest.MockedFunction<RespondFn>,
    args,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('link handler', () => {
  it('no args, unlinked: does not call respond', async () => {
    mockRequireLinkedUser.mockResolvedValue(false);
    const ctx = makeCtx([]);
    await link(ctx);
    expect(ctx.respond).not.toHaveBeenCalled();
  });

  it('no args, linked, channel unmapped: responds with no-project message', async () => {
    mockRequireLinkedUser.mockResolvedValue(true);
    mockGetChannelProject.mockReturnValue(null);
    const ctx = makeCtx([]);
    await link(ctx);
    expect(ctx.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        response_type: 'ephemeral',
        text: expect.stringContaining('No project linked'),
      })
    );
  });

  it('no args, linked, channel mapped: responds with mapped project name', async () => {
    mockRequireLinkedUser.mockResolvedValue(true);
    mockGetChannelProject.mockReturnValue('my-project');
    const ctx = makeCtx([]);
    await link(ctx);
    expect(ctx.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        response_type: 'ephemeral',
        text: expect.stringContaining('my-project'),
      })
    );
  });

  it('with slug, unlinked: does not call respond or setChannelProject', async () => {
    mockRequireLinkedUser.mockResolvedValue(false);
    const ctx = makeCtx(['my-project']);
    await link(ctx);
    expect(ctx.respond).not.toHaveBeenCalled();
    expect(mockSetChannelProject).not.toHaveBeenCalled();
  });

  it('with slug, linked: calls setChannelProject and responds with confirmation', async () => {
    mockRequireLinkedUser.mockResolvedValue(true);
    const ctx = makeCtx(['my-project'], 'C123', 'U456');
    await link(ctx);
    expect(mockSetChannelProject).toHaveBeenCalledWith('C123', 'my-project', 'U456');
    expect(ctx.respond).toHaveBeenCalledWith(
      expect.objectContaining({
        response_type: 'ephemeral',
        text: expect.stringContaining('my-project'),
      })
    );
  });
});

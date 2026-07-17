import type { App, SlashCommand, RespondFn } from '@slack/bolt';

jest.mock('../../../commands/run');
jest.mock('../../../commands/status');
jest.mock('../../../commands/list');
jest.mock('../../../commands/cancel');
jest.mock('../../../commands/retry');
jest.mock('../../../commands/link');
jest.mock('../../../commands/whoami');
jest.mock('../../../middleware/error');

import { registerCommands } from '../../../commands';
import { run } from '../../../commands/run';
import { status } from '../../../commands/status';
import { list } from '../../../commands/list';
import { cancel } from '../../../commands/cancel';
import { retry } from '../../../commands/retry';
import { link } from '../../../commands/link';
import { whoami } from '../../../commands/whoami';

type CommandHandler = (args: {
  command: Partial<SlashCommand>;
  ack: jest.Mock;
  respond: jest.Mock;
}) => Promise<void>;

describe('command router', () => {
  let capturedHandler: CommandHandler;
  let mockApp: Partial<App>;

  beforeAll(() => {
    mockApp = {
      command: jest.fn((_name: string, handler: CommandHandler) => {
        capturedHandler = handler;
      }),
    };
    registerCommands(mockApp as App);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeArgs(text: string) {
    return {
      command: { text } as Partial<SlashCommand>,
      ack: jest.fn(),
      respond: jest.fn() as jest.MockedFunction<RespondFn>,
    };
  }

  it('registers the /lap command listener', () => {
    expect(mockApp.command).toHaveBeenCalledWith('/lap', expect.any(Function));
  });

  it('calls ack() first before any routing', async () => {
    const { command, ack, respond } = makeArgs('run');
    jest.mocked(run).mockResolvedValue(undefined);
    const order: string[] = [];
    ack.mockImplementation(() => { order.push('ack'); return Promise.resolve(); });
    jest.mocked(run).mockImplementation(() => { order.push('run'); return Promise.resolve(); });
    await capturedHandler({ command, ack, respond });
    expect(order[0]).toBe('ack');
    expect(order[1]).toBe('run');
  });

  it('dispatches "run" to the run handler with correct args', async () => {
    const { command, ack, respond } = makeArgs('run my-lap');
    jest.mocked(run).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(run).toHaveBeenCalledWith({ command, respond, args: ['my-lap'] });
  });

  it('dispatches "status" to the status handler', async () => {
    const { command, ack, respond } = makeArgs('status 42');
    jest.mocked(status).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(status).toHaveBeenCalledWith({ command, respond, args: ['42'] });
  });

  it('dispatches "list" to the list handler with empty args', async () => {
    const { command, ack, respond } = makeArgs('list');
    jest.mocked(list).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(list).toHaveBeenCalledWith({ command, respond, args: [] });
  });

  it('dispatches "cancel" to the cancel handler with empty args', async () => {
    const { command, ack, respond } = makeArgs('cancel');
    jest.mocked(cancel).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(cancel).toHaveBeenCalledWith({ command, respond, args: [] });
  });

  it('dispatches "retry" to the retry handler with empty args', async () => {
    const { command, ack, respond } = makeArgs('retry');
    jest.mocked(retry).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(retry).toHaveBeenCalledWith({ command, respond, args: [] });
  });

  it('dispatches "link" to the link handler with args', async () => {
    const { command, ack, respond } = makeArgs('link #general project-id');
    jest.mocked(link).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(link).toHaveBeenCalledWith({ command, respond, args: ['#general', 'project-id'] });
  });

  it('dispatches "whoami" to the whoami handler with empty args', async () => {
    const { command, ack, respond } = makeArgs('whoami');
    jest.mocked(whoami).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(whoami).toHaveBeenCalledWith({ command, respond, args: [] });
  });

  it('is case-insensitive for subcommand tokens', async () => {
    const { command, ack, respond } = makeArgs('RUN');
    jest.mocked(run).mockResolvedValue(undefined);
    await capturedHandler({ command, ack, respond });
    expect(run).toHaveBeenCalled();
  });

  it('responds with unknown-subcommand message for unrecognized token', async () => {
    const { command, ack, respond } = makeArgs('bogus');
    await capturedHandler({ command, ack, respond });
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        response_type: 'ephemeral',
        text: expect.stringContaining('Unknown command: /lap bogus'),
      })
    );
  });

  it('responds with unknown-subcommand message when text is empty', async () => {
    const { command, ack, respond } = makeArgs('');
    await capturedHandler({ command, ack, respond });
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({
        response_type: 'ephemeral',
        text: expect.stringContaining('Unknown command'),
      })
    );
  });

  it('unknown-subcommand message lists all valid subcommands', async () => {
    const { command, ack, respond } = makeArgs('bad');
    await capturedHandler({ command, ack, respond });
    const text: string = jest.mocked(respond).mock.calls[0]?.[0]?.text as string;
    expect(text).toContain('run');
    expect(text).toContain('status');
    expect(text).toContain('list');
    expect(text).toContain('cancel');
    expect(text).toContain('retry');
    expect(text).toContain('link');
    expect(text).toContain('whoami');
  });
});

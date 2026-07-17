import type { RespondFn } from '@slack/bolt';

jest.mock('../../../config', () => ({
  config: {
    appUrl: 'https://test.example.com',
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
    slackSigningSecret: 'test-signing-secret',
    slackStateSecret: 'test-state-secret',
    databasePath: ':memory:',
    port: 3000,
  },
}));

import { handleCommandError } from '../../../middleware/error';

function makePlatformError(slackCode: string): Error {
  return Object.assign(new Error(slackCode), {
    code: 'slack_webapi_platform_error',
    data: { error: slackCode },
  });
}

describe('handleCommandError', () => {
  let respond: jest.MockedFunction<RespondFn>;

  beforeEach(() => {
    respond = jest.fn() as jest.MockedFunction<RespondFn>;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('token_expired platform error', () => {
    it('responds with a reinstall link', async () => {
      await handleCommandError(makePlatformError('token_expired'), respond);
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({
          response_type: 'ephemeral',
          text: expect.stringContaining('https://test.example.com/slack/install'),
        })
      );
    });

    it('does not expose the slack error code in the response', async () => {
      await handleCommandError(makePlatformError('token_expired'), respond);
      const text: string = (respond.mock.calls[0]?.[0] as { text: string }).text;
      expect(text).not.toContain('token_expired');
    });
  });

  describe('not_authed platform error', () => {
    it('responds with a reinstall link', async () => {
      await handleCommandError(makePlatformError('not_authed'), respond);
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({
          response_type: 'ephemeral',
          text: expect.stringContaining('https://test.example.com/slack/install'),
        })
      );
    });

    it('does not expose the slack error code in the response', async () => {
      await handleCommandError(makePlatformError('not_authed'), respond);
      const text: string = (respond.mock.calls[0]?.[0] as { text: string }).text;
      expect(text).not.toContain('not_authed');
    });
  });

  describe('other platform errors (e.g. channel_not_found)', () => {
    it('falls through to generic error handler and does not leak data', async () => {
      await handleCommandError(makePlatformError('channel_not_found'), respond);
      const text: string = (respond.mock.calls[0]?.[0] as { text: string }).text;
      expect(text).not.toContain('channel_not_found');
      expect(text).not.toContain('platform_error');
    });
  });

  describe('Installation not found error', () => {
    it('responds with an install link', async () => {
      const error = new Error('Installation not found');
      await handleCommandError(error, respond);
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({
          response_type: 'ephemeral',
          text: expect.stringContaining('https://test.example.com/slack/install'),
        })
      );
    });

    it('does not forward the raw error message to Slack', async () => {
      const error = new Error('Installation not found');
      await handleCommandError(error, respond);
      const text: string = (respond.mock.calls[0]?.[0] as { text: string }).text;
      expect(text).not.toContain('Installation not found');
    });
  });

  describe('unexpected / unknown error', () => {
    it('responds with a generic ephemeral message', async () => {
      const error = new Error('some internal db error with sensitive info');
      await handleCommandError(error, respond);
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ response_type: 'ephemeral' })
      );
    });

    it('does not leak error message or stack into the response', async () => {
      const error = new Error('super secret db password is abc123');
      await handleCommandError(error, respond);
      const text: string = (respond.mock.calls[0]?.[0] as { text: string }).text;
      expect(text).not.toContain('super secret');
      expect(text).not.toContain('abc123');
      expect(text).not.toContain(error.stack ?? '');
    });

    it('logs the error to console.error', async () => {
      const error = new Error('boom');
      await handleCommandError(error, respond);
      expect(console.error).toHaveBeenCalled();
    });

    it('handles non-Error objects without throwing', async () => {
      await expect(
        handleCommandError({ arbitrary: 'object' }, respond)
      ).resolves.toBeUndefined();
      expect(respond).toHaveBeenCalledWith(
        expect.objectContaining({ response_type: 'ephemeral' })
      );
    });
  });
});

import type { App, RespondFn } from '@slack/bolt';
import { config } from '../config';

function isPlatformError(error: unknown): error is Error & { code: string; data: { error: string } } {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code: string }).code === 'slack_webapi_platform_error' &&
    'data' in error &&
    typeof (error as { data: unknown }).data === 'object' &&
    (error as { data: unknown }).data !== null
  );
}

export async function handleCommandError(error: unknown, respond: RespondFn): Promise<void> {
  if (isPlatformError(error)) {
    const slackCode = error.data.error;
    if (slackCode === 'token_expired' || slackCode === 'not_authed') {
      await respond({
        response_type: 'ephemeral' as const,
        text: `Your workspace authorization has expired. Please reinstall: ${config.appUrl}/slack/install`,
      });
      return;
    }
  }

  if (error instanceof Error && error.message.includes('Installation not found')) {
    await respond({
      response_type: 'ephemeral' as const,
      text: `This workspace is not connected to Lap Wire. Install at: ${config.appUrl}/slack/install`,
    });
    return;
  }

  console.error('[lapwire] command error:', error);
  await respond({
    response_type: 'ephemeral' as const,
    text: 'An unexpected error occurred. Please try again or contact your workspace admin.',
  });
}

export function registerErrorMiddleware(app: App): void {
  app.error(async (error) => {
    console.error('[lapwire] unhandled error:', error);
  });
}

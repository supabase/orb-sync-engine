import * as Sentry from '@sentry/node';
import { getConfig } from './utils/config';

const config = getConfig();

Sentry.init({
  enabled: config.SENTRY_DSN !== undefined,
  dsn: config.SENTRY_DSN,
  environment: config.SENTRY_ENVIRONMENT,
  integrations: [Sentry.extraErrorDataIntegration()],
  tracesSampleRate: 0.001,
});

// Needs to be imported here at the very beginning so that auto-instrumentation works for the imported modules
import './instrument';

import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import autoload from '@fastify/autoload';
import path from 'node:path';
import { OrbSync } from '@supabase/orb-sync-lib';
import { getConfig } from './utils/config';
import * as Sentry from '@sentry/node';
import pino from 'pino';

export async function createApp(opts: FastifyServerOptions = {}, logger: pino.Logger): Promise<FastifyInstance> {
  const app = fastify(opts);

  const config = getConfig();

  if (config.SENTRY_DSN) {
    Sentry.setupFastifyErrorHandler(app);
  }

  /**
   * Add a content parser for Orb webhooks
   */
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    try {
      let newBody;
      switch (req.routeOptions.url) {
        case '/webhooks':
          newBody = { raw: body };
          break;
        default:
          newBody = JSON.parse(body.toString());
          break;
      }
      done(null, newBody);
    } catch (error) {
      error.statusCode = 400;
      done(error, undefined);
    }
  });

  /**
   * Expose all routes in './routes'
   */
  await app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
  });

  const orbSync = new OrbSync({
    databaseUrl: config.DATABASE_URL,
    orbWebhookSecret: config.ORB_WEBHOOK_SECRET,
    databaseSchema: config.DATABASE_SCHEMA,
    orbApiKey: config.ORB_API_KEY,
    verifyWebhookSignature: config.VERIFY_WEBHOOK_SIGNATURE,
    logger,
  });

  app.decorate('orbSync', orbSync);

  await app.ready();

  return app;
}

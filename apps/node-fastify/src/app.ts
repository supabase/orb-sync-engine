import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import autoload from '@fastify/autoload';
import path from 'node:path';
import { OrbSync } from 'orb-sync-lib';
import { getConfig } from './utils/config';

export async function createApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = fastify(opts);

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

  const config = getConfig();

  const orbSync = new OrbSync({
    databaseUrl: config.DATABASE_URL,
    orbWebhookSecret: config.ORB_WEBHOOK_SECRET,
    databaseSchema: config.DATABASE_SCHEMA,
    orbApiKey: config.ORB_API_KEY,
    verifyWebhookSignature: config.VERIFY_WEBHOOK_SIGNATURE,
  });

  app.decorate('orbSync', orbSync);

  await app.ready();

  return app;
}

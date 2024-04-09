import fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import autoload from '@fastify/autoload';
import path from 'node:path';
import { OrbSync } from 'orb-sync-lib';
import assert from 'node:assert';

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

  const { DATABASE_URL, ORB_WEBHOOK_SECRET, DATABASE_SCHEMA, ORB_API_KEY } = process.env;

  assert(DATABASE_URL, 'DATABASE_URL is required');
  assert(ORB_WEBHOOK_SECRET, 'ORB_WEBHOOK_SECRET is required');

  const orbSync = new OrbSync({
    databaseUrl: DATABASE_URL,
    orbWebhookSecret: ORB_WEBHOOK_SECRET,
    databaseSchema: DATABASE_SCHEMA || 'orb',
    orbApiKey: ORB_API_KEY,
  });

  app.decorate('orbSync', orbSync);

  await app.ready();

  return app;
}

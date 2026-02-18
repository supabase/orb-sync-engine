// Needs to be imported here at the very beginning so that auto-instrumentation works for the imported modules
import './instrument';

import fastify, { FastifyInstance, FastifyServerOptions, type FastifyError } from 'fastify';
import fastifyMetrics from 'fastify-metrics';
import autoload from '@fastify/autoload';
import path from 'node:path';
import { OrbSync } from 'orb-sync-lib';
import { getConfig } from './utils/config';
import * as Sentry from '@sentry/node';
import pino from 'pino';
import prometheus from './prometheus';

export async function createApp(
  opts: FastifyServerOptions = {},
  logger: pino.Logger,
  orbSyncInstance?: OrbSync
): Promise<FastifyInstance> {
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

  // Ensure errors get logged
  app.setErrorHandler((error, _request, reply) => {
    const err = error as FastifyError;

    const statusCode = err.statusCode || 500;

    // Only log server errors
    if (statusCode >= 500) {
      app.log.error(error);
      if (config.PROMETHEUS_METRICS_ENABLED) {
        prometheus.metrics.internalServerErrorsCounter.inc();
      }
    }

    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal Server Error' : err.message,
    });
  });

  /**
   * Expose all routes in './routes'
   * Use compiled routes in test environment
   */
  const routesDir =
    process.env.NODE_ENV === 'test' ? path.join(__dirname, '../dist/routes') : path.join(__dirname, 'routes');

  await app.register(autoload, {
    dir: routesDir,
  });

  if (config.PROMETHEUS_METRICS_ENABLED) {
    logger.info('Prometheus metrics enabled, registering /metrics endpoint');
    await app.register(fastifyMetrics, {
      endpoint: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
      routeMetrics: {
        registeredRoutesOnly: false,
        // if we don't set this group, every single unknown route will get multiple metrics, possibly overflowing our metrics store
        invalidRouteGroup: 'invalidRoute',
      },
      promClient: prometheus.client,
    });
  }

  const orbSync =
    orbSyncInstance ||
    new OrbSync({
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

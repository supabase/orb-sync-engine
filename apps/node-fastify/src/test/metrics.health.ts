'use strict';
import { FastifyInstance } from 'fastify';
import { beforeAll, describe, test, expect, afterAll } from 'vitest';
import { createApp } from '../app';
import pino from 'pino';

describe('/metrics', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const logger = pino({ level: 'silent' });

    app = await createApp(
      {
        loggerInstance: logger,
        disableRequestLogging: true,
        requestIdHeader: 'Request-Id',
      },
      logger
    );
  });

  afterAll(async () => {
    await app.close();
  });

  test('is alive', async () => {
    const response = await app.inject({
      url: `/metrics`,
      method: 'GET',
    });
    const text = response.body;
    expect(response.statusCode).toBe(200);
    expect(text).toContain('orb_sync_webhooks_processed_total');
    expect(text).toContain('process_cpu_seconds_total');
  });
});

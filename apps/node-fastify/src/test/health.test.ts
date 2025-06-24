'use strict';
import { FastifyInstance } from 'fastify';
import { beforeAll, describe, test, expect, afterAll } from 'vitest';
import { createApp } from '../app';
import pino from 'pino';

describe('/health', () => {
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
      url: `/health`,
      method: 'GET',
    });
    const json = JSON.parse(response.body);
    expect(response.statusCode).toBe(200);
    expect(json).toMatchObject({ received: true });
  });
});

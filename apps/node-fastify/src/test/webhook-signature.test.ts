import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createHmac } from 'node:crypto';
import pino from 'pino';
import { OrbSync } from 'orb-sync-lib';
import { createApp } from '../app';

const PRIMARY_SECRET = 'test-webhook-secret-primary';
const ALT_SECRET = 'test-webhook-secret-alt';
const WRONG_SECRET = 'test-webhook-secret-wrong';

const TEST_PAYLOAD = JSON.stringify({
  id: 'test-event-id',
  created_at: new Date().toISOString(),
  type: 'resource_event.test',
  properties: {},
});

/**
 * Sign a payload the same way Orb does:
 * HMAC-SHA256 of "v1:{timestamp}:{payload}" → "v1={hex}"
 */
function signPayload(payload: string, secret: string): { signature: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  const toSign = `v1:${timestamp}:${payload}`;
  const hmac = createHmac('sha256', Buffer.from(secret, 'utf-8'));
  hmac.update(new TextEncoder().encode(toSign));
  const signature = `v1=${hmac.digest('hex')}`;
  return { signature, timestamp };
}

function createSignedRequest(payload: string, secret: string) {
  const { signature, timestamp } = signPayload(payload, secret);
  return {
    method: 'POST' as const,
    url: '/webhooks',
    headers: {
      'Content-Type': 'application/json',
      'X-Orb-Signature': signature,
      'X-Orb-Timestamp': timestamp,
    },
    payload,
  };
}

describe('Webhook signature verification with dual secrets', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const logger = pino({ level: 'silent' });

    const orbSync = new OrbSync({
      databaseUrl: process.env.DATABASE_URL!,
      orbWebhookSecret: PRIMARY_SECRET,
      orbWebhookSecretAlt: ALT_SECRET,
      verifyWebhookSignature: true,
      logger,
    });

    app = await createApp(
      {
        loggerInstance: logger,
        disableRequestLogging: true,
        requestIdHeader: 'Request-Id',
      },
      logger,
      orbSync
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should accept a webhook signed with the primary secret', async () => {
    const response = await app.inject(createSignedRequest(TEST_PAYLOAD, PRIMARY_SECRET));
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ received: true });
  });

  it('should accept a webhook signed with the alt secret', async () => {
    const response = await app.inject(createSignedRequest(TEST_PAYLOAD, ALT_SECRET));
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ received: true });
  });

  it('should reject a webhook signed with an unknown secret', async () => {
    const response = await app.inject(createSignedRequest(TEST_PAYLOAD, WRONG_SECRET));
    expect(response.statusCode).toBe(500);
  });
});

describe('Webhook signature verification without alt secret', () => {
  it('should reject when signed with a different secret and no alt is configured', async () => {
    const orbSync = new OrbSync({
      databaseUrl: process.env.DATABASE_URL!,
      orbWebhookSecret: PRIMARY_SECRET,
      verifyWebhookSignature: true,
      logger: pino({ level: 'silent' }),
    });

    const { signature, timestamp } = signPayload(TEST_PAYLOAD, ALT_SECRET);
    const headers = {
      'X-Orb-Signature': signature,
      'X-Orb-Timestamp': timestamp,
    };

    await expect(orbSync.processWebhook(TEST_PAYLOAD, headers)).rejects.toThrow();
  });

  it('should accept when signed with the primary secret and no alt is configured', async () => {
    const orbSync = new OrbSync({
      databaseUrl: process.env.DATABASE_URL!,
      orbWebhookSecret: PRIMARY_SECRET,
      verifyWebhookSignature: true,
      logger: pino({ level: 'silent' }),
    });

    const { signature, timestamp } = signPayload(TEST_PAYLOAD, PRIMARY_SECRET);
    const headers = {
      'X-Orb-Signature': signature,
      'X-Orb-Timestamp': timestamp,
    };

    // processWebhook should not throw, signature is valid
    await expect(orbSync.processWebhook(TEST_PAYLOAD, headers)).resolves.not.toThrow();
  });
});

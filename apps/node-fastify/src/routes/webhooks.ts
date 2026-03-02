import type { FastifyInstance } from 'fastify';
import prometheus from '../prometheus';

export default async function routes(fastify: FastifyInstance) {
  fastify.post('/webhooks', {
    bodyLimit: 10e6, // 10 MB
    handler: async (request, reply) => {
      const headers = request.headers;
      const body: { raw: Buffer } = request.body as { raw: Buffer };

      const { eventType, timeSinceEventCreatedMs } = await fastify.orbSync.processWebhook(body.raw.toString(), headers);

      prometheus.metrics.webhooksProcessedCounter.inc({ event: eventType });
      prometheus.metrics.webhookDelayMsHistogram.observe({ event: eventType }, timeSinceEventCreatedMs);

      return reply.send({ received: true });
    },
  });
}

import type { FastifyInstance } from 'fastify';

export default async function routes(fastify: FastifyInstance) {
  fastify.post('/webhooks', {
    bodyLimit: 5e6, // 5 MB
    handler: async (request, reply) => {
      const headers = request.headers;
      const body: { raw: Buffer } = request.body as { raw: Buffer };

      await fastify.orbSync.processWebhook(body.raw.toString(), headers);

      return reply.send({ received: true });
    },
  });
}

import { Static, Type } from '@fastify/type-provider-typebox';
import type { FastifyInstance } from 'fastify';
import { verifyApiKey } from '../utils/verifyApiKey';

const SchemaRequestParamsSyncCreditNotes = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
});

const SchemaRequestParamsSyncCustomers = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  createdAtGt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtGte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
});

const SchemaRequestParamsSyncSubscriptions = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  createdAtGt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtGte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
});

const SchemaRequestParamsSyncInvoices = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  createdAtGt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtGte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
});

const SchemaRequestParamsSyncPlans = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100 })),
  createdAtGt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtGte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLt: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
  createdAtLte: Type.Optional(
    Type.String({
      format: 'date-time',
    })
  ),
});

export default async function routes(fastify: FastifyInstance) {
  fastify.post<{
    Querystring: Static<typeof SchemaRequestParamsSyncCreditNotes>;
  }>('/sync/credit_notes', {
    preHandler: [verifyApiKey],
    schema: {
      querystring: SchemaRequestParamsSyncCreditNotes,
    },
    handler: async (request, reply) => {
      const query = request.query;

      const count = await fastify.orbSync.sync('credit_notes', { limit: query.limit });

      return reply.send({ count });
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/sync/credit_notes/:id', {
    preHandler: [verifyApiKey],
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      await fastify.orbSync.syncSingleEntity('credit_notes', request.params.id);

      return reply.status(204).send();
    },
  });

  fastify.post<{
    Querystring: Static<typeof SchemaRequestParamsSyncCustomers>;
  }>('/sync/customers', {
    preHandler: [verifyApiKey],
    schema: {
      querystring: SchemaRequestParamsSyncCustomers,
    },
    handler: async (request, reply) => {
      const query = request.query;

      const count = await fastify.orbSync.sync('customers', {
        limit: query.limit,
        createdAtGt: query.createdAtGt,
        createdAtGte: query.createdAtGte,
        createdAtLt: query.createdAtLt,
        createdAtLte: query.createdAtLte,
      });

      return reply.send({ count });
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/sync/customers/:id', {
    preHandler: [verifyApiKey],
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      await fastify.orbSync.syncSingleEntity('customers', request.params.id);

      return reply.status(204).send();
    },
  });

  fastify.post<{
    Querystring: Static<typeof SchemaRequestParamsSyncSubscriptions>;
  }>('/sync/subscriptions', {
    preHandler: [verifyApiKey],
    schema: {
      querystring: SchemaRequestParamsSyncSubscriptions,
    },
    handler: async (request, reply) => {
      const query = request.query;

      const count = await fastify.orbSync.sync('subscriptions', {
        limit: query.limit,
        createdAtGt: query.createdAtGt,
        createdAtGte: query.createdAtGte,
        createdAtLt: query.createdAtLt,
        createdAtLte: query.createdAtLte,
      });

      return reply.send({ count });
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/sync/subscriptions/:id', {
    preHandler: [verifyApiKey],
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      await fastify.orbSync.syncSingleEntity('subscriptions', request.params.id);

      return reply.status(204).send();
    },
  });

  fastify.post<{
    Querystring: Static<typeof SchemaRequestParamsSyncInvoices>;
  }>('/sync/invoices', {
    preHandler: [verifyApiKey],
    schema: {
      querystring: SchemaRequestParamsSyncInvoices,
    },
    handler: async (request, reply) => {
      const query = request.query;

      const count = await fastify.orbSync.sync('invoices', {
        limit: query.limit,
        createdAtGt: query.createdAtGt,
        createdAtGte: query.createdAtGte,
        createdAtLt: query.createdAtLt,
        createdAtLte: query.createdAtLte,
      });

      return reply.send({ count });
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/sync/invoices/:id', {
    preHandler: [verifyApiKey],
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      await fastify.orbSync.syncSingleEntity('invoices', request.params.id);

      return reply.status(204).send();
    },
  });

  fastify.post<{
    Querystring: Static<typeof SchemaRequestParamsSyncPlans>;
  }>('/sync/plans', {
    preHandler: [verifyApiKey],
    schema: {
      querystring: SchemaRequestParamsSyncPlans,
    },
    handler: async (request, reply) => {
      const query = request.query;

      const count = await fastify.orbSync.sync('plans', {
        limit: query.limit,
        createdAtGt: query.createdAtGt,
        createdAtGte: query.createdAtGte,
        createdAtLt: query.createdAtLt,
        createdAtLte: query.createdAtLte,
      });

      return reply.send({ count });
    },
  });

  fastify.post<{
    Params: { id: string };
  }>('/sync/plans/:id', {
    preHandler: [verifyApiKey],
    schema: {
      params: Type.Object({
        id: Type.String(),
      }),
    },
    handler: async (request, reply) => {
      await fastify.orbSync.syncSingleEntity('plans', request.params.id);

      return reply.status(204).send();
    },
  });
}

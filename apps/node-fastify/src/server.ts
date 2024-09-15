import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { getConfig } from './utils/config';
import { logger } from './utils/logger';

const main = async () => {
  const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = await createApp({
    logger,
    disableRequestLogging: true,
    requestIdHeader: 'Request-Id',
  });

  app.withTypeProvider<TypeBoxTypeProvider>();

  const config = getConfig();

  // Start the server
  app.listen({ port: config.PORT, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
};

main();

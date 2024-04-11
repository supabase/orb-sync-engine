import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';
import pino from 'pino';

const logger = pino({
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

const main = async () => {
  const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = await createApp({
    logger,
    disableRequestLogging: true,
    requestIdHeader: 'Request-Id',
  });

  // Init config
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;

  // Start the server
  app.listen({ port: Number(port), host: '0.0.0.0' }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
};

main();

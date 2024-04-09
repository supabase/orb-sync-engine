import { OrbSync } from 'orb-sync-lib';

declare module 'fastify' {
  interface FastifyInstance {
    orbSync: OrbSync;
  }
}

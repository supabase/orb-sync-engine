import { OrbSync } from '@supabase/orb-sync-lib';

declare module 'fastify' {
  interface FastifyInstance {
    orbSync: OrbSync;
  }
}

import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import { getConfig } from './config';
import { timingSafeEqual } from 'node:crypto';

export const verifyApiKey = (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): unknown => {
  const config = getConfig();

  if (!request.headers || !request.headers.authorization) {
    return reply.code(401).send('Unauthorized');
  }
  const { authorization } = request.headers;

  if (!apiKeyMatches(authorization, config.API_KEY_SYNC) && !apiKeyMatches(authorization, config.API_KEY_SYNC_ALT)) {
    return reply.code(401).send('Unauthorized');
  }

  done();
};

export function apiKeyMatches(authorization: string, apiKey: string | undefined): boolean {
  if (!apiKey) return false;
  if (!authorization) return false;
  if (authorization.length > apiKey.length) return false;

  // timingSafeEqual needs both buffers to be the same length
  const sameLengthAuth = authorization.padEnd(apiKey.length, ' ');

  return timingSafeEqual(Buffer.from(sameLengthAuth), Buffer.from(apiKey));
}

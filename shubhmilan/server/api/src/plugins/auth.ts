import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';

import { Profile } from '../db.js';
import { fail } from '../lib/response.js';
import { verifyAccessToken, type AccessTokenClaims } from '../lib/tokens.js';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AccessTokenClaims;
    profileId?: string;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('auth', undefined);
  app.decorateRequest('profileId', undefined);

  app.decorate(
    'requireAuth',
    async (request: FastifyRequest, reply: Parameters<typeof fail>[0]) => {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        return fail(reply, 401, 'UNAUTHENTICATED', 'Missing access token');
      }
      try {
        const claims = verifyAccessToken(header.slice(7));
        request.auth = claims;
        const profile = await Profile.findOne({
          where: { userId: claims.sub },
          attributes: ['id'],
        });
        request.profileId = profile?.id;
      } catch {
        return fail(reply, 401, 'UNAUTHENTICATED', 'Invalid or expired token');
      }
    },
  );

  app.decorate(
    'requireRole',
    (role: 'ADMIN' | 'SUPERADMIN') =>
      async (request: FastifyRequest, reply: Parameters<typeof fail>[0]) => {
        if (!request.auth) return fail(reply, 401, 'UNAUTHENTICATED', 'Not authenticated');
        if (role === 'ADMIN' && request.auth.role === 'USER') {
          return fail(reply, 403, 'FORBIDDEN', 'Admin only');
        }
        if (role === 'SUPERADMIN' && request.auth.role !== 'SUPERADMIN') {
          return fail(reply, 403, 'FORBIDDEN', 'Superadmin only');
        }
      },
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    requireAuth: (
      request: FastifyRequest,
      reply: Parameters<typeof fail>[0],
    ) => Promise<unknown>;
    requireRole: (
      role: 'ADMIN' | 'SUPERADMIN',
    ) => (request: FastifyRequest, reply: Parameters<typeof fail>[0]) => Promise<unknown>;
  }
}

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';

import { env } from './env.js';
import { fail } from './lib/response.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { chatRoutes } from './routes/chat.js';
import { interestRoutes } from './routes/interests.js';
import { matchRoutes } from './routes/matches.js';
import { meRoutes } from './routes/me.js';
import { planRoutes } from './routes/plans.js';
import { profileRoutes } from './routes/profiles.js';

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
        : true,
    trustProxy: true,
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL, /localhost:\d+$/],
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });
  await app.register(authPlugin);

  // Health
  app.get('/health', async (_, reply) => reply.send({ ok: true, data: { status: 'healthy' } }));

  // v1 mount
  await app.register(
    async (v1) => {
      // Tighter rate limit on auth routes (§6 Security requirements).
      await v1.register(
        async (authScope) => {
          await authScope.register(rateLimit, { max: 5, timeWindow: '1 minute' });
          await authRoutes(authScope);
        },
        { prefix: '/auth' },
      );

      await v1.register(meRoutes, { prefix: '/me' });
      await v1.register(profileRoutes, { prefix: '/profiles' });
      await v1.register(matchRoutes, { prefix: '/matches' });
      await v1.register(interestRoutes, { prefix: '/interests' });
      await v1.register(chatRoutes);
      await v1.register(planRoutes, { prefix: '/plans' });
    },
    { prefix: '/api/v1' },
  );

  app.setNotFoundHandler((_, reply) => fail(reply, 404, 'NOT_FOUND', 'Route not found'));
  app.setErrorHandler((err, _req, reply) => {
    app.log.error(err);
    return fail(reply, 500, 'INTERNAL', err.message || 'Internal error');
  });

  return app;
}

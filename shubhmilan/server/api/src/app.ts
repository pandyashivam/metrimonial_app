import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';

import { env } from './env.js';
import { fail } from './lib/response.js';
import { authPlugin } from './plugins/auth.js';
import { adminRoutes } from './routes/admin.js';
import { aiRoutes } from './routes/ai.js';
import { authRoutes } from './routes/auth.js';
import { chatRoutes } from './routes/chat.js';
import { deviceRoutes } from './routes/devices.js';
import { interactionRoutes } from './routes/interactions.js';
import { interestRoutes } from './routes/interests.js';
import { keyRoutes } from './routes/keys.js';
import { matchRoutes } from './routes/matches.js';
import { meRoutes } from './routes/me.js';
import { paymentRoutes } from './routes/payments.js';
import { photoRoutes } from './routes/photos.js';
import { planRoutes } from './routes/plans.js';
import { profileRoutes } from './routes/profiles.js';
import { verificationRoutes } from './routes/verification.js';

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? { transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } } }
        : true,
    trustProxy: true,
    bodyLimit: 10 * 1024 * 1024,
  });

  await app.register(sensible);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL, /localhost:\d+$/],
    credentials: true,
  });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
  await app.register(authPlugin);

  app.get('/health', async (_, reply) => reply.send({ ok: true, data: { status: 'healthy' } }));

  await app.register(
    async (v1) => {
      // Tighter rate limit on auth routes (spec §6).
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
      await v1.register(verificationRoutes, { prefix: '/me/verification' });
      await v1.register(aiRoutes, { prefix: '/ai' });
      await v1.register(chatRoutes);
      await v1.register(planRoutes, { prefix: '/plans' });
      await v1.register(paymentRoutes);
      await v1.register(photoRoutes);
      await v1.register(keyRoutes);
      await v1.register(deviceRoutes);
      await v1.register(interactionRoutes);

      await v1.register(adminRoutes, { prefix: '/admin' });
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

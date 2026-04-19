import { createServer } from 'node:http';
import { Server as SocketIoServer } from 'socket.io';

import { buildApp } from './app.js';
import { shutdownDb } from './db.js';
import { env } from './env.js';
import { verifyAccessToken } from './lib/tokens.js';

async function main() {
  const app = await buildApp();

  const httpServer = createServer(app.server as unknown as Parameters<typeof createServer>[1]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const io = new SocketIoServer(httpServer as any, {
    cors: { origin: [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL, /localhost:\d+$/] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Unauthenticated'));
    try {
      const claims = verifyAccessToken(token);
      socket.data.userId = claims.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (conversationId: string) => socket.join(`conv:${conversationId}`));
    socket.on('typing', ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      socket
        .to(`conv:${conversationId}`)
        .emit('typing', { conversationId, profileId: socket.data.userId, isTyping });
    });
  });

  (app as unknown as { io: SocketIoServer }).io = io;

  await app.ready();
  await app.listen({ port: env.API_PORT, host: env.API_HOST });
  app.log.info(`ShubhMilan API listening on http://${env.API_HOST}:${env.API_PORT}`);

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down…`);
    await app.close();
    await shutdownDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal startup error:', err);
  process.exit(1);
});

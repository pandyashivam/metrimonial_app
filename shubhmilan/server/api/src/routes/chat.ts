import { ListMessagesQuery, SendMessageInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/conversations', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const convos = await prisma.conversation.findMany({
      where: {
        OR: [{ profileAId: request.profileId }, { profileBId: request.profileId }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        profileA: { select: { id: true, fullName: true } },
        profileB: { select: { id: true, fullName: true } },
      },
    });
    const mapped = convos.map((c) => {
      const peer = c.profileAId === request.profileId ? c.profileB : c.profileA;
      return {
        id: c.id,
        profileAId: c.profileAId,
        profileBId: c.profileBId,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
        peerName: peer.fullName,
        peerPhotoUrl: null,
        unreadCount: 0,
      };
    });
    return ok(reply, mapped);
  });

  app.get<{ Params: { id: string }; Querystring: Record<string, string> }>(
    '/conversations/:id/messages',
    async (request, reply) => {
      const parsed = ListMessagesQuery.safeParse(request.query);
      if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid query');

      const convo = await prisma.conversation.findUnique({ where: { id: request.params.id } });
      if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
      if (
        convo.profileAId !== request.profileId &&
        convo.profileBId !== request.profileId
      ) {
        return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
      }

      const { limit, cursor } = parsed.data;
      const take = limit + 1;
      const messages = await prisma.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: 'desc' },
        take,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      const hasMore = messages.length > limit;
      const items = messages.slice(0, limit);
      return ok(reply, {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
        hasMore,
      });
    },
  );

  app.post<{ Params: { id: string } }>('/conversations/:id/messages', async (request, reply) => {
    const parsed = SendMessageInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');

    const convo = await prisma.conversation.findUnique({ where: { id: request.params.id } });
    if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
    if (
      convo.profileAId !== request.profileId &&
      convo.profileBId !== request.profileId
    ) {
      return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convo.id,
        senderProfileId: request.profileId,
        body: parsed.data.body,
        mediaUrl: parsed.data.mediaUrl ?? null,
      },
    });
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: message.createdAt },
    });
    // Socket.IO broadcast is handled by the realtime layer; we emit from here if app.io is mounted.
    const io = (app as unknown as { io?: { to: (room: string) => { emit: (ev: string, payload: unknown) => void } } }).io;
    io?.to(`conv:${convo.id}`).emit('message:new', message);
    return ok(reply, message, 201);
  });
}

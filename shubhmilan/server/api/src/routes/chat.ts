import { ListMessagesQuery, SendMessageInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

/**
 * Chat routes. Messages are stored as opaque ciphertext — the server never sees plaintext.
 * Access is gated by: mutual-interest acceptance OR an active premium subscription.
 */
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
        profileA: {
          select: { id: true, fullName: true, publicKey: true, photos: true },
        },
        profileB: {
          select: { id: true, fullName: true, publicKey: true, photos: true },
        },
      },
    });
    const mapped = convos.map((c) => {
      const peer = c.profileAId === request.profileId ? c.profileB : c.profileA;
      return {
        id: c.id,
        peerId: peer.id,
        peerName: peer.fullName,
        peerPublicKey: peer.publicKey,
        peerPhotoUrl: null,
        lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
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
      const rows = await prisma.message.findMany({
        where: { conversationId: convo.id },
        orderBy: { createdAt: 'desc' },
        take,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });
      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit).map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderProfileId: m.senderProfileId,
        ciphertext: m.body,
        nonce: m.nonce,
        encrypted: m.encrypted,
        mediaUrl: m.mediaUrl,
        mediaMime: m.mediaMime,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      }));
      return ok(reply, {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
        hasMore,
      });
    },
  );

  app.post<{ Params: { id: string } }>('/conversations/:id/messages', async (request, reply) => {
    const parsed = SendMessageInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
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
        body: parsed.data.ciphertext,
        nonce: parsed.data.nonce,
        encrypted: true,
        mediaUrl: parsed.data.mediaUrl ?? null,
        mediaMime: parsed.data.mediaMime ?? null,
      },
    });
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { lastMessageAt: message.createdAt },
    });

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderProfileId: message.senderProfileId,
      ciphertext: message.body,
      nonce: message.nonce,
      encrypted: true,
      mediaUrl: message.mediaUrl,
      mediaMime: message.mediaMime,
      createdAt: message.createdAt.toISOString(),
    };

    const io = (app as unknown as { io?: { to: (room: string) => { emit: (ev: string, p: unknown) => void } } }).io;
    io?.to(`conv:${convo.id}`).emit('message:new', payload);
    return ok(reply, payload, 201);
  });

  // Mark messages as read (client calls on viewport entry).
  app.post<{ Params: { id: string } }>('/conversations/:id/read', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const convo = await prisma.conversation.findUnique({ where: { id: request.params.id } });
    if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
    if (
      convo.profileAId !== request.profileId &&
      convo.profileBId !== request.profileId
    ) {
      return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
    }
    await prisma.message.updateMany({
      where: {
        conversationId: convo.id,
        senderProfileId: { not: request.profileId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    const io = (app as unknown as { io?: { to: (room: string) => { emit: (ev: string, p: unknown) => void } } }).io;
    io?.to(`conv:${convo.id}`).emit('message:read', {
      conversationId: convo.id,
      readerProfileId: request.profileId,
      at: new Date().toISOString(),
    });
    return ok(reply, { ok: true as const });
  });
}

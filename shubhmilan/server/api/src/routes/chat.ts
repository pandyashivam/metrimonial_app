import { ListMessagesQuery, SendMessageInput } from '@shubhmilan/validation';
import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';

import { Interest, Conversation, Message, Profile } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { resolveEntitlements } from '../services/plans.js';
import { pushNewMessage } from '../services/push.js';

async function canChat(meUserId: string, meProfileId: string, peerProfileId: string): Promise<boolean> {
  const ent = await resolveEntitlements(meUserId, meProfileId);
  if (ent.canChatBeforeMatch) return true;
  const accepted = await Interest.findOne({
    where: {
      status: 'ACCEPTED',
      [Op.or]: [
        { fromProfileId: meProfileId, toProfileId: peerProfileId },
        { fromProfileId: peerProfileId, toProfileId: meProfileId },
      ],
    },
    attributes: ['id'],
  });
  return !!accepted;
}

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/conversations', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const convos = await Conversation.findAll({
      where: {
        [Op.or]: [{ profileAId: request.profileId }, { profileBId: request.profileId }],
      },
      order: [['lastMessageAt', 'DESC']],
      include: [
        { model: Profile, as: 'profileA', attributes: ['id', 'fullName', 'publicKey'] },
        { model: Profile, as: 'profileB', attributes: ['id', 'fullName', 'publicKey'] },
      ],
    });
    const mapped = convos.map((c) => {
      const peer = c.profileAId === request.profileId ? c.profileB! : c.profileA!;
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

      const convo = await Conversation.findByPk(request.params.id);
      if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
      if (convo.profileAId !== request.profileId && convo.profileBId !== request.profileId) {
        return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
      }

      const { limit, cursor } = parsed.data;
      const take = limit + 1;
      const where: Record<string, unknown> = { conversationId: convo.id };
      if (cursor) where.id = { [Op.lt]: cursor };

      const rows = await Message.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: take,
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
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');

    const convo = await Conversation.findByPk(request.params.id);
    if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
    if (convo.profileAId !== request.profileId && convo.profileBId !== request.profileId) {
      return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
    }

    const peerProfileId = convo.profileAId === request.profileId ? convo.profileBId : convo.profileAId;
    if (!(await canChat(request.auth!.sub, request.profileId, peerProfileId))) {
      return fail(reply, 402, 'CHAT_LOCKED',
        'Chat is unlocked after mutual interest acceptance, or with a Gold subscription');
    }

    const message = await Message.create({
      conversationId: convo.id,
      senderProfileId: request.profileId,
      body: parsed.data.ciphertext,
      nonce: parsed.data.nonce,
      encrypted: true,
      mediaUrl: parsed.data.mediaUrl ?? null,
      mediaMime: parsed.data.mediaMime ?? null,
    });
    await convo.update({ lastMessageAt: message.createdAt });

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

    const [sender, peer] = await Promise.all([
      Profile.findByPk(request.profileId, { attributes: ['fullName'] }),
      Profile.findByPk(peerProfileId, { attributes: ['userId'] }),
    ]);
    if (peer?.userId && sender?.fullName) {
      void pushNewMessage(peer.userId, sender.fullName, convo.id);
    }
    return ok(reply, payload, 201);
  });

  app.post<{ Params: { id: string } }>('/conversations/:id/read', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const convo = await Conversation.findByPk(request.params.id);
    if (!convo) return fail(reply, 404, 'NOT_FOUND', 'Conversation not found');
    if (convo.profileAId !== request.profileId && convo.profileBId !== request.profileId) {
      return fail(reply, 403, 'FORBIDDEN', 'Not a participant');
    }
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          conversationId: convo.id,
          senderProfileId: { [Op.ne]: request.profileId },
          readAt: null,
        },
      },
    );
    const io = (app as unknown as { io?: { to: (room: string) => { emit: (ev: string, p: unknown) => void } } }).io;
    io?.to(`conv:${convo.id}`).emit('message:read', {
      conversationId: convo.id,
      readerProfileId: request.profileId,
      at: new Date().toISOString(),
    });
    return ok(reply, { ok: true as const });
  });
}

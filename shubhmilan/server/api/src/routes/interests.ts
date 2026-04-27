import { RespondInterestInput, SendInterestInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { Interest, Profile, Conversation } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { resolveEntitlements } from '../services/plans.js';
import { pushInterestAccepted, pushNewInterest } from '../services/push.js';

export async function interestRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.post('/', async (request, reply) => {
    const parsed = SendInterestInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (parsed.data.toProfileId === request.profileId) {
      return fail(reply, 400, 'SELF_INTEREST', 'Cannot send interest to yourself');
    }

    const ent = await resolveEntitlements(request.auth!.sub, request.profileId);
    if (!ent.canSendMoreInterests) {
      return fail(reply, 402, 'PLAN_LIMIT',
        'Monthly interest limit reached — upgrade to Silver or higher',
        { tier: ent.tier, remaining: 0 },
      );
    }

    const existing = await Interest.findOne({
      where: { fromProfileId: request.profileId, toProfileId: parsed.data.toProfileId },
    });
    if (existing) return ok(reply, existing);

    const interest = await Interest.create({
      fromProfileId: request.profileId,
      toProfileId: parsed.data.toProfileId,
      note: parsed.data.note,
    });

    const [fromProfile, toProfile] = await Promise.all([
      Profile.findByPk(request.profileId, { attributes: ['fullName'] }),
      Profile.findByPk(parsed.data.toProfileId, { attributes: ['userId'] }),
    ]);
    if (toProfile?.userId && fromProfile?.fullName) {
      void pushNewInterest(toProfile.userId, fromProfile.fullName);
    }
    return ok(reply, interest, 201);
  });

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = RespondInterestInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const interest = await Interest.findByPk(request.params.id);
    if (!interest) return fail(reply, 404, 'NOT_FOUND', 'Interest not found');

    const isRecipient = interest.toProfileId === request.profileId;
    const isSender = interest.fromProfileId === request.profileId;

    if (parsed.data.action === 'WITHDRAW' && !isSender) {
      return fail(reply, 403, 'FORBIDDEN', 'Only sender can withdraw');
    }
    if ((parsed.data.action === 'ACCEPT' || parsed.data.action === 'DECLINE') && !isRecipient) {
      return fail(reply, 403, 'FORBIDDEN', 'Only recipient can respond');
    }

    const statusMap = { ACCEPT: 'ACCEPTED', DECLINE: 'DECLINED', WITHDRAW: 'WITHDRAWN' } as const;
    await interest.update({ status: statusMap[parsed.data.action], respondedAt: new Date() });

    if (interest.status === 'ACCEPTED') {
      const [a, b] =
        interest.fromProfileId < interest.toProfileId
          ? [interest.fromProfileId, interest.toProfileId]
          : [interest.toProfileId, interest.fromProfileId];
      try {
        await Conversation.findOrCreate({
          where: { profileAId: a, profileBId: b },
          defaults: { profileAId: a, profileBId: b },
        });
      } catch (err) {
        const name = (err as { name?: string }).name;
        if (name !== 'SequelizeUniqueConstraintError') {
          request.log.error({ err }, 'failed to open conversation');
        }
      }

      const [from, recipientProfile] = await Promise.all([
        Profile.findByPk(interest.fromProfileId, { attributes: ['userId'] }),
        Profile.findByPk(interest.toProfileId, { attributes: ['fullName'] }),
      ]);
      if (from?.userId && recipientProfile?.fullName) {
        void pushInterestAccepted(from.userId, recipientProfile.fullName);
      }
    }
    return ok(reply, interest);
  });

  app.get('/sent', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const list = await Interest.findAll({
      where: { fromProfileId: request.profileId },
      order: [['sentAt', 'DESC']],
      limit: 50,
    });
    return ok(reply, list);
  });

  app.get('/received', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const list = await Interest.findAll({
      where: { toProfileId: request.profileId },
      order: [['sentAt', 'DESC']],
      limit: 50,
    });
    return ok(reply, list);
  });

  app.get('/entitlements', async (request, reply) => {
    const ent = await resolveEntitlements(request.auth!.sub, request.profileId);
    return ok(reply, ent);
  });
}

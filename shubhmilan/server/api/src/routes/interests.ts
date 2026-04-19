import { RespondInterestInput, SendInterestInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

export async function interestRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.post('/', async (request, reply) => {
    const parsed = SendInterestInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (parsed.data.toProfileId === request.profileId) {
      return fail(reply, 400, 'SELF_INTEREST', 'Cannot send interest to yourself');
    }

    const existing = await prisma.interest.findUnique({
      where: {
        fromProfileId_toProfileId: {
          fromProfileId: request.profileId,
          toProfileId: parsed.data.toProfileId,
        },
      },
    });
    if (existing) return ok(reply, existing);

    const interest = await prisma.interest.create({
      data: {
        fromProfileId: request.profileId,
        toProfileId: parsed.data.toProfileId,
        note: parsed.data.note,
      },
    });
    return ok(reply, interest, 201);
  });

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = RespondInterestInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const interest = await prisma.interest.findUnique({ where: { id: request.params.id } });
    if (!interest) return fail(reply, 404, 'NOT_FOUND', 'Interest not found');

    const isRecipient = interest.toProfileId === request.profileId;
    const isSender = interest.fromProfileId === request.profileId;

    if (parsed.data.action === 'WITHDRAW' && !isSender) {
      return fail(reply, 403, 'FORBIDDEN', 'Only sender can withdraw');
    }
    if ((parsed.data.action === 'ACCEPT' || parsed.data.action === 'DECLINE') && !isRecipient) {
      return fail(reply, 403, 'FORBIDDEN', 'Only recipient can respond');
    }

    const statusMap = {
      ACCEPT: 'ACCEPTED',
      DECLINE: 'DECLINED',
      WITHDRAW: 'WITHDRAWN',
    } as const;

    const updated = await prisma.interest.update({
      where: { id: interest.id },
      data: { status: statusMap[parsed.data.action], respondedAt: new Date() },
    });

    if (updated.status === 'ACCEPTED') {
      const [a, b] =
        updated.fromProfileId < updated.toProfileId
          ? [updated.fromProfileId, updated.toProfileId]
          : [updated.toProfileId, updated.fromProfileId];
      await prisma.conversation
        .upsert({
          where: { profileAId_profileBId: { profileAId: a, profileBId: b } },
          update: {},
          create: { profileAId: a, profileBId: b },
        })
        .catch(() => null);
    }
    return ok(reply, updated);
  });

  app.get('/sent', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const list = await prisma.interest.findMany({
      where: { fromProfileId: request.profileId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    return ok(reply, list);
  });

  app.get('/received', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const list = await prisma.interest.findMany({
      where: { toProfileId: request.profileId },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
    return ok(reply, list);
  });
}

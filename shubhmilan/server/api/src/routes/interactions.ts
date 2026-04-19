import { BlockInput, ReportInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

/**
 * Composite route module: shortlist, block, report, views. All mounted at /api/v1/* via app.ts.
 * Every handler is auth-gated and derives the acting profile from request.profileId.
 */
export async function interactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  // ---------------- Shortlist ----------------
  app.post<{ Params: { profileId: string } }>('/shortlist/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (request.params.profileId === request.profileId) {
      return fail(reply, 400, 'SELF_SHORTLIST', 'Cannot shortlist yourself');
    }
    await prisma.shortlist
      .create({
        data: {
          ownerProfileId: request.profileId,
          savedProfileId: request.params.profileId,
        },
      })
      .catch(() => null);
    return ok(reply, { ok: true as const });
  });

  app.delete<{ Params: { profileId: string } }>('/shortlist/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.shortlist.deleteMany({
      where: {
        ownerProfileId: request.profileId,
        savedProfileId: request.params.profileId,
      },
    });
    return ok(reply, { ok: true as const });
  });

  app.get('/shortlist', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const rows = await prisma.shortlist.findMany({
      where: { ownerProfileId: request.profileId },
      orderBy: { savedAt: 'desc' },
      include: {
        savedProfile: {
          select: {
            id: true,
            fullName: true,
            city: true,
            religion: true,
            caste: true,
            education: true,
            occupation: true,
          },
        },
      },
    });
    return ok(reply, rows.map((r) => ({ ...r.savedProfile, savedAt: r.savedAt.toISOString() })));
  });

  // ---------------- Block ----------------
  app.post<{ Params: { profileId: string }; Body: { reason?: string } }>(
    '/block/:profileId',
    async (request, reply) => {
      const parsed = BlockInput.safeParse(request.body ?? {});
      if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
      if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
      if (request.params.profileId === request.profileId) {
        return fail(reply, 400, 'SELF_BLOCK', 'Cannot block yourself');
      }
      await prisma.block
        .create({
          data: {
            blockerProfileId: request.profileId,
            blockedProfileId: request.params.profileId,
            reason: parsed.data.reason,
          },
        })
        .catch(() => null);
      return ok(reply, { ok: true as const });
    },
  );

  app.delete<{ Params: { profileId: string } }>('/block/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.block.deleteMany({
      where: {
        blockerProfileId: request.profileId,
        blockedProfileId: request.params.profileId,
      },
    });
    return ok(reply, { ok: true as const });
  });

  // ---------------- Report ----------------
  app.post<{ Params: { profileId: string } }>('/report/:profileId', async (request, reply) => {
    const parsed = ReportInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const report = await prisma.report.create({
      data: {
        reporterProfileId: request.profileId,
        reportedProfileId: request.params.profileId,
        reason: parsed.data.reason,
        detail: parsed.data.detail,
      },
    });
    return ok(reply, report, 201);
  });

  // ---------------- Profile view (idempotent per day) ----------------
  app.post<{ Params: { profileId: string } }>('/views/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (request.params.profileId === request.profileId) return ok(reply, { skipped: true });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = await prisma.profileView.findFirst({
      where: {
        viewerProfileId: request.profileId,
        viewedProfileId: request.params.profileId,
        viewedAt: { gte: todayStart },
      },
    });
    if (existing) return ok(reply, { alreadyLogged: true });
    await prisma.profileView.create({
      data: {
        viewerProfileId: request.profileId,
        viewedProfileId: request.params.profileId,
      },
    });
    return ok(reply, { ok: true as const });
  });

  // ---------------- Who viewed me ----------------
  app.get('/me/viewers', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const rows = await prisma.profileView.findMany({
      where: { viewedProfileId: request.profileId },
      orderBy: { viewedAt: 'desc' },
      take: 50,
      include: {
        viewer: { select: { id: true, fullName: true, city: true } },
      },
    });
    return ok(reply, rows.map((r) => ({ ...r.viewer, viewedAt: r.viewedAt.toISOString() })));
  });
}

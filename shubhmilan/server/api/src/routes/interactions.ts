import { BlockInput, ReportInput } from '@shubhmilan/validation';
import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';

import { Shortlist, Block, Report, ProfileView, Profile } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { resolveEntitlements } from '../services/plans.js';
import { pushProfileViewed } from '../services/push.js';

export async function interactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  // ---------------- Shortlist ----------------
  app.post<{ Params: { profileId: string } }>('/shortlist/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (request.params.profileId === request.profileId) {
      return fail(reply, 400, 'SELF_SHORTLIST', 'Cannot shortlist yourself');
    }
    await Shortlist.create({
      ownerProfileId: request.profileId,
      savedProfileId: request.params.profileId,
    }).catch(() => null);
    return ok(reply, { ok: true as const });
  });

  app.delete<{ Params: { profileId: string } }>('/shortlist/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await Shortlist.destroy({
      where: {
        ownerProfileId: request.profileId,
        savedProfileId: request.params.profileId,
      },
    });
    return ok(reply, { ok: true as const });
  });

  app.get('/shortlist', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const rows = await Shortlist.findAll({
      where: { ownerProfileId: request.profileId },
      order: [['savedAt', 'DESC']],
      include: [{
        model: Profile,
        as: 'savedProfile',
        attributes: ['id', 'fullName', 'city', 'religion', 'caste', 'education', 'occupation'],
      }],
    });
    return ok(reply, rows.map((r) => ({ ...r.savedProfile!.get({ plain: true }), savedAt: r.savedAt!.toISOString() })));
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
      await Block.create({
        blockerProfileId: request.profileId,
        blockedProfileId: request.params.profileId,
        reason: parsed.data.reason,
      }).catch(() => null);
      return ok(reply, { ok: true as const });
    },
  );

  app.delete<{ Params: { profileId: string } }>('/block/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await Block.destroy({
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
    const report = await Report.create({
      reporterProfileId: request.profileId,
      reportedProfileId: request.params.profileId,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    });
    return ok(reply, report, 201);
  });

  // ---------------- Profile view (idempotent per day) ----------------
  app.post<{ Params: { profileId: string } }>('/views/:profileId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    if (request.params.profileId === request.profileId) return ok(reply, { skipped: true });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = await ProfileView.findOne({
      where: {
        viewerProfileId: request.profileId,
        viewedProfileId: request.params.profileId,
        viewedAt: { [Op.gte]: todayStart },
      },
    });
    if (existing) return ok(reply, { alreadyLogged: true });
    await ProfileView.create({
      viewerProfileId: request.profileId,
      viewedProfileId: request.params.profileId,
    });

    const viewed = await Profile.findByPk(request.params.profileId, { attributes: ['userId'] });
    if (viewed?.userId) void pushProfileViewed(viewed.userId);

    return ok(reply, { ok: true as const });
  });

  // ---------------- Who viewed me — Silver+ only ----------------
  app.get('/me/viewers', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const ent = await resolveEntitlements(request.auth!.sub, request.profileId);
    if (!ent.canSeeWhoViewedMe) {
      return fail(
        reply,
        402,
        'PLAN_REQUIRED',
        'Upgrade to Silver or higher to see who viewed your profile',
        { tier: ent.tier },
      );
    }
    const rows = await ProfileView.findAll({
      where: { viewedProfileId: request.profileId },
      order: [['viewedAt', 'DESC']],
      limit: 50,
      include: [{
        model: Profile,
        as: 'viewer',
        attributes: ['id', 'fullName', 'city'],
      }],
    });
    return ok(reply, rows.map((r) => ({ ...r.viewer!.get({ plain: true }), viewedAt: r.viewedAt!.toISOString() })));
  });
}

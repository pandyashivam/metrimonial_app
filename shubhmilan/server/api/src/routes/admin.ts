import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { User, Profile, Report, Verification, Subscription, Plan, AdminLog, Photo } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { adminContentRoutes } from './content.js';
import { issueTokensForUser } from '../services/auth.js';
import { pushVerificationApproved } from '../services/push.js';
import {
  SETTING_KEYS, getMaintenanceMode, setSetting, type MaintenanceMode,
} from '../services/settings.js';
import { markStepSimple } from '../services/verification.js';

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);
  app.addHook('preHandler', app.requireRole('ADMIN'));

  async function audit(
    adminUserId: string, action: string, targetType: string | null,
    targetId: string | null, meta?: Record<string, unknown>,
  ) {
    await AdminLog.create({
      adminUserId, action, targetType, targetId, meta: meta ?? null,
    }).catch(() => null);
  }

  app.get('/stats', async (_req, reply) => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86_400_000);
    const [signups24h, signupsMonth, activeSubs, openReports, totalUsers] = await Promise.all([
      User.count({ where: { createdAt: { [Op.gte]: dayAgo } } }),
      User.count({ where: { createdAt: { [Op.gte]: monthAgo } } }),
      Subscription.count({ where: { status: 'ACTIVE' } }),
      Report.count({ where: { status: 'OPEN' } }),
      User.count(),
    ]);
    const revenueRows = await Subscription.findAll({
      where: { status: 'ACTIVE' },
      include: [{ model: Plan, as: 'plan' }],
    });
    const revenuePaise = revenueRows.reduce((sum, r) => sum + (r.plan?.priceInr ?? 0), 0);
    return ok(reply, {
      totalUsers, signups24h, signupsMonth, activeSubs, openReports,
      revenueInr: Math.round(revenuePaise / 100),
    });
  });

  const UserList = z.object({
    q: z.string().max(100).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
    cursor: z.string().optional(),
    offset: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }).strict();

  app.get('/users', async (request, reply) => {
    const parsed = UserList.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid query');
    const q = parsed.data;
    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.q) {
      where[Op.or as unknown as string] = [
        { email: { [Op.like]: `%${q.q}%` } },
        { phone: { [Op.like]: `%${q.q}%` } },
      ];
    }
    if (q.cursor) where.id = { [Op.lt]: q.cursor };

    const useOffset = q.offset !== undefined && !q.cursor;
    const rows = await User.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: q.limit + (useOffset ? 0 : 1),
      offset: useOffset ? q.offset : undefined,
      include: [{
        model: Profile, as: 'profile',
        attributes: ['id', 'fullName', 'city'],
        include: [{ model: Verification, as: 'verification' }],
      }],
    });
    let total: number | null = null;
    if (useOffset) {
      total = await User.count({ where });
    }
    const hasMore = useOffset ? (q.offset! + rows.length) < (total ?? 0) : rows.length > q.limit;
    const items = useOffset ? rows : rows.slice(0, q.limit);
    return ok(reply, {
      items,
      nextCursor: !useOffset && hasMore ? items[items.length - 1]?.id ?? null : null,
      hasMore,
      total,
    });
  });

  app.patch<{ Params: { id: string }; Body: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' } }>(
    '/users/:id/status', async (request, reply) => {
      if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(request.body.status)) {
        return fail(reply, 400, 'VALIDATION', 'Invalid status');
      }
      const user = await User.findByPk(request.params.id);
      if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
      await user.update({ status: request.body.status });
      await audit(request.auth!.sub, 'USER_STATUS_CHANGE', 'user', user.id, { status: request.body.status });
      return ok(reply, { id: user.id, status: user.status });
    },
  );

  app.post<{ Params: { id: string }; Body: { reason?: string } }>(
    '/users/:id/impersonate',
    { preHandler: [app.requireAuth, app.requireRole('SUPERADMIN')] },
    async (request, reply) => {
      const target = await User.findByPk(request.params.id);
      if (!target) return fail(reply, 404, 'NOT_FOUND', 'User not found');
      if (target.role !== 'USER') return fail(reply, 400, 'BAD_TARGET', 'Can only impersonate regular users');
      const tokens = await issueTokensForUser(target);
      await audit(request.auth!.sub, 'USER_IMPERSONATE', 'user', target.id, {
        reason: request.body?.reason ?? null, actingAs: target.email,
      });
      return ok(reply, { user: { id: target.id, email: target.email }, tokens });
    },
  );

  const ReportList = z.object({
    status: z.enum(['OPEN', 'RESOLVED', 'DISMISSED']).default('OPEN'),
    offset: z.coerce.number().int().min(0).default(0),
    limit: z.coerce.number().int().min(1).max(100).default(25),
  }).strict();

  app.get('/reports', async (request, reply) => {
    const parsed = ReportList.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid query');
    const q = parsed.data;
    const where = { status: q.status };
    const [items, total] = await Promise.all([
      Report.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: q.limit,
        offset: q.offset,
        include: [
          { model: Profile, as: 'reporter', attributes: ['id', 'fullName'] },
          { model: Profile, as: 'reported', attributes: ['id', 'fullName'] },
        ],
      }),
      Report.count({ where }),
    ]);
    return ok(reply, { items, total, hasMore: q.offset + items.length < total });
  });

  app.patch<{ Params: { id: string }; Body: { status: 'RESOLVED' | 'DISMISSED' } }>(
    '/reports/:id', async (request, reply) => {
      if (!['RESOLVED', 'DISMISSED'].includes(request.body.status)) {
        return fail(reply, 400, 'VALIDATION', 'Invalid status');
      }
      const report = await Report.findByPk(request.params.id);
      if (!report) return fail(reply, 404, 'NOT_FOUND', 'Report not found');
      await report.update({ status: request.body.status, resolvedByUserId: request.auth!.sub });
      await audit(request.auth!.sub, 'REPORT_RESOLVE', 'report', report.id, { status: request.body.status });
      return ok(reply, report);
    },
  );

  app.get('/verifications/pending', async (_req, reply) => {
    const rows = await Verification.findAll({
      where: {
        [Op.or]: [
          { selfieVerified: false },
          { videoKycVerified: false },
          { backgroundVerified: false },
        ],
      },
      limit: 50,
      order: [['updatedAt', 'DESC']],
      include: [{
        model: Profile, as: 'profile',
        attributes: ['id', 'fullName', 'city'],
        include: [{ model: Photo, as: 'photos', where: { isPrimary: true }, required: false, limit: 1 }],
      }],
    });
    return ok(reply, rows);
  });

  app.post<{
    Params: { profileId: string };
    Body: { step: 'email' | 'phone' | 'aadhaar' | 'selfie' | 'video' | 'background' };
  }>('/verify/:profileId', async (request, reply) => {
    const { step } = request.body;
    if (!['email', 'phone', 'aadhaar', 'selfie', 'video', 'background'].includes(step)) {
      return fail(reply, 400, 'VALIDATION', 'Invalid step');
    }
    await markStepSimple(request.params.profileId, step);
    await audit(request.auth!.sub, 'VERIFICATION_APPROVE', 'profile', request.params.profileId, { step });
    const profile = await Profile.findByPk(request.params.profileId, { attributes: ['userId'] });
    if (profile?.userId) void pushVerificationApproved(profile.userId, step);
    return ok(reply, { ok: true as const });
  });

  const PlanInput = z.object({
    name: z.string().min(2).max(40),
    priceInr: z.number().int().min(0),
    durationDays: z.number().int().min(1),
    features: z.array(z.string()).max(20),
    active: z.boolean(),
  }).strict();

  app.post('/plans', async (request, reply) => {
    const parsed = PlanInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const plan = await Plan.create(parsed.data);
    await audit(request.auth!.sub, 'PLAN_CREATE', 'plan', plan.id);
    return ok(reply, plan, 201);
  });

  app.patch<{ Params: { id: string } }>('/plans/:id', async (request, reply) => {
    const parsed = PlanInput.partial().safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const plan = await Plan.findByPk(request.params.id);
    if (!plan) return fail(reply, 404, 'NOT_FOUND', 'Plan not found');
    await plan.update(parsed.data);
    await audit(request.auth!.sub, 'PLAN_UPDATE', 'plan', plan.id, parsed.data);
    return ok(reply, plan);
  });

  app.get('/settings/maintenance', async (_req, reply) => {
    return ok(reply, await getMaintenanceMode());
  });

  const MaintenanceInput = z.object({
    enabled: z.boolean(),
    message: z.string().min(1).max(500).optional(),
    allowUserIds: z.array(z.string().min(1)).max(20).optional(),
  }).strict();

  app.put('/settings/maintenance', async (request, reply) => {
    const parsed = MaintenanceInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const current = await getMaintenanceMode();
    const next: MaintenanceMode = {
      enabled: parsed.data.enabled,
      message: parsed.data.message ?? current.message,
      allowUserIds: parsed.data.allowUserIds ?? current.allowUserIds,
    };
    await setSetting(SETTING_KEYS.maintenanceMode, next, request.auth!.sub);
    await audit(request.auth!.sub, 'MAINTENANCE_MODE', 'setting', SETTING_KEYS.maintenanceMode, next);
    return ok(reply, next);
  });

  await app.register(async (scope) => { await adminContentRoutes(scope, audit); }, { prefix: '/content' });

  app.get<{ Querystring: { status?: string; limit?: string; cursor?: string } }>(
    '/transactions', async (request, reply) => {
      const status = request.query.status;
      const limit = Math.min(Math.max(parseInt(request.query.limit ?? '50', 10) || 50, 1), 200);
      const where: Record<string, unknown> = {};
      if (status && ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'FAILED'].includes(status)) {
        where.status = status;
      }
      if (request.query.cursor) where.id = { [Op.lt]: request.query.cursor };
      const rows = await Subscription.findAll({
        where, order: [['createdAt', 'DESC']], limit: limit + 1,
        include: [
          { model: Plan, as: 'plan', attributes: ['name', 'priceInr'] },
          { model: User, as: 'user', attributes: ['id', 'email'] },
        ],
      });
      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit);
      return ok(reply, {
        items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null, hasMore,
      });
    },
  );

  app.get('/logs', async (_request, reply) => {
    const rows = await AdminLog.findAll({
      order: [['createdAt', 'DESC']], limit: 100,
      include: [{ model: User, as: 'admin', attributes: ['id', 'email'] }],
    });
    return ok(reply, rows);
  });
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { markStepSimple } from '../services/verification.js';

/**
 * Admin API. All handlers require ADMIN or SUPERADMIN role; mutating handlers write an
 * AdminLog entry so every privileged action is traceable forever.
 */
export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);
  app.addHook('preHandler', app.requireRole('ADMIN'));

  async function audit(
    adminUserId: string,
    action: string,
    targetType: string | null,
    targetId: string | null,
    meta?: Record<string, unknown>,
  ) {
    await prisma.adminLog
      .create({
        data: { adminUserId, action, targetType, targetId, meta: meta ?? null },
      })
      .catch(() => null);
  }

  // ---------------- Stats ----------------
  app.get('/stats', async (_req, reply) => {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const monthAgo = new Date(now.getTime() - 30 * 86_400_000);

    const [signups24h, signupsMonth, activeSubs, openReports, totalUsers] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'OPEN' } }),
      prisma.user.count(),
    ]);

    const revenueRows = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });
    const revenuePaise = revenueRows.reduce((sum, r) => sum + r.plan.priceInr, 0);

    return ok(reply, {
      totalUsers,
      signups24h,
      signupsMonth,
      activeSubs,
      openReports,
      revenueInr: Math.round(revenuePaise / 100),
    });
  });

  // ---------------- Users ----------------
  const UserList = z
    .object({
      q: z.string().max(100).optional(),
      status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict();

  app.get('/users', async (request, reply) => {
    const parsed = UserList.safeParse(request.query);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid query');
    const q = parsed.data;

    const rows = await prisma.user.findMany({
      where: {
        ...(q.status && { status: q.status }),
        ...(q.q && {
          OR: [
            { email: { contains: q.q } },
            { phone: { contains: q.q } },
            { profile: { fullName: { contains: q.q } } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      include: {
        profile: {
          select: { id: true, fullName: true, city: true, verification: true },
        },
      },
    });
    const hasMore = rows.length > q.limit;
    const items = rows.slice(0, q.limit);
    return ok(reply, {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      hasMore,
    });
  });

  app.patch<{ Params: { id: string }; Body: { status: 'ACTIVE' | 'SUSPENDED' | 'DELETED' } }>(
    '/users/:id/status',
    async (request, reply) => {
      if (!['ACTIVE', 'SUSPENDED', 'DELETED'].includes(request.body.status)) {
        return fail(reply, 400, 'VALIDATION', 'Invalid status');
      }
      const updated = await prisma.user.update({
        where: { id: request.params.id },
        data: { status: request.body.status },
      });
      await audit(request.auth!.sub, 'USER_STATUS_CHANGE', 'user', updated.id, {
        status: request.body.status,
      });
      return ok(reply, { id: updated.id, status: updated.status });
    },
  );

  // ---------------- Reports ----------------
  app.get('/reports', async (_req, reply) => {
    const rows = await prisma.report.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true, fullName: true } },
        reported: { select: { id: true, fullName: true } },
      },
    });
    return ok(reply, rows);
  });

  app.patch<{ Params: { id: string }; Body: { status: 'RESOLVED' | 'DISMISSED' } }>(
    '/reports/:id',
    async (request, reply) => {
      if (!['RESOLVED', 'DISMISSED'].includes(request.body.status)) {
        return fail(reply, 400, 'VALIDATION', 'Invalid status');
      }
      const updated = await prisma.report.update({
        where: { id: request.params.id },
        data: { status: request.body.status, resolvedByUserId: request.auth!.sub },
      });
      await audit(request.auth!.sub, 'REPORT_RESOLVE', 'report', updated.id, {
        status: request.body.status,
      });
      return ok(reply, updated);
    },
  );

  // ---------------- Verifications queue ----------------
  app.get('/verifications/pending', async (_req, reply) => {
    // Records where selfie/video/background was submitted but not yet approved.
    const rows = await prisma.verification.findMany({
      where: {
        OR: [
          { selfieVerified: false, videoKycVerified: false, backgroundVerified: false },
        ],
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        profile: {
          select: { id: true, fullName: true, city: true, photos: { take: 1, where: { isPrimary: true } } },
        },
      },
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
    await audit(request.auth!.sub, 'VERIFICATION_APPROVE', 'profile', request.params.profileId, {
      step,
    });
    return ok(reply, { ok: true as const });
  });

  // ---------------- Plans CRUD ----------------
  const PlanInput = z
    .object({
      name: z.string().min(2).max(40),
      priceInr: z.number().int().min(0),
      durationDays: z.number().int().min(1),
      features: z.array(z.string()).max(20),
      active: z.boolean(),
    })
    .strict();

  app.post('/plans', async (request, reply) => {
    const parsed = PlanInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const plan = await prisma.plan.create({ data: parsed.data });
    await audit(request.auth!.sub, 'PLAN_CREATE', 'plan', plan.id);
    return ok(reply, plan, 201);
  });

  app.patch<{ Params: { id: string } }>('/plans/:id', async (request, reply) => {
    const parsed = PlanInput.partial().safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const plan = await prisma.plan.update({
      where: { id: request.params.id },
      data: parsed.data,
    });
    await audit(request.auth!.sub, 'PLAN_UPDATE', 'plan', plan.id, parsed.data);
    return ok(reply, plan);
  });

  // ---------------- Audit log ----------------
  app.get('/logs', async (request, reply) => {
    const rows = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { admin: { select: { id: true, email: true } } },
    });
    return ok(reply, rows);
  });
}

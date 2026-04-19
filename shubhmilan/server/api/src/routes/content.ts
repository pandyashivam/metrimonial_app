import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

const KIND = z.enum(['SUCCESS_STORY', 'BLOG_POST', 'EVENT']);
const STATUS = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const ContentInput = z
  .object({
    kind: KIND,
    slug: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'lowercase + numbers + hyphens only'),
    title: z.string().min(2).max(160),
    excerpt: z.string().max(400).optional().nullable(),
    body: z.string().min(10).max(100_000),
    coverKey: z.string().max(200).optional().nullable(),
    meta: z.record(z.unknown()).optional().nullable(),
    status: STATUS.default('DRAFT'),
    publishedAt: z.string().datetime().optional().nullable(),
  })
  .strict();

/**
 * Public read endpoints — no auth. The marketing site + admin both consume these.
 * Published items only unless the caller explicitly asks for ?status=DRAFT (admin UI).
 */
export async function publicContentRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { kind?: string; limit?: string } }>('/', async (request, reply) => {
    const kind = KIND.safeParse(request.query.kind);
    const limit = Math.min(Math.max(parseInt(request.query.limit ?? '20', 10) || 20, 1), 50);
    const rows = await prisma.content.findMany({
      where: {
        status: 'PUBLISHED',
        ...(kind.success ? { kind: kind.data } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        kind: true,
        slug: true,
        title: true,
        excerpt: true,
        coverKey: true,
        publishedAt: true,
        meta: true,
      },
    });
    return ok(reply, rows);
  });

  app.get<{ Params: { kind: string; slug: string } }>('/:kind/:slug', async (request, reply) => {
    const kind = KIND.safeParse(request.params.kind);
    if (!kind.success) return fail(reply, 400, 'VALIDATION', 'Invalid kind');
    const row = await prisma.content.findFirst({
      where: { kind: kind.data, slug: request.params.slug, status: 'PUBLISHED' },
    });
    if (!row) return fail(reply, 404, 'NOT_FOUND', 'Not found');
    return ok(reply, row);
  });
}

/**
 * Admin CRUD — mounted with RBAC at /admin/content/*. All mutations write an AdminLog
 * entry via the shared audit helper exposed on the admin router (we pull it via a
 * simple closure when registering).
 */
export async function adminContentRoutes(
  app: FastifyInstance,
  audit: (
    adminUserId: string,
    action: string,
    targetType: string | null,
    targetId: string | null,
    meta?: Record<string, unknown>,
  ) => Promise<void>,
) {
  app.get<{ Querystring: { kind?: string; status?: string; limit?: string } }>(
    '/',
    async (request, reply) => {
      const kind = KIND.safeParse(request.query.kind);
      const status = STATUS.safeParse(request.query.status);
      const limit = Math.min(Math.max(parseInt(request.query.limit ?? '50', 10) || 50, 1), 200);
      const rows = await prisma.content.findMany({
        where: {
          ...(kind.success ? { kind: kind.data } : {}),
          ...(status.success ? { status: status.data } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
      return ok(reply, rows);
    },
  );

  app.post('/', async (request, reply) => {
    const parsed = ContentInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    const data = parsed.data;
    const existing = await prisma.content.findUnique({
      where: { kind_slug: { kind: data.kind, slug: data.slug } },
    });
    if (existing) return fail(reply, 409, 'CONFLICT', 'Slug already exists for this kind');

    const row = await prisma.content.create({
      data: {
        ...data,
        authorId: request.auth!.sub,
        publishedAt:
          data.status === 'PUBLISHED' && !data.publishedAt
            ? new Date()
            : data.publishedAt
              ? new Date(data.publishedAt)
              : null,
        meta: (data.meta ?? null) as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });
    await audit(request.auth!.sub, 'CONTENT_CREATE', 'content', row.id, { kind: row.kind, slug: row.slug });
    return ok(reply, row, 201);
  });

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = ContentInput.partial().safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const existing = await prisma.content.findUnique({ where: { id: request.params.id } });
    if (!existing) return fail(reply, 404, 'NOT_FOUND', 'Not found');

    const publishedAt =
      parsed.data.status === 'PUBLISHED' && !existing.publishedAt
        ? new Date()
        : parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : existing.publishedAt;

    const row = await prisma.content.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        publishedAt,
        meta:
          parsed.data.meta !== undefined
            ? (parsed.data.meta as unknown as import('@prisma/client').Prisma.InputJsonValue)
            : undefined,
      },
    });
    await audit(request.auth!.sub, 'CONTENT_UPDATE', 'content', row.id, parsed.data);
    return ok(reply, row);
  });

  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await prisma.content.delete({ where: { id: request.params.id } }).catch(() => null);
    await audit(request.auth!.sub, 'CONTENT_DELETE', 'content', request.params.id);
    return ok(reply, { ok: true as const });
  });
}

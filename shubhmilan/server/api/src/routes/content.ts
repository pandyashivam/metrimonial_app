import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { Content } from '../db.js';
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

export async function publicContentRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { kind?: string; limit?: string } }>('/', async (request, reply) => {
    const kind = KIND.safeParse(request.query.kind);
    const limit = Math.min(Math.max(parseInt(request.query.limit ?? '20', 10) || 20, 1), 50);
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (kind.success) where.kind = kind.data;
    const rows = await Content.findAll({
      where,
      order: [['publishedAt', 'DESC']],
      limit,
      attributes: ['id', 'kind', 'slug', 'title', 'excerpt', 'coverKey', 'publishedAt', 'meta'],
    });
    return ok(reply, rows);
  });

  app.get<{ Params: { kind: string; slug: string } }>('/:kind/:slug', async (request, reply) => {
    const kind = KIND.safeParse(request.params.kind);
    if (!kind.success) return fail(reply, 400, 'VALIDATION', 'Invalid kind');
    const row = await Content.findOne({
      where: { kind: kind.data, slug: request.params.slug, status: 'PUBLISHED' },
    });
    if (!row) return fail(reply, 404, 'NOT_FOUND', 'Not found');
    return ok(reply, row);
  });
}

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
  app.get<{ Querystring: { kind?: string; status?: string; limit?: string; offset?: string } }>(
    '/',
    async (request, reply) => {
      const kind = KIND.safeParse(request.query.kind);
      const status = STATUS.safeParse(request.query.status);
      const limit = Math.min(Math.max(parseInt(request.query.limit ?? '25', 10) || 25, 1), 200);
      const offset = Math.max(parseInt(request.query.offset ?? '0', 10) || 0, 0);
      const where: Record<string, unknown> = {};
      if (kind.success) where.kind = kind.data;
      if (status.success) where.status = status.data;
      const [items, total] = await Promise.all([
        Content.findAll({
          where,
          order: [['updatedAt', 'DESC']],
          limit,
          offset,
        }),
        Content.count({ where }),
      ]);
      return ok(reply, { items, total, hasMore: offset + items.length < total });
    },
  );

  app.post('/', async (request, reply) => {
    const parsed = ContentInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    const data = parsed.data;
    const existing = await Content.findOne({ where: { kind: data.kind, slug: data.slug } });
    if (existing) return fail(reply, 409, 'CONFLICT', 'Slug already exists for this kind');

    const row = await Content.create({
      ...data,
      authorId: request.auth!.sub,
      publishedAt:
        data.status === 'PUBLISHED' && !data.publishedAt
          ? new Date()
          : data.publishedAt
            ? new Date(data.publishedAt)
            : null,
      meta: data.meta ?? null,
    });
    await audit(request.auth!.sub, 'CONTENT_CREATE', 'content', row.id, { kind: row.kind, slug: row.slug });
    return ok(reply, row, 201);
  });

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = ContentInput.partial().safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const existing = await Content.findByPk(request.params.id);
    if (!existing) return fail(reply, 404, 'NOT_FOUND', 'Not found');

    const publishedAt =
      parsed.data.status === 'PUBLISHED' && !existing.publishedAt
        ? new Date()
        : parsed.data.publishedAt
          ? new Date(parsed.data.publishedAt)
          : existing.publishedAt;

    await existing.update({ ...parsed.data, publishedAt, meta: parsed.data.meta !== undefined ? parsed.data.meta : undefined });
    await audit(request.auth!.sub, 'CONTENT_UPDATE', 'content', existing.id, parsed.data);
    return ok(reply, existing);
  });

  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await Content.destroy({ where: { id: request.params.id } }).catch(() => null);
    await audit(request.auth!.sub, 'CONTENT_DELETE', 'content', request.params.id);
    return ok(reply, { ok: true as const });
  });
}

import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import {
  gunaMilan,
  logServedMatches,
  readCachedOrCompute,
} from '../services/matching.js';

export async function matchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/ai', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const matches = await readCachedOrCompute(request.profileId, 25);
    // Fire-and-forget log so we can A/B test ranking variants offline.
    void logServedMatches(request.profileId, matches, 'v1');
    return ok(reply, matches);
  });

  app.get<{ Params: { otherId: string } }>('/kundli/:otherId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const me = await prisma.profile.findUnique({
      where: { id: request.profileId },
      select: { nakshatra: true, rashi: true, manglik: true },
    });
    const other = await prisma.profile.findUnique({
      where: { id: request.params.otherId },
      select: { nakshatra: true, rashi: true, manglik: true },
    });
    if (!me || !other) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');
    return ok(reply, gunaMilan(me, other));
  });

  app.get('/new-today', async (request, reply) => {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const items = await prisma.profile.findMany({
      where: { createdAt: { gte: since }, deletedAt: null, userId: { not: request.auth!.sub } },
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { photos: true, verification: true },
    });
    return ok(reply, items.map((p) => ({ id: p.id, fullName: p.fullName, city: p.city })));
  });

  // Premium-tier shortcut: top 20 matches with VERIFIED or PREMIUM trust tier.
  app.get('/premium', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const me = await prisma.profile.findUnique({
      where: { id: request.profileId },
      select: { gender: true, religion: true },
    });
    if (!me) return ok(reply, []);
    const oppositeGender =
      me.gender === 'MALE' ? 'FEMALE' : me.gender === 'FEMALE' ? 'MALE' : undefined;
    const items = await prisma.profile.findMany({
      where: {
        deletedAt: null,
        userId: { not: request.auth!.sub },
        ...(oppositeGender && { gender: oppositeGender }),
        verification: { tier: { in: ['VERIFIED', 'PREMIUM'] } },
      },
      take: 20,
      orderBy: [{ verification: { trustScore: 'desc' } }, { lastActiveAt: 'desc' }],
      include: { photos: true, verification: true },
    });
    return ok(reply, items);
  });

  // Geo-nearby placeholder — profiles in the same city / state.
  app.get('/nearby', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const me = await prisma.profile.findUnique({
      where: { id: request.profileId },
      select: { city: true, state: true },
    });
    if (!me) return ok(reply, []);
    const items = await prisma.profile.findMany({
      where: {
        deletedAt: null,
        userId: { not: request.auth!.sub },
        OR: [{ city: me.city }, { state: me.state }],
      },
      take: 20,
      orderBy: { lastActiveAt: 'desc' },
      include: { photos: true, verification: true },
    });
    return ok(reply, items);
  });
}

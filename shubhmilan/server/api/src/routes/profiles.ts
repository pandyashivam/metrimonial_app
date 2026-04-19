import { DiscoveryFilter } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { resolveEntitlements } from '../services/plans.js';

// Filters outside this set are considered "advanced" and gated to Silver+.
const BASIC_FILTER_KEYS = new Set<string>([
  'gender',
  'ageMin',
  'ageMax',
  'city',
  'state',
  'cursor',
  'limit',
]);

function calcAge(dob: Date) {
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function toSummary(
  p: import('@prisma/client').Profile & {
    photos: { r2Key: string; isPrimary: boolean }[];
    verification: { tier: 'BASIC' | 'VERIFIED' | 'PREMIUM'; trustScore: number } | null;
  },
) {
  const primary = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
  return {
    id: p.id,
    fullName: p.fullName,
    gender: p.gender,
    age: calcAge(p.dob),
    height: p.height,
    religion: p.religion,
    caste: p.caste,
    city: p.city,
    state: p.state,
    education: p.education,
    occupation: p.occupation,
    primaryPhotoUrl: primary ? `/photos/${primary.r2Key}` : null,
    verificationTier: p.verification?.tier ?? 'BASIC',
    trustScore: p.verification?.trustScore ?? 0,
    isOnline: Date.now() - p.lastActiveAt.getTime() < 5 * 60_000,
    lastActiveAt: p.lastActiveAt.toISOString(),
  };
}

export async function profileRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const parsed = DiscoveryFilter.safeParse(request.query);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid filters', parsed.error.flatten());
    }
    const q = parsed.data;

    // Block advanced filters for free tier so Silver has a reason to exist.
    const advanced = Object.entries(q).filter(
      ([k, v]) => v !== undefined && v !== null && !BASIC_FILTER_KEYS.has(k),
    );
    if (advanced.length > 0) {
      const ent = await resolveEntitlements(request.auth!.sub, request.profileId);
      if (!ent.canUseAdvancedFilters) {
        return fail(
          reply,
          402,
          'PLAN_REQUIRED',
          'Advanced filters (religion, caste, diet, manglik, education, verified) require Silver or higher',
          { tier: ent.tier, rejected: advanced.map(([k]) => k) },
        );
      }
    }

    const where: import('@prisma/client').Prisma.ProfileWhereInput = {
      deletedAt: null,
      userId: { not: request.auth!.sub },
      ...(q.gender && { gender: q.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER' }),
      ...(q.religion && { religion: q.religion }),
      ...(q.caste && { caste: q.caste }),
      ...(q.motherTongue && { motherTongue: q.motherTongue }),
      ...(q.city && { city: q.city }),
      ...(q.state && { state: q.state }),
    };

    const take = q.limit + 1;
    const profiles = await prisma.profile.findMany({
      where,
      take,
      ...(q.cursor && { cursor: { id: q.cursor }, skip: 1 }),
      orderBy: [{ lastActiveAt: 'desc' }, { id: 'asc' }],
      include: { photos: { where: { moderationStatus: 'APPROVED' } }, verification: true },
    });

    let items = profiles.map(toSummary);
    if (q.ageMin || q.ageMax) {
      items = items.filter(
        (p) => (!q.ageMin || p.age >= q.ageMin) && (!q.ageMax || p.age <= q.ageMax),
      );
    }

    const hasMore = items.length > q.limit;
    const page = items.slice(0, q.limit);
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;
    return ok(reply, { items: page, nextCursor, hasMore });
  });

  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const profile = await prisma.profile.findUnique({
      where: { id },
      include: {
        photos: { where: { moderationStatus: 'APPROVED' } },
        verification: true,
        family: true,
        horoscope: true,
      },
    });
    if (!profile) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');

    if (request.profileId && request.profileId !== profile.id) {
      await prisma.profileView
        .create({
          data: { viewerProfileId: request.profileId, viewedProfileId: profile.id },
        })
        .catch(() => null);
    }

    return ok(reply, profile);
  });
}

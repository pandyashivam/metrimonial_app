import { DiscoveryFilter } from '@shubhmilan/validation';
import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';

import { Profile, Photo, Verification, ProfileView } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { resolveEntitlements } from '../services/plans.js';

const BASIC_FILTER_KEYS = new Set<string>([
  'gender', 'ageMin', 'ageMax', 'city', 'state', 'cursor', 'limit',
]);

function calcAge(dob: Date) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function toSummary(p: Profile) {
  const photos = p.photos ?? [];
  const primary = photos.find((ph) => ph.isPrimary) ?? photos[0];
  const verification = p.verification;
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
    verificationTier: verification?.tier ?? 'BASIC',
    trustScore: verification?.trustScore ?? 0,
    isOnline: Date.now() - new Date(p.lastActiveAt).getTime() < 5 * 60_000,
    lastActiveAt: new Date(p.lastActiveAt).toISOString(),
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

    const advanced = Object.entries(q).filter(
      ([k, v]) => v !== undefined && v !== null && !BASIC_FILTER_KEYS.has(k),
    );
    if (advanced.length > 0) {
      const ent = await resolveEntitlements(request.auth!.sub, request.profileId);
      if (!ent.canUseAdvancedFilters) {
        return fail(reply, 402, 'PLAN_REQUIRED',
          'Advanced filters require Silver or higher',
          { tier: ent.tier, rejected: advanced.map(([k]) => k) },
        );
      }
    }

    const where: Record<string, unknown> = {
      deletedAt: null,
      userId: { [Op.ne]: request.auth!.sub },
    };
    if (q.gender) where.gender = q.gender.toUpperCase();
    if (q.religion) where.religion = q.religion;
    if (q.caste) where.caste = q.caste;
    if (q.motherTongue) where.motherTongue = q.motherTongue;
    if (q.city) where.city = q.city;
    if (q.state) where.state = q.state;

    const take = q.limit + 1;
    const findOpts: Record<string, unknown> = {
      where,
      limit: take,
      order: [['lastActiveAt', 'DESC'], ['id', 'ASC']],
      include: [
        { model: Photo, as: 'photos', where: { moderationStatus: 'APPROVED' }, required: false },
        { model: Verification, as: 'verification' },
      ],
    };
    if (q.cursor) {
      where.id = { [Op.gt]: q.cursor };
    }

    const profiles = await Profile.findAll(findOpts as never);

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
    const profile = await Profile.findByPk(id, {
      include: [
        { model: Photo, as: 'photos', where: { moderationStatus: 'APPROVED' }, required: false },
        { model: Verification, as: 'verification' },
        { model: (await import('../db.js')).Family, as: 'family' },
        { model: (await import('../db.js')).Horoscope, as: 'horoscope' },
      ],
    });
    if (!profile) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');

    if (request.profileId && request.profileId !== profile.id) {
      await ProfileView.create({
        viewerProfileId: request.profileId,
        viewedProfileId: profile.id,
      }).catch(() => null);
    }

    return ok(reply, profile);
  });
}

import {
  FamilyInput,
  HoroscopeInput,
  PartnerPreferenceInput,
  ProfileInput,
} from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { toPublicUser } from '../services/auth.js';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    return ok(reply, toPublicUser(user));
  });

  // ------- Profile -------
  app.get('/profile', async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      include: { photos: true, verification: true },
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Profile not yet created');
    return ok(reply, profile);
  });

  app.put('/profile', async (request, reply) => {
    const parsed = ProfileInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    const data = parsed.data;
    const profile = await prisma.profile.upsert({
      where: { userId: request.auth!.sub },
      update: {
        ...data,
        dob: new Date(data.dob),
        personalityTraits: data.personalityTraits,
        hobbies: data.hobbies,
        languages: data.languages,
        gender: data.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
        maritalStatus: data.maritalStatus.replace(/\s/g, '_').toUpperCase() as
          | 'NEVER_MARRIED'
          | 'DIVORCED'
          | 'WIDOWED'
          | 'AWAITING_DIVORCE',
        diet: data.diet.replace(/[-\s]/g, '_').toUpperCase() as
          | 'VEGETARIAN'
          | 'NON_VEGETARIAN'
          | 'EGGETARIAN'
          | 'JAIN_VEGETARIAN'
          | 'VEGAN',
      },
      create: {
        userId: request.auth!.sub,
        ...data,
        dob: new Date(data.dob),
        personalityTraits: data.personalityTraits,
        hobbies: data.hobbies,
        languages: data.languages,
        gender: data.gender.toUpperCase() as 'MALE' | 'FEMALE' | 'OTHER',
        maritalStatus: data.maritalStatus.replace(/\s/g, '_').toUpperCase() as
          | 'NEVER_MARRIED'
          | 'DIVORCED'
          | 'WIDOWED'
          | 'AWAITING_DIVORCE',
        diet: data.diet.replace(/[-\s]/g, '_').toUpperCase() as
          | 'VEGETARIAN'
          | 'NON_VEGETARIAN'
          | 'EGGETARIAN'
          | 'JAIN_VEGETARIAN'
          | 'VEGAN',
        smoking: 'NO',
        drinking: 'NO',
        manglik: 'UNKNOWN',
      },
    });
    return ok(reply, profile);
  });

  // ------- Family -------
  app.get('/family', async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { id: true, family: true },
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    return ok(reply, profile.family);
  });

  app.put('/family', async (request, reply) => {
    const parsed = FamilyInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid family payload');
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { id: true },
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const family = await prisma.family.upsert({
      where: { profileId: profile.id },
      update: { ...parsed.data, siblings: parsed.data.siblings },
      create: { profileId: profile.id, ...parsed.data, siblings: parsed.data.siblings },
    });
    return ok(reply, family);
  });

  // ------- Horoscope -------
  app.put('/horoscope', async (request, reply) => {
    const parsed = HoroscopeInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid horoscope payload');
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { id: true },
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const horoscope = await prisma.horoscope.upsert({
      where: { profileId: profile.id },
      update: { ...parsed.data, doshas: parsed.data.doshas },
      create: { profileId: profile.id, ...parsed.data, doshas: parsed.data.doshas },
    });
    return ok(reply, horoscope);
  });

  // ------- Preference -------
  app.get('/preference', async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { preference: true },
    });
    return ok(reply, profile?.preference ?? null);
  });

  app.put('/preference', async (request, reply) => {
    const parsed = PartnerPreferenceInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid preference payload');
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { id: true },
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const pref = await prisma.partnerPreference.upsert({
      where: { profileId: profile.id },
      update: parsed.data,
      create: { profileId: profile.id, ...parsed.data },
    });
    return ok(reply, pref);
  });

  // ------- Verification -------
  app.get('/verification', async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      select: { verification: true },
    });
    return ok(reply, profile?.verification ?? null);
  });

  // ------- Completeness -------
  app.get('/completeness', async (request, reply) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: request.auth!.sub },
      include: { family: true, horoscope: true, preference: true, photos: true },
    });
    if (!profile) return ok(reply, { percent: 0, missing: ['profile'] });
    const missing: string[] = [];
    if (!profile.aboutMe || profile.aboutMe.length < 40) missing.push('aboutMe');
    if (!profile.family) missing.push('family');
    if (!profile.horoscope) missing.push('horoscope');
    if (!profile.preference) missing.push('preference');
    if (!profile.photos.length) missing.push('photos');
    const sections = 5;
    const completed = sections - missing.length;
    const percent = Math.round((completed / sections) * 100);
    return ok(reply, { percent, missing });
  });
}

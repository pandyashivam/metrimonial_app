import {
  FamilyInput,
  HoroscopeInput,
  PartnerPreferenceInput,
  ProfileInput,
  emailSchema,
  phoneSchema,
} from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { User, Profile, Family, Horoscope, PartnerPreference, Photo, Verification } from '../db.js';
import {
  mapDiet,
  mapDietArray,
  mapFamilyType,
  mapFamilyValues,
  mapGender,
  mapManglik,
  mapMaritalStatus,
  mapYesNo,
} from '../lib/enum-mapping.js';
import { fail, ok } from '../lib/response.js';
import { toPublicUser } from '../services/auth.js';

export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    const user = await User.findByPk(request.auth!.sub);
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    return ok(reply, toPublicUser(user));
  });

  const PatchMe = z
    .object({
      email: emailSchema.optional(),
      phone: phoneSchema.optional(),
    })
    .strict();
  app.patch('/', async (request, reply) => {
    const parsed = PatchMe.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const patch: Record<string, unknown> = {};
    if (parsed.data.email) {
      patch.email = parsed.data.email;
      patch.emailVerifiedAt = null;
    }
    if (parsed.data.phone) {
      patch.phone = parsed.data.phone;
      patch.phoneVerifiedAt = null;
    }
    if (Object.keys(patch).length === 0) {
      return fail(reply, 400, 'NO_CHANGES', 'No fields to update');
    }
    try {
      const user = await User.findByPk(request.auth!.sub);
      if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
      await user.update(patch);
      return ok(reply, toPublicUser(user));
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'SequelizeUniqueConstraintError') return fail(reply, 409, 'CONFLICT', 'Email or phone already in use');
      throw err;
    }
  });

  app.get('/profile', async (request, reply) => {
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      include: [
        { model: Photo, as: 'photos' },
        { model: Verification, as: 'verification' },
      ],
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
    // Translate every UI-facing enum to its DB-side counterpart in one place.
    // The validation package speaks human ("Anshik (Partial)", "Nuclear"); the
    // DB speaks SQL ("ANSHIK", "NUCLEAR"). enum-mapping.ts is the only seam.
    const mapped = {
      ...data,
      dob: new Date(data.dob),
      gender: mapGender(data.gender),
      maritalStatus: mapMaritalStatus(data.maritalStatus),
      diet: mapDiet(data.diet),
      smoking: mapYesNo(data.smoking),
      drinking: mapYesNo(data.drinking),
      manglik: mapManglik(data.manglik),
      familyValues: mapFamilyValues(data.familyValues),
    };

    const existing = await Profile.findOne({ where: { userId: request.auth!.sub } });
    if (existing) {
      await existing.update(mapped);
      return ok(reply, existing);
    }
    const profile = await Profile.create({
      userId: request.auth!.sub,
      ...mapped,
    });
    return ok(reply, profile);
  });

  app.get('/family', async (request, reply) => {
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const family = await Family.findOne({ where: { profileId: profile.id } });
    return ok(reply, family);
  });

  app.put('/family', async (request, reply) => {
    const parsed = FamilyInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid family payload');
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const mapped = {
      ...parsed.data,
      familyType: mapFamilyType(parsed.data.familyType),
      siblings: parsed.data.siblings,
    };
    const existing = await Family.findOne({ where: { profileId: profile.id } });
    if (existing) {
      await existing.update(mapped);
      return ok(reply, existing);
    }
    const family = await Family.create({ profileId: profile.id, ...mapped });
    return ok(reply, family);
  });

  app.get('/horoscope', async (request, reply) => {
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return ok(reply, null);
    const horoscope = await Horoscope.findOne({ where: { profileId: profile.id } });
    return ok(reply, horoscope);
  });

  app.put('/horoscope', async (request, reply) => {
    const parsed = HoroscopeInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid horoscope payload');
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    const existing = await Horoscope.findOne({ where: { profileId: profile.id } });
    if (existing) {
      await existing.update({ ...parsed.data, doshas: parsed.data.doshas });
      return ok(reply, existing);
    }
    const horoscope = await Horoscope.create({
      profileId: profile.id,
      ...parsed.data,
      doshas: parsed.data.doshas,
    });
    return ok(reply, horoscope);
  });

  app.get('/preference', async (request, reply) => {
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return ok(reply, null);
    const pref = await PartnerPreference.findOne({ where: { profileId: profile.id } });
    return ok(reply, pref);
  });

  app.put('/preference', async (request, reply) => {
    const parsed = PartnerPreferenceInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid preference payload');
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      attributes: ['id'],
    });
    if (!profile) return fail(reply, 404, 'NO_PROFILE', 'Create profile first');
    // PartnerPreference's array columns (`religions`, `castes`, `motherTongues`,
    // `education`, `occupation`, `cities`, `diet`) are JSON in the DB but the
    // schemas type each as a specific string union. Sequelize's brand-typed
    // CreationAttributes won't accept them without a cast — coerce through
    // `never` at the model boundary like we do for `meta` fields.
    const mapped = {
      ...parsed.data,
      diet: mapDietArray(parsed.data.diet as string[] | undefined),
    } as never;
    const existing = await PartnerPreference.findOne({ where: { profileId: profile.id } });
    if (existing) {
      await existing.update(mapped);
      return ok(reply, existing);
    }
    const pref = await PartnerPreference.create({ profileId: profile.id, ...(mapped as object) } as never);
    return ok(reply, pref);
  });

  app.get('/completeness', async (request, reply) => {
    const profile = await Profile.findOne({
      where: { userId: request.auth!.sub },
      include: [
        { model: Family, as: 'family' },
        { model: Horoscope, as: 'horoscope' },
        { model: PartnerPreference, as: 'preference' },
        { model: Photo, as: 'photos' },
      ],
    });
    if (!profile) return ok(reply, { percent: 0, missing: ['profile'] });
    const missing: string[] = [];
    if (!profile.aboutMe || profile.aboutMe.length < 40) missing.push('aboutMe');
    if (!profile.family) missing.push('family');
    if (!profile.horoscope) missing.push('horoscope');
    if (!profile.preference) missing.push('preference');
    if (!profile.photos?.length) missing.push('photos');
    const sections = 5;
    const completed = sections - missing.length;
    const percent = Math.round((completed / sections) * 100);
    return ok(reply, { percent, missing });
  });
}

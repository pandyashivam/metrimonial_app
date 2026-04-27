import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';

import { Profile, Photo, Verification } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { gunaMilan, logServedMatches, readCachedOrCompute } from '../services/matching.js';

export async function matchRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/ai', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const matches = await readCachedOrCompute(request.profileId, 25);
    void logServedMatches(request.profileId, matches, 'v1');
    return ok(reply, matches);
  });

  app.get<{ Params: { otherId: string } }>('/kundli/:otherId', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const me = await Profile.findByPk(request.profileId, {
      attributes: ['nakshatra', 'rashi', 'manglik'],
    });
    const other = await Profile.findByPk(request.params.otherId, {
      attributes: ['nakshatra', 'rashi', 'manglik'],
    });
    if (!me || !other) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');
    return ok(reply, gunaMilan(me, other));
  });

  app.get('/new-today', async (request, reply) => {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const items = await Profile.findAll({
      where: { createdAt: { [Op.gte]: since }, deletedAt: null, userId: { [Op.ne]: request.auth!.sub } },
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Photo, as: 'photos' },
        { model: Verification, as: 'verification' },
      ],
    });
    return ok(reply, items.map((p) => ({ id: p.id, fullName: p.fullName, city: p.city })));
  });

  app.get('/premium', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const me = await Profile.findByPk(request.profileId, { attributes: ['gender', 'religion'] });
    if (!me) return ok(reply, []);
    const oppositeGender = me.gender === 'MALE' ? 'FEMALE' : me.gender === 'FEMALE' ? 'MALE' : undefined;
    const items = await Profile.findAll({
      where: {
        deletedAt: null,
        userId: { [Op.ne]: request.auth!.sub },
        ...(oppositeGender && { gender: oppositeGender }),
      },
      limit: 20,
      order: [['lastActiveAt', 'DESC']],
      include: [
        { model: Photo, as: 'photos' },
        { model: Verification, as: 'verification', where: { tier: { [Op.in]: ['VERIFIED', 'PREMIUM'] } } },
      ],
    });
    return ok(reply, items);
  });

  app.get('/nearby', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const me = await Profile.findByPk(request.profileId, { attributes: ['city', 'state'] });
    if (!me) return ok(reply, []);
    const items = await Profile.findAll({
      where: {
        deletedAt: null,
        userId: { [Op.ne]: request.auth!.sub },
        [Op.or]: [{ city: me.city }, { state: me.state }],
      },
      limit: 20,
      order: [['lastActiveAt', 'DESC']],
      include: [
        { model: Photo, as: 'photos' },
        { model: Verification, as: 'verification' },
      ],
    });
    return ok(reply, items);
  });
}

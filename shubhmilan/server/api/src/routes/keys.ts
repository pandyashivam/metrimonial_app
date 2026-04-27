import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { Profile } from '../db.js';
import { fail, ok } from '../lib/response.js';

const PublicKeyInput = z.object({ publicKey: z.string().min(32).max(64) }).strict();

export async function keyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.put('/me/public-key', async (request, reply) => {
    const parsed = PublicKeyInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid public key');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const profile = await Profile.findByPk(request.profileId);
    if (!profile) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');
    await profile.update({ publicKey: parsed.data.publicKey });
    return ok(reply, { id: profile.id, publicKey: profile.publicKey });
  });

  app.get('/me/public-key', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const row = await Profile.findByPk(request.profileId, { attributes: ['publicKey'] });
    return ok(reply, { publicKey: row?.publicKey ?? null });
  });

  app.get<{ Params: { id: string } }>('/profiles/:id/public-key', async (request, reply) => {
    const row = await Profile.findByPk(request.params.id, { attributes: ['publicKey'] });
    if (!row) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');
    return ok(reply, { publicKey: row.publicKey });
  });
}

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

// X25519 public key: 32 raw bytes = 44 base64 chars with padding; allow up to 64.
const PublicKeyInput = z.object({ publicKey: z.string().min(32).max(64) }).strict();

/**
 * Public-key exchange endpoints. The corresponding private key NEVER leaves the user's device.
 * Server stores only each profile's current public key so peers can encrypt messages to them
 * (E2E via nacl.box). Rotating keys is allowed; past messages encrypted under the old key
 * become unreadable by design — clients keep their old secret keys in SecureStore to decrypt
 * legacy threads on the same device.
 */
export async function keyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  // Upload / rotate my public key.
  app.put('/me/public-key', async (request, reply) => {
    const parsed = PublicKeyInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid public key');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const updated = await prisma.profile.update({
      where: { id: request.profileId },
      data: { publicKey: parsed.data.publicKey },
      select: { id: true, publicKey: true },
    });
    return ok(reply, updated);
  });

  // Fetch my own public key (mirror of what peers see).
  app.get('/me/public-key', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const row = await prisma.profile.findUnique({
      where: { id: request.profileId },
      select: { publicKey: true },
    });
    return ok(reply, { publicKey: row?.publicKey ?? null });
  });

  // Fetch a peer's public key (for encrypting outgoing messages).
  app.get<{ Params: { id: string } }>('/profiles/:id/public-key', async (request, reply) => {
    const row = await prisma.profile.findUnique({
      where: { id: request.params.id },
      select: { publicKey: true },
    });
    if (!row) return fail(reply, 404, 'NOT_FOUND', 'Profile not found');
    return ok(reply, { publicKey: row.publicKey });
  });
}

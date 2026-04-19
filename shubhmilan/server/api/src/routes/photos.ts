import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import { deleteObject, generateObjectKey, publicUrl, putObject, signedGetUrl } from '../services/storage.js';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function photoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  // ---- List my photos with resolved URLs ----
  app.get('/me/photos', async (request, reply) => {
    if (!request.profileId) return ok(reply, []);
    const photos = await prisma.photo.findMany({
      where: { profileId: request.profileId },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'desc' }],
    });
    const mapped = await Promise.all(
      photos.map(async (p) => ({
        id: p.id,
        url: p.privacy === 'PUBLIC' ? publicUrl(p.r2Key) : await signedGetUrl(p.r2Key),
        isPrimary: p.isPrimary,
        privacy: p.privacy,
        moderationStatus: p.moderationStatus,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    );
    return ok(reply, mapped);
  });

  // ---- Upload (multipart) ----
  app.post('/me/photos', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const data = await request.file({ limits: { fileSize: MAX_BYTES } });
    if (!data) return fail(reply, 400, 'NO_FILE', 'No file uploaded');
    if (!ALLOWED_MIMES.has(data.mimetype)) {
      return fail(reply, 415, 'BAD_MIME', 'Only JPEG / PNG / WebP allowed');
    }

    const buf = await data.toBuffer();
    if (buf.byteLength > MAX_BYTES) return fail(reply, 413, 'TOO_LARGE', 'Max 8MB per photo');

    const key = generateObjectKey(request.profileId, data.mimetype);
    await putObject(key, buf, data.mimetype);

    const existing = await prisma.photo.count({ where: { profileId: request.profileId } });
    const photo = await prisma.photo.create({
      data: {
        profileId: request.profileId,
        r2Key: key,
        isPrimary: existing === 0,
        privacy: 'MEMBERS',
      },
    });
    return ok(
      reply,
      {
        id: photo.id,
        url: await signedGetUrl(key),
        isPrimary: photo.isPrimary,
        privacy: photo.privacy,
        moderationStatus: photo.moderationStatus,
      },
      201,
    );
  });

  // ---- Set primary ----
  app.patch<{ Params: { id: string } }>('/me/photos/:id/primary', async (request, reply) => {
    const photo = await prisma.photo.findUnique({ where: { id: request.params.id } });
    if (!photo || photo.profileId !== request.profileId) {
      return fail(reply, 404, 'NOT_FOUND', 'Photo not found');
    }
    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { profileId: request.profileId! },
        data: { isPrimary: false },
      }),
      prisma.photo.update({ where: { id: photo.id }, data: { isPrimary: true } }),
    ]);
    return ok(reply, { ok: true as const });
  });

  // ---- Change privacy ----
  app.patch<{ Params: { id: string }; Body: { privacy: 'PUBLIC' | 'MEMBERS' | 'REQUEST' } }>(
    '/me/photos/:id/privacy',
    async (request, reply) => {
      const { privacy } = request.body;
      if (!['PUBLIC', 'MEMBERS', 'REQUEST'].includes(privacy)) {
        return fail(reply, 400, 'VALIDATION', 'Invalid privacy');
      }
      const photo = await prisma.photo.findUnique({ where: { id: request.params.id } });
      if (!photo || photo.profileId !== request.profileId) {
        return fail(reply, 404, 'NOT_FOUND', 'Photo not found');
      }
      const updated = await prisma.photo.update({
        where: { id: photo.id },
        data: { privacy },
      });
      return ok(reply, updated);
    },
  );

  // ---- Delete ----
  app.delete<{ Params: { id: string } }>('/me/photos/:id', async (request, reply) => {
    const photo = await prisma.photo.findUnique({ where: { id: request.params.id } });
    if (!photo || photo.profileId !== request.profileId) {
      return fail(reply, 404, 'NOT_FOUND', 'Photo not found');
    }
    await deleteObject(photo.r2Key).catch(() => null);
    await prisma.photo.delete({ where: { id: photo.id } });
    return ok(reply, { ok: true as const });
  });
}

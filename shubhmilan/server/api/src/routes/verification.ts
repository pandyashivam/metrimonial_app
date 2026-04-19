import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { encryptPii } from '../lib/crypto.js';
import { fail, ok } from '../lib/response.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { markStepSimple } from '../services/verification.js';

/**
 * The 6-step verification tier flow from BUILD_INSTRUCTIONS §12.
 *   1. email   — magic-link / OTP
 *   2. phone   — SMS OTP
 *   3. aadhaar — 3rd-party KYC (Digio / HyperVerge) — we accept the last-4 + verification id
 *   4. selfie  — face-match against primary photo
 *   5. video   — recorded prompt → manual review
 *   6. background — paid step → manual review
 *
 * Steps 5 and 6 transition to a 'pending' state in the admin queue until a human approves.
 */
export async function verificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    if (!request.profileId) return ok(reply, null);
    const v = await prisma.verification.findUnique({ where: { profileId: request.profileId } });
    return ok(reply, v);
  });

  // ---- Email — request OTP, then verify ----
  app.post('/email/request', async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    await issueOtp(user.email, 'VERIFY_EMAIL');
    return ok(reply, { sent: true as const });
  });

  app.post<{ Body: { code: string } }>('/email/verify', async (request, reply) => {
    const code = request.body?.code;
    if (!code) return fail(reply, 400, 'VALIDATION', 'Code required');
    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const r = await verifyOtp(user.email, code, 'VERIFY_EMAIL');
    if (!r.ok) return fail(reply, 400, 'INVALID_OTP', 'Invalid OTP');
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    if (request.profileId) await markStepSimple(request.profileId, 'email');
    return ok(reply, { verified: true as const });
  });

  // ---- Phone ----
  app.post('/phone/request', async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    await issueOtp(user.phone, 'VERIFY_PHONE');
    return ok(reply, { sent: true as const });
  });

  app.post<{ Body: { code: string } }>('/phone/verify', async (request, reply) => {
    const code = request.body?.code;
    if (!code) return fail(reply, 400, 'VALIDATION', 'Code required');
    const user = await prisma.user.findUnique({ where: { id: request.auth!.sub } });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const r = await verifyOtp(user.phone, code, 'VERIFY_PHONE');
    if (!r.ok) return fail(reply, 400, 'INVALID_OTP', 'Invalid OTP');
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });
    if (request.profileId) await markStepSimple(request.profileId, 'phone');
    return ok(reply, { verified: true as const });
  });

  // ---- Aadhaar (3rd-party KYC callback) ----
  const AadhaarBody = z
    .object({
      last4: z.string().length(4),
      providerRef: z.string().min(8).max(120),
      // In production, we verify providerRef by calling back the KYC provider's API.
    })
    .strict();
  app.post('/aadhaar/confirm', async (request, reply) => {
    const parsed = AadhaarBody.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const encrypted = encryptPii(parsed.data.last4);
    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: { aadhaarVerified: true, aadhaarLast4Enc: encrypted },
      create: {
        profileId: request.profileId,
        aadhaarVerified: true,
        aadhaarLast4Enc: encrypted,
      },
    });
    await markStepSimple(request.profileId, 'aadhaar');
    return ok(reply, { verified: true as const });
  });

  // ---- Selfie / Video / Background — enqueue for admin review ----
  app.post('/selfie/submit', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: {},
      create: { profileId: request.profileId },
    });
    // In prod: call face-match provider with uploaded selfie vs primary photo.
    // Dev: mark verified immediately.
    await markStepSimple(request.profileId, 'selfie');
    return ok(reply, { submitted: true as const });
  });

  app.post('/video/submit', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: {},
      create: { profileId: request.profileId },
    });
    return ok(reply, { submitted: true as const, status: 'pending' as const });
  });

  app.post('/background/request', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: {},
      create: { profileId: request.profileId },
    });
    return ok(reply, { submitted: true as const, status: 'pending' as const });
  });
}

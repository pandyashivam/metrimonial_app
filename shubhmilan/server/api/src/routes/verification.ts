import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { encryptPii } from '../lib/crypto.js';
import { fail, ok } from '../lib/response.js';
import { confirmAadhaar, runFaceMatch } from '../services/kyc.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { pushVerificationApproved } from '../services/push.js';
import { markStepSimple } from '../services/verification.js';

/**
 * The 6-step verification tier flow from BUILD_INSTRUCTIONS §12.
 *   1. email   — OTP
 *   2. phone   — SMS OTP
 *   3. aadhaar — Digio / HyperVerge sandbox call; we store only encrypted last-4
 *   4. selfie  — face-match against primary photo
 *   5. video   — short recorded prompt → queued for manual admin review
 *   6. background — paid step → queued for provider + admin review
 *
 * Steps that transition to "pending" remain unapproved until admin or automated checks
 * complete. On final approval we fire a push notification to the user.
 */
export async function verificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    if (!request.profileId) return ok(reply, null);
    const v = await prisma.verification.findUnique({ where: { profileId: request.profileId } });
    return ok(reply, v);
  });

  // ---- Email ----
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
    if (request.profileId) {
      await markStepSimple(request.profileId, 'email');
      void pushVerificationApproved(user.id, 'email');
    }
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
    if (request.profileId) {
      await markStepSimple(request.profileId, 'phone');
      void pushVerificationApproved(user.id, 'phone');
    }
    return ok(reply, { verified: true as const });
  });

  // ---- Aadhaar: KYC provider exchange ----
  // Client obtains a providerRef by completing the Digio/HyperVerge SDK flow, then POSTs it
  // back here. Server verifies the reference with the provider before marking verified.
  const AadhaarBody = z
    .object({
      last4: z.string().length(4),
      providerRef: z.string().min(8).max(120),
    })
    .strict();

  app.post('/aadhaar/confirm', async (request, reply) => {
    const parsed = AadhaarBody.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');

    const verified = await confirmAadhaar(parsed.data.providerRef, parsed.data.last4);
    if (!verified.ok) {
      return fail(reply, 400, 'KYC_FAILED', verified.reason ?? 'Could not verify with provider');
    }

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
    void pushVerificationApproved(request.auth!.sub, 'Aadhaar');
    return ok(reply, { verified: true as const, provider: verified.provider });
  });

  // ---- Selfie ----
  // Client uploads selfie → we run HyperVerge face-match against primary photo.
  const SelfieBody = z
    .object({
      selfieUrl: z.string().url().optional(),
    })
    .strict();

  app.post('/selfie/submit', async (request, reply) => {
    const parsed = SelfieBody.safeParse(request.body ?? {});
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');

    const primary = await prisma.photo.findFirst({
      where: { profileId: request.profileId, isPrimary: true },
      select: { r2Key: true },
    });
    if (!primary) return fail(reply, 400, 'NO_PRIMARY_PHOTO', 'Upload a primary photo first');

    const result = await runFaceMatch({
      primaryPhotoKey: primary.r2Key,
      selfieUrl: parsed.data.selfieUrl,
    });

    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: { selfieVerified: result.matched },
      create: { profileId: request.profileId, selfieVerified: result.matched },
    });

    if (result.matched) {
      await markStepSimple(request.profileId, 'selfie');
      void pushVerificationApproved(request.auth!.sub, 'selfie');
      return ok(reply, { verified: true as const, confidence: result.confidence });
    }
    return ok(reply, {
      verified: false as const,
      confidence: result.confidence,
      status: result.pendingReview ? ('pending' as const) : ('rejected' as const),
    });
  });

  // ---- Video KYC — always queued for human review (admin approves in the panel) ----
  app.post('/video/submit', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    await prisma.verification.upsert({
      where: { profileId: request.profileId },
      update: {},
      create: { profileId: request.profileId },
    });
    return ok(reply, { submitted: true as const, status: 'pending' as const });
  });

  // ---- Background check — one-time paid step (₹1500). Gold+ members get it free. ----
  app.post('/background/order', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const [existing, subscription] = await Promise.all([
      prisma.verification.findUnique({ where: { profileId: request.profileId } }),
      prisma.subscription.findFirst({
        where: { userId: request.auth!.sub, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { endsAt: 'desc' },
      }),
    ]);
    if (existing?.backgroundVerified) {
      return fail(reply, 400, 'ALREADY_VERIFIED', 'Background check already completed');
    }

    const freeTier =
      subscription?.plan?.name?.toLowerCase().includes('gold') ||
      subscription?.plan?.name?.toLowerCase().includes('platinum');
    if (freeTier) {
      // Fast-path: no payment required for Gold/Platinum. Queue for admin review.
      await prisma.verification.upsert({
        where: { profileId: request.profileId },
        update: {},
        create: { profileId: request.profileId },
      });
      return ok(reply, { queued: true as const, free: true as const });
    }

    // Create a PENDING subscription-shaped row so the Razorpay flow + webhook works
    // unchanged — we use a synthetic short-lived "plan" for the one-time fee instead of
    // creating a new table. The admin queue picks it up on capture.
    const { createOrder } = await import('../services/razorpay.js');
    const receipt = `bgchk_${request.auth!.sub}_${Date.now()}`;
    const order = await createOrder(150_000, receipt);
    return ok(reply, {
      orderId: order.id,
      amount: order.amount,
      keyId: (await import('../env.js')).env.RAZORPAY_KEY_ID,
      receipt,
      queued: false as const,
      free: false as const,
    });
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

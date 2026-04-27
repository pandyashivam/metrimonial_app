import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { User, Verification, Photo, Subscription, Plan } from '../db.js';
import { encryptPii } from '../lib/crypto.js';
import { fail, ok } from '../lib/response.js';
import { confirmAadhaar, runFaceMatch } from '../services/kyc.js';
import { issueOtp, verifyOtp } from '../services/otp.js';
import { pushVerificationApproved } from '../services/push.js';
import { markStepSimple } from '../services/verification.js';

export async function verificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/', async (request, reply) => {
    if (!request.profileId) return ok(reply, null);
    const v = await Verification.findOne({ where: { profileId: request.profileId } });
    return ok(reply, v);
  });

  // ---- Email ----
  app.post('/email/request', async (request, reply) => {
    const user = await User.findByPk(request.auth!.sub);
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    await issueOtp(user.email, 'VERIFY_EMAIL');
    return ok(reply, { sent: true as const });
  });

  app.post<{ Body: { code: string } }>('/email/verify', async (request, reply) => {
    const code = request.body?.code;
    if (!code) return fail(reply, 400, 'VALIDATION', 'Code required');
    const user = await User.findByPk(request.auth!.sub);
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const r = await verifyOtp(user.email, code, 'VERIFY_EMAIL');
    if (!r.ok) return fail(reply, 400, 'INVALID_OTP', 'Invalid OTP');
    await user.update({ emailVerifiedAt: new Date() });
    if (request.profileId) {
      await markStepSimple(request.profileId, 'email');
      void pushVerificationApproved(user.id, 'email');
    }
    return ok(reply, { verified: true as const });
  });

  // ---- Phone ----
  app.post('/phone/request', async (request, reply) => {
    const user = await User.findByPk(request.auth!.sub);
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    await issueOtp(user.phone, 'VERIFY_PHONE');
    return ok(reply, { sent: true as const });
  });

  app.post<{ Body: { code: string } }>('/phone/verify', async (request, reply) => {
    const code = request.body?.code;
    if (!code) return fail(reply, 400, 'VALIDATION', 'Code required');
    const user = await User.findByPk(request.auth!.sub);
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const r = await verifyOtp(user.phone, code, 'VERIFY_PHONE');
    if (!r.ok) return fail(reply, 400, 'INVALID_OTP', 'Invalid OTP');
    await user.update({ phoneVerifiedAt: new Date() });
    if (request.profileId) {
      await markStepSimple(request.profileId, 'phone');
      void pushVerificationApproved(user.id, 'phone');
    }
    return ok(reply, { verified: true as const });
  });

  // ---- Aadhaar ----
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
    const existing = await Verification.findOne({ where: { profileId: request.profileId } });
    if (existing) {
      await existing.update({ aadhaarVerified: true, aadhaarLast4Enc: encrypted });
    } else {
      await Verification.create({ profileId: request.profileId, aadhaarVerified: true, aadhaarLast4Enc: encrypted });
    }
    await markStepSimple(request.profileId, 'aadhaar');
    void pushVerificationApproved(request.auth!.sub, 'Aadhaar');
    return ok(reply, { verified: true as const, provider: verified.provider });
  });

  // ---- Selfie ----
  const SelfieBody = z
    .object({
      selfieUrl: z.string().url().optional(),
    })
    .strict();

  app.post('/selfie/submit', async (request, reply) => {
    const parsed = SelfieBody.safeParse(request.body ?? {});
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');

    const primary = await Photo.findOne({
      where: { profileId: request.profileId, isPrimary: true },
      attributes: ['r2Key'],
    });
    if (!primary) return fail(reply, 400, 'NO_PRIMARY_PHOTO', 'Upload a primary photo first');

    const result = await runFaceMatch({
      primaryPhotoKey: primary.r2Key,
      selfieUrl: parsed.data.selfieUrl,
    });

    const existing = await Verification.findOne({ where: { profileId: request.profileId } });
    if (existing) {
      await existing.update({ selfieVerified: result.matched });
    } else {
      await Verification.create({ profileId: request.profileId, selfieVerified: result.matched });
    }

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

  // ---- Video KYC ----
  app.post('/video/submit', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const existing = await Verification.findOne({ where: { profileId: request.profileId } });
    if (!existing) {
      await Verification.create({ profileId: request.profileId });
    }
    return ok(reply, { submitted: true as const, status: 'pending' as const });
  });

  // ---- Background check ----
  app.post('/background/order', async (request, reply) => {
    if (!request.profileId) return fail(reply, 400, 'NO_PROFILE', 'Create profile first');
    const [existing, subscription] = await Promise.all([
      Verification.findOne({ where: { profileId: request.profileId } }),
      Subscription.findOne({
        where: { userId: request.auth!.sub, status: 'ACTIVE' },
        include: [{ model: Plan, as: 'plan' }],
        order: [['endsAt', 'DESC']],
      }),
    ]);
    if (existing?.backgroundVerified) {
      return fail(reply, 400, 'ALREADY_VERIFIED', 'Background check already completed');
    }

    const freeTier =
      subscription?.plan?.name?.toLowerCase().includes('gold') ||
      subscription?.plan?.name?.toLowerCase().includes('platinum');
    if (freeTier) {
      if (!existing) {
        await Verification.create({ profileId: request.profileId });
      }
      return ok(reply, { queued: true as const, free: true as const });
    }

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
    const existing = await Verification.findOne({ where: { profileId: request.profileId } });
    if (!existing) {
      await Verification.create({ profileId: request.profileId });
    }
    return ok(reply, { submitted: true as const, status: 'pending' as const });
  });
}

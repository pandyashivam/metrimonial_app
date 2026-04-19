import {
  LoginInput,
  RefreshInput,
  ResendOtpInput,
  ResetPasswordInput,
  SignupInput,
  VerifyOtpInput,
  ForgotPasswordInput,
} from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';
import {
  hashPassword,
  issueTokensForUser,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
  toPublicUser,
  verifyPassword,
} from '../services/auth.js';
import { issueOtp, verifyOtp } from '../services/otp.js';

export async function authRoutes(app: FastifyInstance) {
  // --- Signup (email/phone + password → OTP issued) ---
  app.post('/signup', async (request, reply) => {
    const parsed = SignupInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid signup payload', parsed.error.flatten());
    }
    const { email, phone, password } = parsed.data;

    const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      return fail(reply, 409, 'CONFLICT', 'Email or phone already registered');
    }

    // Stash password hash in the OTP row (target=phone, purpose=SIGNUP); only finalize on verify.
    const passwordHash = await hashPassword(password);
    // Persist a pre-registration record keyed off phone. We reuse the OTP row + stash email.
    // For simplicity we create the user up-front with emailVerifiedAt = null, phoneVerifiedAt = null.
    await prisma.user.create({
      data: { email, phone, passwordHash, status: 'ACTIVE' },
    });

    await issueOtp(phone, 'SIGNUP');
    return ok(reply, { pending: true as const, target: phone });
  });

  // --- Verify OTP (SIGNUP / LOGIN / VERIFY_*) ---
  app.post('/verify-otp', async (request, reply) => {
    const parsed = VerifyOtpInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    const { target, code, purpose } = parsed.data;
    const r = await verifyOtp(target, code, purpose);
    if (!r.ok) return fail(reply, 400, 'OTP_' + r.reason, 'OTP verification failed');

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: target }, { phone: target }] },
    });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found for this target');

    if (purpose === 'SIGNUP' || purpose === 'VERIFY_PHONE') {
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }
    if (purpose === 'VERIFY_EMAIL') {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    const tokens = await issueTokensForUser(user);
    return ok(reply, { user: toPublicUser(user), tokens });
  });

  // --- Login (password OR OTP) ---
  app.post('/login', async (request, reply) => {
    const parsed = LoginInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    const { identifier, password, otp } = parsed.data;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }] },
    });
    if (!user || user.status !== 'ACTIVE') {
      return fail(reply, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (password) {
      const match = await verifyPassword(password, user.passwordHash);
      if (!match) return fail(reply, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    } else if (otp) {
      const r = await verifyOtp(identifier, otp, 'LOGIN');
      if (!r.ok) return fail(reply, 401, 'INVALID_OTP', 'Invalid OTP');
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const tokens = await issueTokensForUser(user);
    return ok(reply, { user: toPublicUser(user), tokens });
  });

  // --- Refresh ---
  app.post('/refresh', async (request, reply) => {
    const parsed = RefreshInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const tokens = await rotateRefreshToken(parsed.data.refreshToken);
    if (!tokens) return fail(reply, 401, 'UNAUTHENTICATED', 'Refresh token rejected');
    return ok(reply, { tokens });
  });

  // --- Logout ---
  app.post('/logout', { preHandler: [app.requireAuth] }, async (request, reply) => {
    if (request.auth) await revokeAllRefreshTokensForUser(request.auth.sub);
    return ok(reply, { ok: true as const });
  });

  // --- Resend OTP ---
  app.post('/resend-otp', async (request, reply) => {
    const parsed = ResendOtpInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    await issueOtp(parsed.data.target, parsed.data.purpose);
    return ok(reply, { ok: true as const });
  });

  // --- Forgot password ---
  app.post('/forgot-password', async (request, reply) => {
    const parsed = ForgotPasswordInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: parsed.data.identifier }, { phone: parsed.data.identifier }] },
    });
    // Always return ok to avoid enumeration.
    if (user) await issueOtp(parsed.data.identifier, 'RESET');
    return ok(reply, { ok: true as const });
  });

  // --- Reset password ---
  app.post('/reset-password', async (request, reply) => {
    const parsed = ResetPasswordInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const { target, code, password } = parsed.data;
    const r = await verifyOtp(target, code, 'RESET');
    if (!r.ok) return fail(reply, 400, 'OTP_' + r.reason, 'OTP verification failed');
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: target }, { phone: target }] },
    });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await revokeAllRefreshTokensForUser(user.id);
    return ok(reply, { ok: true as const });
  });
}

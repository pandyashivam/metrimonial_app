import {
  LoginInput,
  RefreshInput,
  ResendOtpInput,
  ResetPasswordInput,
  SignupInput,
  VerifyOtpInput,
  ForgotPasswordInput,
} from '@shubhmilan/validation';
import { Op } from 'sequelize';
import type { FastifyInstance } from 'fastify';

import { User } from '../db.js';
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
  app.post('/signup', async (request, reply) => {
    const parsed = SignupInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid signup payload', parsed.error.flatten());
    }
    const { email, phone, password } = parsed.data;

    const existing = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
    if (existing) {
      return fail(reply, 409, 'CONFLICT', 'Email or phone already registered');
    }

    const passwordHash = await hashPassword(password);
    await User.create({ email, phone, passwordHash, status: 'ACTIVE' });

    await issueOtp(phone, 'SIGNUP');
    return ok(reply, { pending: true as const, target: phone });
  });

  app.post('/verify-otp', async (request, reply) => {
    const parsed = VerifyOtpInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    const { target, code, purpose } = parsed.data;
    const r = await verifyOtp(target, code, purpose);
    if (!r.ok) return fail(reply, 400, 'OTP_' + r.reason, 'OTP verification failed');

    const user = await User.findOne({
      where: { [Op.or]: [{ email: target }, { phone: target }] },
    });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found for this target');

    if (purpose === 'SIGNUP' || purpose === 'VERIFY_PHONE') {
      await user.update({ phoneVerifiedAt: new Date() });
    }
    if (purpose === 'VERIFY_EMAIL') {
      await user.update({ emailVerifiedAt: new Date() });
    }

    const tokens = await issueTokensForUser(user);
    return ok(reply, { user: toPublicUser(user), tokens });
  });

  app.post('/login', async (request, reply) => {
    const parsed = LoginInput.safeParse(request.body);
    if (!parsed.success) {
      return fail(reply, 400, 'VALIDATION', 'Invalid payload', parsed.error.flatten());
    }
    const { identifier, password, otp } = parsed.data;
    const user = await User.findOne({
      where: { [Op.or]: [{ email: identifier }, { phone: identifier }] },
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

    await user.update({ lastLoginAt: new Date() });
    const tokens = await issueTokensForUser(user);
    return ok(reply, { user: toPublicUser(user), tokens });
  });

  app.post('/refresh', async (request, reply) => {
    const parsed = RefreshInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const tokens = await rotateRefreshToken(parsed.data.refreshToken);
    if (!tokens) return fail(reply, 401, 'UNAUTHENTICATED', 'Refresh token rejected');
    return ok(reply, { tokens });
  });

  app.post('/logout', { preHandler: [app.requireAuth] }, async (request, reply) => {
    if (request.auth) await revokeAllRefreshTokensForUser(request.auth.sub);
    return ok(reply, { ok: true as const });
  });

  app.post('/resend-otp', async (request, reply) => {
    const parsed = ResendOtpInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    await issueOtp(parsed.data.target, parsed.data.purpose);
    return ok(reply, { ok: true as const });
  });

  app.post('/forgot-password', async (request, reply) => {
    const parsed = ForgotPasswordInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const user = await User.findOne({
      where: { [Op.or]: [{ email: parsed.data.identifier }, { phone: parsed.data.identifier }] },
    });
    if (user) await issueOtp(parsed.data.identifier, 'RESET');
    return ok(reply, { ok: true as const });
  });

  app.post('/reset-password', async (request, reply) => {
    const parsed = ResetPasswordInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const { target, code, password } = parsed.data;
    const r = await verifyOtp(target, code, 'RESET');
    if (!r.ok) return fail(reply, 400, 'OTP_' + r.reason, 'OTP verification failed');
    const user = await User.findOne({
      where: { [Op.or]: [{ email: target }, { phone: target }] },
    });
    if (!user) return fail(reply, 404, 'NOT_FOUND', 'User not found');
    const passwordHash = await hashPassword(password);
    await user.update({ passwordHash });
    await revokeAllRefreshTokensForUser(user.id);
    return ok(reply, { ok: true as const });
  });
}

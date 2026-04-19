import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import type { OtpPurpose } from '@prisma/client';

import { prisma } from '../db.js';
import { isEmail, sendOtpEmail, sendOtpSms } from '../lib/notify.js';

const OTP_TTL_MINUTES = 10;

export async function issueOtp(target: string, purpose: OtpPurpose) {
  const code = randomInt(100_000, 999_999).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  // Invalidate outstanding OTPs for the same target+purpose.
  await prisma.otp.updateMany({
    where: { target, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  await prisma.otp.create({ data: { target, codeHash, purpose, expiresAt } });

  if (isEmail(target)) await sendOtpEmail(target, code, purpose);
  else await sendOtpSms(target, code, purpose);

  return { expiresAt };
}

export async function verifyOtp(target: string, code: string, purpose: OtpPurpose) {
  const otp = await prisma.otp.findFirst({
    where: { target, purpose, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) return { ok: false as const, reason: 'EXPIRED' };

  if (otp.attempts >= 5) {
    await prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    return { ok: false as const, reason: 'TOO_MANY_ATTEMPTS' };
  }

  const match = await bcrypt.compare(code, otp.codeHash);
  if (!match) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, reason: 'INVALID' };
  }

  await prisma.otp.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  return { ok: true as const };
}

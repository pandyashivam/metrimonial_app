import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { Op } from 'sequelize';

import { Otp } from '../db.js';
import { isEmail, sendOtpEmail, sendOtpSms } from '../lib/notify.js';

const OTP_TTL_MINUTES = 10;

export type OtpPurpose = 'SIGNUP' | 'LOGIN' | 'RESET' | 'VERIFY_EMAIL' | 'VERIFY_PHONE';

export async function issueOtp(target: string, purpose: OtpPurpose) {
  const code = randomInt(100_000, 999_999).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await Otp.update(
    { usedAt: new Date() },
    { where: { target, purpose, usedAt: null, expiresAt: { [Op.gt]: new Date() } } },
  );

  await Otp.create({ target, codeHash, purpose, expiresAt });

  if (isEmail(target)) await sendOtpEmail(target, code, purpose);
  else await sendOtpSms(target, code, purpose);

  return { expiresAt };
}

export async function verifyOtp(target: string, code: string, purpose: OtpPurpose) {
  const otp = await Otp.findOne({
    where: { target, purpose, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    order: [['createdAt', 'DESC']],
  });
  if (!otp) return { ok: false as const, reason: 'EXPIRED' };

  if (otp.attempts! >= 5) {
    await otp.update({ usedAt: new Date() });
    return { ok: false as const, reason: 'TOO_MANY_ATTEMPTS' };
  }

  const match = await bcrypt.compare(code, otp.codeHash);
  if (!match) {
    await otp.update({ attempts: (otp.attempts ?? 0) + 1 });
    return { ok: false as const, reason: 'INVALID' };
  }

  await otp.update({ usedAt: new Date() });
  return { ok: true as const };
}

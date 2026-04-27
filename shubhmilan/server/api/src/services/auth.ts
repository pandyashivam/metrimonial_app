import bcrypt from 'bcrypt';

import { User, RefreshToken } from '../db.js';
import { env } from '../env.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  signAccessToken,
  ttlToSeconds,
} from '../lib/tokens.js';

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function issueTokensForUser(user: User) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role! });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const ttl = ttlToSeconds(env.JWT_REFRESH_TTL);
  await RefreshToken.create({
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + ttl * 1000),
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: ttlToSeconds(env.JWT_ACCESS_TTL),
  };
}

export async function rotateRefreshToken(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const row = await RefreshToken.findOne({
    where: { tokenHash, revokedAt: null },
    include: [{ model: User, as: 'user' }],
  });
  if (!row || !row.expiresAt || row.expiresAt <= new Date()) return null;

  await row.update({ revokedAt: new Date() });

  const user = await User.findByPk(row.userId);
  if (!user) return null;
  return issueTokensForUser(user);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await RefreshToken.update(
    { revokedAt: new Date() },
    { where: { userId, revokedAt: null } },
  );
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

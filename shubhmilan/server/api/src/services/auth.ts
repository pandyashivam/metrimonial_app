import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';

import { prisma } from '../db.js';
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
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const ttl = ttlToSeconds(env.JWT_REFRESH_TTL);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + ttl * 1000),
    },
  });
  return {
    accessToken,
    refreshToken,
    expiresIn: ttlToSeconds(env.JWT_ACCESS_TTL),
  };
}

/**
 * Rotate a refresh token: verify it's active, revoke the old one, issue new pair.
 * Used tokens are invalidated even if they remain within TTL (defense against theft).
 */
export async function rotateRefreshToken(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);
  const row = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });
  if (!row) return null;

  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  return issueTokensForUser(row.user);
}

export async function revokeAllRefreshTokensForUser(userId: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
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

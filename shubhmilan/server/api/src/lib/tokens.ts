import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { env } from '../env.js';

export interface AccessTokenClaims {
  sub: string;
  role: 'USER' | 'ADMIN' | 'SUPERADMIN';
}

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
    issuer: 'shubhmilan',
  });
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'shubhmilan' }) as AccessTokenClaims;
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Returns TTL in seconds from a "15m" / "30d" form. */
export function ttlToSeconds(ttl: string): number {
  const m = ttl.match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = Number(m[1]);
  switch (m[2]) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 3600;
    case 'd':
      return n * 86400;
    default:
      return 0;
  }
}

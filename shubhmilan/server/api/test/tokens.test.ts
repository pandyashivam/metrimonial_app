import { describe, expect, it } from 'vitest';

process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL = 'mysql://u:p@localhost/db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long';

const { signAccessToken, verifyAccessToken, ttlToSeconds, generateRefreshToken, hashRefreshToken } =
  await import('../src/lib/tokens.js');

describe('token helpers', () => {
  it('signs and verifies an access token', () => {
    const token = signAccessToken({ sub: 'user_1', role: 'USER' });
    const claims = verifyAccessToken(token);
    expect(claims.sub).toBe('user_1');
    expect(claims.role).toBe('USER');
  });

  it('parses ttl shorthand', () => {
    expect(ttlToSeconds('15m')).toBe(900);
    expect(ttlToSeconds('1h')).toBe(3600);
    expect(ttlToSeconds('30d')).toBe(30 * 86400);
    expect(ttlToSeconds('bogus')).toBe(0);
  });

  it('hashes refresh tokens deterministically', () => {
    const t = generateRefreshToken();
    expect(hashRefreshToken(t)).toBe(hashRefreshToken(t));
    expect(hashRefreshToken(t)).not.toBe(t);
  });
});

import { describe, expect, it } from 'vitest';

process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL = 'mysql://u:p@localhost/db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long';

const { computeTrustScore, tierFromScore } = await import('../src/services/verification.js');

describe('verification scoring', () => {
  it('computes trust score from verified flags', () => {
    const s = computeTrustScore({
      emailVerified: true, // +10
      phoneVerified: true, // +15
      aadhaarVerified: true, // +25
      selfieVerified: false,
      videoKycVerified: false,
      backgroundVerified: false,
    });
    expect(s).toBe(50);
  });

  it('caps trust score at 100', () => {
    const s = computeTrustScore({
      emailVerified: true,
      phoneVerified: true,
      aadhaarVerified: true,
      selfieVerified: true,
      videoKycVerified: true,
      backgroundVerified: true,
    });
    expect(s).toBe(100);
  });

  it('maps score → tier per spec §12', () => {
    expect(tierFromScore(0)).toBe('BASIC');
    expect(tierFromScore(40)).toBe('BASIC');
    expect(tierFromScore(41)).toBe('VERIFIED');
    expect(tierFromScore(80)).toBe('VERIFIED');
    expect(tierFromScore(81)).toBe('PREMIUM');
    expect(tierFromScore(100)).toBe('PREMIUM');
  });
});

import { describe, expect, it } from 'vitest';

// Seed env before module imports since the lib reads at import time.
process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL = 'mysql://u:p@localhost/db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long';

const { decryptPii, encryptPii } = await import('../src/lib/crypto.js');

describe('PII crypto', () => {
  it('round-trips a small string', () => {
    const enc = encryptPii('1234');
    expect(enc).toContain(':');
    expect(decryptPii(enc)).toBe('1234');
  });

  it('produces different ciphertexts for identical plaintext (random iv)', () => {
    const a = encryptPii('hello');
    const b = encryptPii('hello');
    expect(a).not.toBe(b);
  });

  it('fails to decrypt a tampered payload', () => {
    const enc = encryptPii('secret');
    const [iv, tag, body] = enc.split(':');
    const tampered = `${iv}:${tag}:${body!.slice(0, -2)}aa`;
    expect(() => decryptPii(tampered)).toThrow();
  });
});

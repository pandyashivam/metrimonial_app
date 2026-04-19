import { describe, expect, it } from 'vitest';

process.env.PII_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL = 'mysql://u:p@localhost/db';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long';

const { cosineSimilarity, hashText, openaiEnabled } = await import('../src/services/openai.js');

describe('openai helpers', () => {
  it('cosineSimilarity is 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('cosineSimilarity is 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('cosineSimilarity is 0 for zero vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });

  it('hashText returns deterministic SHA-256 hex', () => {
    const a = hashText('same input');
    const b = hashText('same input');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('openaiEnabled reflects the env var', () => {
    // OPENAI_API_KEY not set — should be disabled.
    expect(openaiEnabled()).toBe(false);
  });
});

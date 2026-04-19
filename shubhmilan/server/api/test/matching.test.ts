import { describe, expect, it } from 'vitest';

import { aiMatchScore, gunaMilan } from '../src/services/matching.js';

// Minimal "profile" fixtures for unit-testing the pure scoring logic (no DB).
const base = {
  id: 'a',
  userId: 'u',
  fullName: 'A',
  dob: new Date('1996-01-01'),
  gender: 'MALE' as const,
  height: '5\'10"',
  weight: null,
  maritalStatus: 'NEVER_MARRIED' as const,
  motherTongue: 'Hindi',
  religion: 'Hindu',
  caste: 'Brahmin',
  subCaste: null,
  gotra: null,
  manglik: 'NO' as const,
  rashi: null,
  nakshatra: null,
  education: 'B.Tech',
  occupation: 'Engineer',
  income: null,
  city: 'Delhi',
  state: 'Delhi',
  country: 'India',
  diet: 'VEGETARIAN' as const,
  smoking: 'NO' as const,
  drinking: 'NO' as const,
  aboutMe: 'I am a simple person with strong family values.',
  familyValues: 'TRADITIONAL' as const,
  personalityTraits: ['Calm', 'Thoughtful'],
  hobbies: ['Reading', 'Travel'],
  languages: ['Hindi'],
  complexion: null,
  bodyType: null,
  publicKey: null,
  lastActiveAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  preference: null,
  verification: { trustScore: 80 } as never,
};

describe('aiMatchScore', () => {
  it('scores higher for same-religion, -mother-tongue, -diet matches', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const same = aiMatchScore(base as any, { ...base, id: 'b', gender: 'FEMALE' } as any);
    const other = aiMatchScore(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      base as any,
      {
        ...base,
        id: 'c',
        gender: 'FEMALE',
        religion: 'Christian',
        motherTongue: 'English',
        diet: 'NON_VEGETARIAN',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    );
    expect(same.score).toBeGreaterThan(other.score);
  });

  it('clamps score to [0, 100]', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = aiMatchScore(base as any, base as any);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('returns at most 6 reasons sorted by weight desc', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = aiMatchScore(base as any, base as any);
    expect(r.reasons.length).toBeLessThanOrEqual(6);
    for (let i = 1; i < r.reasons.length; i++) {
      expect(r.reasons[i - 1]!.weight).toBeGreaterThanOrEqual(r.reasons[i]!.weight);
    }
  });
});

describe('gunaMilan', () => {
  it('returns total between 0 and 36', () => {
    const out = gunaMilan(
      { rashi: 'Leo', nakshatra: 'Magha', manglik: 'NO' },
      { rashi: 'Leo', nakshatra: 'Magha', manglik: 'NO' },
    );
    expect(out.totalPoints).toBeGreaterThanOrEqual(0);
    expect(out.totalPoints).toBeLessThanOrEqual(36);
    expect(out.outOf).toBe(36);
  });

  it('surfaces manglik dosha when either party is manglik', () => {
    const out = gunaMilan(
      { rashi: null, nakshatra: null, manglik: 'YES' },
      { rashi: null, nakshatra: null, manglik: 'NO' },
    );
    expect(out.doshas.manglik).toBe(true);
  });
});

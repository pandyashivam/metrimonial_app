import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

process.env.PII_ENCRYPTION_KEY ??= Buffer.alloc(32, 7).toString('base64');
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-long';
process.env.DATABASE_URL ??= 'mysql://shubhmilan:shubhmilan@localhost:3306/shubhmilan';

const bcrypt = (await import('bcrypt')).default;
const { closeEverything, inject, resetDatabase, testPrisma } = await import('./helpers.js');

interface LoginData {
  tokens: { accessToken: string; refreshToken: string };
}

async function makeUserWithProfile(email: string, phone: string, fullName: string, gender: 'MALE' | 'FEMALE') {
  const user = await testPrisma.user.create({
    data: {
      email,
      phone,
      passwordHash: await bcrypt.hash('Test#Password1', 12),
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });
  const profile = await testPrisma.profile.create({
    data: {
      userId: user.id,
      fullName,
      gender,
      dob: new Date('1996-01-01'),
      height: "5'8\"",
      maritalStatus: 'NEVER_MARRIED',
      motherTongue: 'Hindi',
      religion: 'Hindu',
      caste: 'Test',
      manglik: 'NO',
      education: 'B.Tech',
      occupation: 'Engineer',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      diet: 'VEGETARIAN',
      smoking: 'NO',
      drinking: 'NO',
      aboutMe: 'Integration test profile — at least forty characters long now.',
      familyValues: 'MODERATE',
      personalityTraits: [] as never,
      hobbies: [] as never,
      languages: [] as never,
    },
  });
  return { user, profile };
}

async function login(email: string): Promise<string> {
  const res = await inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    body: { identifier: email, password: 'Test#Password1' },
  });
  return (res.body as { ok: true; data: LoginData }).data.tokens.accessToken;
}

describe('chat integration — access control', () => {
  beforeAll(async () => resetDatabase());
  afterAll(async () => closeEverything());
  beforeEach(async () => resetDatabase());

  it('rejects message send without mutual interest (free tier)', async () => {
    const a = await makeUserWithProfile('a@ex.com', '+919900100001', 'Alice', 'FEMALE');
    const b = await makeUserWithProfile('b@ex.com', '+919900100002', 'Bob', 'MALE');

    // Create a conversation directly (simulating orphaned state) and attempt to post.
    const convo = await testPrisma.conversation.create({
      data: { profileAId: a.profile.id, profileBId: b.profile.id },
    });

    const token = await login('a@ex.com');
    const res = await inject({
      method: 'POST',
      url: `/api/v1/conversations/${convo.id}/messages`,
      accessToken: token,
      body: { ciphertext: 'Y2lwaGVy', nonce: 'bm9uY2UxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMw==' },
    });
    expect(res.status).toBe(402);
    expect(res.body.ok).toBe(false);
    if (!res.body.ok) expect(res.body.error?.code).toBe('CHAT_LOCKED');
  });

  it('allows message send after ACCEPTED interest', async () => {
    const a = await makeUserWithProfile('a2@ex.com', '+919900100003', 'Alice', 'FEMALE');
    const b = await makeUserWithProfile('b2@ex.com', '+919900100004', 'Bob', 'MALE');

    await testPrisma.interest.create({
      data: { fromProfileId: a.profile.id, toProfileId: b.profile.id, status: 'ACCEPTED' },
    });
    const convo = await testPrisma.conversation.create({
      data: { profileAId: a.profile.id, profileBId: b.profile.id },
    });

    const token = await login('a2@ex.com');
    const res = await inject({
      method: 'POST',
      url: `/api/v1/conversations/${convo.id}/messages`,
      accessToken: token,
      body: { ciphertext: 'Y2lwaGVy', nonce: 'bm9uY2UxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMw==' },
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects non-participant from reading messages', async () => {
    const a = await makeUserWithProfile('c@ex.com', '+919900100005', 'C', 'FEMALE');
    const b = await makeUserWithProfile('d@ex.com', '+919900100006', 'D', 'MALE');
    const outsider = await makeUserWithProfile('e@ex.com', '+919900100007', 'E', 'MALE');
    void outsider;
    const convo = await testPrisma.conversation.create({
      data: { profileAId: a.profile.id, profileBId: b.profile.id },
    });

    const token = await login('e@ex.com');
    const res = await inject({
      method: 'GET',
      url: `/api/v1/conversations/${convo.id}/messages`,
      accessToken: token,
    });
    expect(res.status).toBe(403);
  });
});

import { Op } from 'sequelize';

import { Profile, PartnerPreference, Verification, MatchScore, MatchLog } from '../db.js';
import { cosineSimilarity, getEmbedding, geminiEnabled } from './gemini.js';

export interface MatchReason {
  icon: string;
  text: string;
  weight: number;
}

export interface ScoredProfile {
  profileId: string;
  score: number;
  reasons: MatchReason[];
}

type ProfileWithRelations = Profile & {
  preference: PartnerPreference | null;
  verification: Verification | null;
};

const WEIGHTS = {
  religion: 15,
  motherTongue: 10,
  diet: 8,
  education: 10,
  hobbies: 12,
  caste: 8,
  manglik: 10,
  personality: 12,
  trust: 10,
  familyValues: 5,
} as const;

const EDUCATION_TIER: Record<string, number> = {
  'High School': 1, Diploma: 1,
  'B.A': 2, 'B.Com': 2, 'B.Sc': 2, 'B.Tech': 3, BBA: 2,
  MBBS: 4, CA: 4,
  'M.A': 3, 'M.Com': 3, 'M.Sc': 3, 'M.Tech': 4, MBA: 4,
  PhD: 5, Other: 2,
};

function eduTier(edu: string): number {
  for (const [key, tier] of Object.entries(EDUCATION_TIER)) {
    if (edu.toLowerCase().includes(key.toLowerCase())) return tier;
  }
  return 2;
}

function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x));
  return [];
}

export function aiMatchScore(
  me: ProfileWithRelations,
  other: ProfileWithRelations,
): ScoredProfile {
  const reasons: MatchReason[] = [];
  let score = 0;

  if (me.religion === other.religion) {
    score += WEIGHTS.religion;
    reasons.push({ icon: 'om', text: `Same religion (${me.religion})`, weight: WEIGHTS.religion });
  }

  if (me.motherTongue === other.motherTongue) {
    score += WEIGHTS.motherTongue;
    reasons.push({ icon: 'language', text: `Both speak ${me.motherTongue}`, weight: WEIGHTS.motherTongue });
  }

  if (me.diet === other.diet) {
    score += WEIGHTS.diet;
    reasons.push({ icon: 'utensils', text: `Same diet (${me.diet})`, weight: WEIGHTS.diet });
  }

  const eduDiff = Math.abs(eduTier(me.education) - eduTier(other.education));
  const eduBonus = Math.max(0, WEIGHTS.education - eduDiff * 3);
  if (eduBonus > 0) {
    score += eduBonus;
    if (eduDiff <= 1) reasons.push({ icon: 'graduation-cap', text: 'Comparable education level', weight: eduBonus });
  }

  const myHobbies = new Set(parseJsonArray(me.hobbies).map((s) => s.toLowerCase()));
  const otherHobbies = parseJsonArray(other.hobbies).map((s) => s.toLowerCase());
  const sharedHobbies = otherHobbies.filter((h) => myHobbies.has(h));
  if (sharedHobbies.length) {
    const pts = Math.min(WEIGHTS.hobbies, sharedHobbies.length * 4);
    score += pts;
    reasons.push({ icon: 'heart', text: `${sharedHobbies.length} shared interests`, weight: pts });
  }

  const prefCastes = parseJsonArray(me.preference?.castes);
  if (prefCastes.length === 0 || prefCastes.includes(other.caste)) {
    score += WEIGHTS.caste;
    reasons.push({ icon: 'people-group', text: 'Matches caste preference', weight: WEIGHTS.caste });
  }

  if (me.manglik === other.manglik) {
    score += WEIGHTS.manglik;
    reasons.push({ icon: 'star-of-life', text: 'Manglik status compatible', weight: WEIGHTS.manglik });
  }

  const myTraits = new Set(parseJsonArray(me.personalityTraits).map((s) => s.toLowerCase()));
  const shared = parseJsonArray(other.personalityTraits).filter((t) => myTraits.has(t.toLowerCase()));
  if (shared.length) {
    const pts = Math.min(WEIGHTS.personality, shared.length * 4);
    score += pts;
    reasons.push({ icon: 'user-group', text: `${shared.length} shared personality traits`, weight: pts });
  }

  const trust = other.verification?.trustScore ?? 0;
  const trustBonus = Math.round((trust / 100) * WEIGHTS.trust);
  if (trustBonus > 0) {
    score += trustBonus;
    reasons.push({ icon: 'shield-check', text: `Trust score ${trust}/100`, weight: trustBonus });
  }

  if (me.familyValues === other.familyValues) {
    score += WEIGHTS.familyValues;
    reasons.push({ icon: 'home', text: `Same family values (${me.familyValues})`, weight: WEIGHTS.familyValues });
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  reasons.sort((a, b) => b.weight - a.weight);
  return { profileId: other.id, score: clamped, reasons: reasons.slice(0, 6) };
}

export async function computeTopMatchesForProfile(profileId: string, take = 25) {
  const me = await Profile.findByPk(profileId, {
    include: [
      { model: PartnerPreference, as: 'preference' },
      { model: Verification, as: 'verification' },
    ],
  }) as ProfileWithRelations | null;
  if (!me) return [];

  const candidates = await Profile.findAll({
    where: {
      id: { [Op.ne]: me.id },
      deletedAt: null,
      ...(me.gender === 'MALE' ? { gender: 'FEMALE' } : me.gender === 'FEMALE' ? { gender: 'MALE' } : {}),
    },
    include: [
      { model: PartnerPreference, as: 'preference' },
      { model: Verification, as: 'verification' },
    ],
    limit: 500,
  }) as ProfileWithRelations[];

  const baseScores = candidates.map((c) => aiMatchScore(me, c));

  if (geminiEnabled()) {
    const myVec = await getEmbedding(me.id);
    if (myVec) {
      const boosted = await Promise.all(
        baseScores.map(async (s) => {
          const vec = await getEmbedding(s.profileId);
          if (!vec) return s;
          const sim = Math.max(0, cosineSimilarity(myVec, vec));
          const blended = Math.round(s.score * 0.7 + sim * 100 * 0.3);
          if (sim > 0.75) {
            return {
              ...s,
              score: Math.min(100, blended),
              reasons: [
                { icon: 'sparkles', text: 'Semantic "about me" alignment', weight: 10 },
                ...s.reasons,
              ].slice(0, 6),
            };
          }
          return { ...s, score: Math.min(100, blended) };
        }),
      );
      boosted.sort((a, b) => b.score - a.score);
      return boosted.slice(0, take);
    }
  }

  baseScores.sort((a, b) => b.score - a.score);
  return baseScores.slice(0, take);
}

export async function logServedMatches(viewerProfileId: string, matches: ScoredProfile[], variant = 'v1') {
  if (!matches.length) return;
  await MatchLog.bulkCreate(
    matches.map((m, i) => ({
      viewerProfileId,
      candidateId: m.profileId,
      rank: i,
      score: m.score,
      variant,
    })),
  ).catch(() => null);
}

export async function persistTopMatches(profileId: string, scores: ScoredProfile[]) {
  if (!scores.length) return;
  for (const s of scores) {
    const existing = await MatchScore.findOne({
      where: { profileAId: profileId, profileBId: s.profileId },
    });
    if (existing) {
      await existing.update({ score: s.score, reasons: s.reasons, computedAt: new Date() });
    } else {
      await MatchScore.create({
        profileAId: profileId,
        profileBId: s.profileId,
        score: s.score,
        reasons: s.reasons,
      }).catch(() => null);
    }
  }
}

export async function readCachedOrCompute(
  profileId: string,
  take = 25,
  maxAgeMs = 24 * 3600 * 1000,
): Promise<ScoredProfile[]> {
  const fresh = await MatchScore.findAll({
    where: { profileAId: profileId, computedAt: { [Op.gt]: new Date(Date.now() - maxAgeMs) } },
    order: [['score', 'DESC']],
    limit: take,
  });
  if (fresh.length) {
    return fresh.map((r) => ({
      profileId: r.profileBId,
      score: r.score,
      reasons: (r.reasons as unknown as MatchReason[]) ?? [],
    }));
  }
  const scored = await computeTopMatchesForProfile(profileId, take);
  void persistTopMatches(profileId, scored);
  return scored;
}

export async function runNightlyMatchPrecompute(opts?: { batchSize?: number; take?: number }) {
  const batchSize = opts?.batchSize ?? 25;
  const take = opts?.take ?? 50;
  const profiles = await Profile.findAll({
    where: { deletedAt: null },
    attributes: ['id'],
  });
  let processed = 0;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const chunk = profiles.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (p) => {
        const scored = await computeTopMatchesForProfile(p.id, take);
        await persistTopMatches(p.id, scored);
      }),
    );
    processed += chunk.length;
  }
  return { total: profiles.length, processed };
}

export function gunaMilan(
  a: { nakshatra?: string | null; rashi?: string | null; manglik: string },
  b: { nakshatra?: string | null; rashi?: string | null; manglik: string },
) {
  const varna = a.rashi && b.rashi ? (a.rashi === b.rashi ? 1 : 0) : 0;
  const vashya = a.rashi && b.rashi && a.rashi === b.rashi ? 2 : 1;
  const tara = a.nakshatra && b.nakshatra ? (a.nakshatra === b.nakshatra ? 3 : 1) : 0;
  const yoni = 3;
  const grahaMaitri = 4;
  const gana = 5;
  const bhakoot = a.rashi && b.rashi && a.rashi === b.rashi ? 7 : 5;
  const nadi = 8;
  const total = varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi;
  const compatibility =
    total >= 28 ? 'Excellent' : total >= 24 ? 'Good' : total >= 18 ? 'Average' : 'Not Recommended';
  return {
    totalPoints: total,
    outOf: 36 as const,
    compatibility,
    breakdown: {
      varna: { points: varna, max: 1 as const },
      vashya: { points: vashya, max: 2 as const },
      tara: { points: tara, max: 3 as const },
      yoni: { points: yoni, max: 4 as const },
      grahaMaitri: { points: grahaMaitri, max: 5 as const },
      gana: { points: gana, max: 6 as const },
      bhakoot: { points: bhakoot, max: 7 as const },
      nadi: { points: nadi, max: 8 as const },
    },
    doshas: {
      manglik: a.manglik === 'YES' || b.manglik === 'YES',
      nadiDosha: false,
      bhakootDosha: false,
    },
  };
}

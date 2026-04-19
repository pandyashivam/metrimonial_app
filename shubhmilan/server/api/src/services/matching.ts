import type { PartnerPreference, Profile, Verification } from '@prisma/client';

import { prisma } from '../db.js';

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

/**
 * Weighted signals (from BUILD_INSTRUCTIONS §11, mirroring prototype's aiMatchScore):
 *   religion (15), mother tongue (10), diet (8), education tier (10),
 *   shared hobbies (12), caste preference (8), manglik (10),
 *   personality overlap (12), trust score (10), family values (5)
 */
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
  'High School': 1,
  Diploma: 1,
  'B.A': 2,
  'B.Com': 2,
  'B.Sc': 2,
  'B.Tech': 3,
  BBA: 2,
  MBBS: 4,
  CA: 4,
  'M.A': 3,
  'M.Com': 3,
  'M.Sc': 3,
  'M.Tech': 4,
  MBA: 4,
  PhD: 5,
  Other: 2,
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

  // --- Religion ---
  if (me.religion === other.religion) {
    score += WEIGHTS.religion;
    reasons.push({ icon: 'om', text: `Same religion (${me.religion})`, weight: WEIGHTS.religion });
  }

  // --- Mother tongue ---
  if (me.motherTongue === other.motherTongue) {
    score += WEIGHTS.motherTongue;
    reasons.push({
      icon: 'language',
      text: `Both speak ${me.motherTongue}`,
      weight: WEIGHTS.motherTongue,
    });
  }

  // --- Diet ---
  if (me.diet === other.diet) {
    score += WEIGHTS.diet;
    reasons.push({ icon: 'utensils', text: `Same diet (${me.diet})`, weight: WEIGHTS.diet });
  }

  // --- Education tier closeness ---
  const eduDiff = Math.abs(eduTier(me.education) - eduTier(other.education));
  const eduBonus = Math.max(0, WEIGHTS.education - eduDiff * 3);
  if (eduBonus > 0) {
    score += eduBonus;
    if (eduDiff <= 1)
      reasons.push({
        icon: 'graduation-cap',
        text: 'Comparable education level',
        weight: eduBonus,
      });
  }

  // --- Shared hobbies ---
  const myHobbies = new Set(parseJsonArray(me.hobbies).map((s) => s.toLowerCase()));
  const otherHobbies = parseJsonArray(other.hobbies).map((s) => s.toLowerCase());
  const sharedHobbies = otherHobbies.filter((h) => myHobbies.has(h));
  if (sharedHobbies.length) {
    const pts = Math.min(WEIGHTS.hobbies, sharedHobbies.length * 4);
    score += pts;
    reasons.push({
      icon: 'heart',
      text: `${sharedHobbies.length} shared interests`,
      weight: pts,
    });
  }

  // --- Caste preference ---
  const prefCastes = parseJsonArray(me.preference?.castes);
  if (prefCastes.length === 0 || prefCastes.includes(other.caste)) {
    score += WEIGHTS.caste;
    reasons.push({
      icon: 'people-group',
      text: 'Matches caste preference',
      weight: WEIGHTS.caste,
    });
  }

  // --- Manglik ---
  if (me.manglik === other.manglik) {
    score += WEIGHTS.manglik;
    reasons.push({
      icon: 'star-of-life',
      text: 'Manglik status compatible',
      weight: WEIGHTS.manglik,
    });
  }

  // --- Personality traits overlap ---
  const myTraits = new Set(parseJsonArray(me.personalityTraits).map((s) => s.toLowerCase()));
  const shared = parseJsonArray(other.personalityTraits).filter((t) =>
    myTraits.has(t.toLowerCase()),
  );
  if (shared.length) {
    const pts = Math.min(WEIGHTS.personality, shared.length * 4);
    score += pts;
    reasons.push({
      icon: 'user-group',
      text: `${shared.length} shared personality traits`,
      weight: pts,
    });
  }

  // --- Trust score ---
  const trust = other.verification?.trustScore ?? 0;
  const trustBonus = Math.round((trust / 100) * WEIGHTS.trust);
  if (trustBonus > 0) {
    score += trustBonus;
    reasons.push({
      icon: 'shield-check',
      text: `Trust score ${trust}/100`,
      weight: trustBonus,
    });
  }

  // --- Family values ---
  if (me.familyValues === other.familyValues) {
    score += WEIGHTS.familyValues;
    reasons.push({
      icon: 'home',
      text: `Same family values (${me.familyValues})`,
      weight: WEIGHTS.familyValues,
    });
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  reasons.sort((a, b) => b.weight - a.weight);
  return { profileId: other.id, score: clamped, reasons: reasons.slice(0, 6) };
}

export async function computeTopMatchesForProfile(profileId: string, take = 25) {
  const me = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { preference: true, verification: true },
  });
  if (!me) return [];

  const candidates = await prisma.profile.findMany({
    where: {
      id: { not: me.id },
      deletedAt: null,
      gender: me.gender === 'MALE' ? 'FEMALE' : me.gender === 'FEMALE' ? 'MALE' : undefined,
    },
    include: { preference: true, verification: true },
    take: 500,
  });

  const scored = candidates.map((c) => aiMatchScore(me, c));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, take);
}

/**
 * Ashtakoot (8-point Guna Milan) — simplified. A real implementation uses birth-time
 * ephemeris; this one approximates from nakshatra/rashi/manglik available in our schema.
 */
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

import { prisma } from '../db.js';

/**
 * Plan tier resolution + entitlement checks.
 *
 * We model plans as four tiers. Higher tiers are a superset of lower tiers.
 *   FREE      — everyone, forever
 *   SILVER    — unlimited interests, who-viewed-me, priority listing, advanced filters
 *   GOLD      — all Silver + direct contact visibility, verified badge priority, chat-before-match
 *   PLATINUM  — all Gold + top spotlight, horoscope report, dedicated assistant
 *
 * Tier resolution: FREE is the default. An ACTIVE subscription whose endsAt is in the future
 * bumps the user's tier to the one attached to that plan. Plan names are matched by
 * lowercased exact match (plans are seeded with these names in prisma/seed.ts).
 */

export type PlanTier = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';

const TIER_ORDER: Record<PlanTier, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export function tierAtLeast(have: PlanTier, need: PlanTier): boolean {
  return TIER_ORDER[have] >= TIER_ORDER[need];
}

function planNameToTier(name: string): PlanTier {
  const n = name.toLowerCase();
  if (n.includes('platinum')) return 'PLATINUM';
  if (n.includes('gold')) return 'GOLD';
  if (n.includes('silver')) return 'SILVER';
  return 'FREE';
}

export async function userTier(userId: string): Promise<PlanTier> {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
    include: { plan: true },
    orderBy: { endsAt: 'desc' },
  });
  if (!sub) return 'FREE';
  return planNameToTier(sub.plan.name);
}

// ---------- Entitlement helpers ----------

export const FREE_MONTHLY_INTEREST_LIMIT = 5;

export async function interestsUsedThisMonth(fromProfileId: string): Promise<number> {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  return prisma.interest.count({
    where: { fromProfileId, sentAt: { gte: since } },
  });
}

export interface Entitlements {
  tier: PlanTier;
  canSendMoreInterests: boolean;
  canSeeWhoViewedMe: boolean;
  canUseAdvancedFilters: boolean;
  canChatBeforeMatch: boolean;
  canSeeContactDetails: boolean;
  canAccessHoroscopeReport: boolean;
  interestsRemainingThisMonth: number;
}

export async function resolveEntitlements(userId: string, profileId?: string | null): Promise<Entitlements> {
  const tier = await userTier(userId);
  const unlimitedInterests = tierAtLeast(tier, 'SILVER');

  let remaining = Number.POSITIVE_INFINITY;
  if (!unlimitedInterests && profileId) {
    const used = await interestsUsedThisMonth(profileId);
    remaining = Math.max(0, FREE_MONTHLY_INTEREST_LIMIT - used);
  } else if (!unlimitedInterests) {
    remaining = FREE_MONTHLY_INTEREST_LIMIT;
  }

  return {
    tier,
    canSendMoreInterests: unlimitedInterests || remaining > 0,
    canSeeWhoViewedMe: tierAtLeast(tier, 'SILVER'),
    canUseAdvancedFilters: tierAtLeast(tier, 'SILVER'),
    canChatBeforeMatch: tierAtLeast(tier, 'GOLD'),
    canSeeContactDetails: tierAtLeast(tier, 'GOLD'),
    canAccessHoroscopeReport: tierAtLeast(tier, 'PLATINUM'),
    interestsRemainingThisMonth: Number.isFinite(remaining) ? remaining : -1,
  };
}

import { Op } from 'sequelize';

import { Subscription, Plan, Interest } from '../db.js';

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
  const sub = await Subscription.findOne({
    where: { userId, status: 'ACTIVE', endsAt: { [Op.gt]: new Date() } },
    include: [{ model: Plan, as: 'plan' }],
    order: [['endsAt', 'DESC']],
  });
  if (!sub || !sub.plan) return 'FREE';
  return planNameToTier(sub.plan.name);
}

export const FREE_MONTHLY_INTEREST_LIMIT = 5;

export async function interestsUsedThisMonth(fromProfileId: string): Promise<number> {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  return Interest.count({
    where: { fromProfileId, sentAt: { [Op.gte]: since } },
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

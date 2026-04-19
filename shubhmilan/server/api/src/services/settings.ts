import { prisma } from '../db.js';

/**
 * Typed façade over the `Setting` key/value table. Each feature flag has a stable key; we
 * cache reads for 30s so the maintenance-mode hot path doesn't add a DB roundtrip per
 * request (the toggle itself is flushed via `bustCache()` after admin writes).
 */

interface Cached {
  value: unknown;
  fetchedAt: number;
}

const TTL_MS = 30_000;
const cache = new Map<string, Cached>();

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
    return hit.value as T;
  }
  const row = await prisma.setting.findUnique({ where: { key } });
  const value = (row?.value ?? null) as T | null;
  cache.set(key, { value, fetchedAt: Date.now() });
  return value;
}

export async function setSetting<T>(key: string, value: T, updatedBy?: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as unknown as import('@prisma/client').Prisma.InputJsonValue, updatedBy },
    create: { key, value: value as unknown as import('@prisma/client').Prisma.InputJsonValue, updatedBy },
  });
  cache.delete(key);
}

export function bustCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

// ---------- Feature-specific keys ----------

export const SETTING_KEYS = {
  maintenanceMode: 'feature.maintenance',
  signupsDisabled: 'feature.signups_disabled',
} as const;

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
  // Optional explicit allowlist of admin user IDs who can still make requests; otherwise
  // any ADMIN/SUPERADMIN can bypass.
  allowUserIds?: string[];
}

export async function getMaintenanceMode(): Promise<MaintenanceMode> {
  const v = await getSetting<MaintenanceMode>(SETTING_KEYS.maintenanceMode);
  return v ?? { enabled: false, message: 'ShubhMilan is temporarily offline. Please check back soon.' };
}

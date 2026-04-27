import { Setting } from '../db.js';

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
  const row = await Setting.findOne({ where: { key } });
  const value = (row?.value ?? null) as T | null;
  cache.set(key, { value, fetchedAt: Date.now() });
  return value;
}

export async function setSetting<T>(key: string, value: T, updatedBy?: string) {
  const existing = await Setting.findOne({ where: { key } });
  if (existing) {
    await existing.update({ value: value as unknown, updatedBy });
  } else {
    await Setting.create({ key, value: value as unknown, updatedBy });
  }
  cache.delete(key);
}

export function bustCache(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export const SETTING_KEYS = {
  maintenanceMode: 'feature.maintenance',
  signupsDisabled: 'feature.signups_disabled',
} as const;

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
  allowUserIds?: string[];
}

export async function getMaintenanceMode(): Promise<MaintenanceMode> {
  const v = await getSetting<MaintenanceMode>(SETTING_KEYS.maintenanceMode);
  return v ?? { enabled: false, message: 'ShubhMilan is temporarily offline. Please check back soon.' };
}

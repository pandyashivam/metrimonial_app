import { create } from 'zustand';

/**
 * Discovery filter state, shared across tabs. Changing these values triggers the Home and
 * Search screens to refetch because the filter snapshot is included in the query key.
 */
export interface FilterState {
  gender?: 'Male' | 'Female' | 'Other';
  religion?: string;
  caste?: string;
  motherTongue?: string;
  city?: string;
  state?: string;
  ageMin?: number;
  ageMax?: number;
  diet?: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Jain Vegetarian' | 'Vegan';
  manglik?: 'No' | 'Yes' | 'Anshik (Partial)' | "Don't Know";
  education?: string;
  verified?: boolean;
  online?: boolean;
  set: (patch: Partial<FilterState>) => void;
  reset: () => void;
}

const defaults: Omit<FilterState, 'set' | 'reset'> = {};

export const useFilters = create<FilterState>((set) => ({
  ...defaults,
  set: (patch) => set(patch),
  reset: () =>
    set({
      gender: undefined,
      religion: undefined,
      caste: undefined,
      motherTongue: undefined,
      city: undefined,
      state: undefined,
      ageMin: undefined,
      ageMax: undefined,
      diet: undefined,
      manglik: undefined,
      education: undefined,
      verified: undefined,
      online: undefined,
    }),
}));

/** Build the query object passed to api.profiles.list — omits falsy keys. */
export function toDiscoveryQuery(f: FilterState): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (f.gender) out.gender = f.gender;
  if (f.religion) out.religion = f.religion;
  if (f.caste) out.caste = f.caste;
  if (f.motherTongue) out.motherTongue = f.motherTongue;
  if (f.city) out.city = f.city;
  if (f.state) out.state = f.state;
  if (f.ageMin) out.ageMin = f.ageMin;
  if (f.ageMax) out.ageMax = f.ageMax;
  if (f.diet) out.diet = f.diet;
  if (f.manglik) out.manglik = f.manglik;
  if (f.education) out.education = f.education;
  if (f.verified) out.verified = f.verified;
  if (f.online) out.online = f.online;
  return out;
}

/** Keyed stable object used in React Query keys (JSON-stable ordering). */
export function filterSnapshot(f: FilterState): string {
  const q = toDiscoveryQuery(f);
  return JSON.stringify(Object.keys(q).sort().reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = q[k];
    return acc;
  }, {}));
}

/**
 * Translates the user-facing strings produced by the shared Zod validation
 * schemas (mixed case, "Anshik (Partial)", "Don't Know") into the uppercase
 * snake_case values our Sequelize ENUM columns store. The schemas were
 * authored for UI ergonomics; the DB was authored for query simplicity. This
 * module bridges the two so route handlers can pass `parsed.data` straight
 * into Sequelize without each one re-deriving the mapping.
 *
 * One source of truth — if a new enum value is added, add it here.
 */

import {
  DIETS,
  FAMILY_TYPES,
  FAMILY_VALUES_ENUM,
  GENDERS,
  MANGLIK_STATUSES,
  MARITAL_STATUSES,
  YES_NO_OCCASIONAL,
} from '../db.js';

type Manglik = (typeof MANGLIK_STATUSES)[number];
type FamilyType = (typeof FAMILY_TYPES)[number];
type FamilyValues = (typeof FAMILY_VALUES_ENUM)[number];
type Diet = (typeof DIETS)[number];
type YesNo = (typeof YES_NO_OCCASIONAL)[number];
type Gender = (typeof GENDERS)[number];
type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export function mapGender(v: string): Gender {
  const upper = v.toUpperCase();
  return (GENDERS as readonly string[]).includes(upper) ? (upper as Gender) : 'OTHER';
}

export function mapMaritalStatus(v: string): MaritalStatus {
  const upper = v.replace(/\s+/g, '_').toUpperCase();
  return (MARITAL_STATUSES as readonly string[]).includes(upper)
    ? (upper as MaritalStatus)
    : 'NEVER_MARRIED';
}

export function mapDiet(v: string): Diet {
  const upper = v.replace(/[-\s]+/g, '_').toUpperCase();
  return (DIETS as readonly string[]).includes(upper) ? (upper as Diet) : 'VEGETARIAN';
}

export function mapYesNo(v: string | null | undefined): YesNo {
  if (!v) return 'NO';
  const upper = v.toUpperCase();
  return (YES_NO_OCCASIONAL as readonly string[]).includes(upper) ? (upper as YesNo) : 'NO';
}

export function mapManglik(v: string | null | undefined): Manglik {
  if (!v) return 'UNKNOWN';
  const lower = v.toLowerCase();
  if (lower === 'yes') return 'YES';
  if (lower === 'no') return 'NO';
  if (lower.startsWith('anshik')) return 'ANSHIK';
  return 'UNKNOWN';
}

export function mapFamilyType(v: string): FamilyType {
  return v.toUpperCase() === 'JOINT' ? 'JOINT' : 'NUCLEAR';
}

export function mapFamilyValues(v: string | null | undefined): FamilyValues {
  if (!v) return 'MODERATE';
  const upper = v.toUpperCase();
  return (FAMILY_VALUES_ENUM as readonly string[]).includes(upper)
    ? (upper as FamilyValues)
    : 'MODERATE';
}

export function mapDietArray(values: readonly string[] | null | undefined): Diet[] {
  return (values ?? []).map(mapDiet);
}

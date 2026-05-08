import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from './secure-storage';

/**
 * Onboarding draft state. Persisted via the platform secureStorage adapter so
 * partial drafts survive app restarts — a major drop-off point for matrimonial
 * onboarding (six screens worth of decisions). Server-side state lives in the
 * relevant /me/* tables once each step's "Continue" is tapped; the local
 * draft is overwritten by the server's source of truth on a successful save.
 */
export interface OnboardingState {
  // Step 1: basics
  fullName: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  height: string;
  maritalStatus: string;
  motherTongue: string;
  religion: string;
  caste: string;
  subCaste: string;
  gotra: string;
  manglik: string;
  education: string;
  occupation: string;
  income: string;
  city: string;
  state: string;
  country: string;
  diet: string;
  smoking: 'No' | 'Occasionally' | 'Yes';
  drinking: 'No' | 'Occasionally' | 'Yes';
  aboutMe: string;
  familyValues: 'Traditional' | 'Moderate' | 'Liberal';
  personalityTraits: string[];
  hobbies: string[];
  languages: string[];
  // Step 2: family
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  familyType: 'Nuclear' | 'Joint';
  familyStatus: string;
  nativePlace: string;
  // Step 3: horoscope
  birthTime: string;
  birthPlace: string;
  rashi: string;
  nakshatra: string;
  // Step 4: preference
  ageMin: number;
  ageMax: number;
  prefReligions: string[];
  prefCastes: string[];
  prefCities: string[];

  set: (patch: Partial<OnboardingState>) => void;
  reset: () => void;
}

const initial = {
  fullName: '',
  gender: '' as const,
  dob: '',
  height: '',
  maritalStatus: 'Never Married',
  motherTongue: '',
  religion: '',
  caste: '',
  subCaste: '',
  gotra: '',
  manglik: 'No',
  education: '',
  occupation: '',
  income: '',
  city: '',
  state: '',
  country: 'India',
  diet: 'Vegetarian',
  smoking: 'No' as const,
  drinking: 'No' as const,
  aboutMe: '',
  familyValues: 'Moderate' as const,
  personalityTraits: [] as string[],
  hobbies: [] as string[],
  languages: [] as string[],
  fatherName: '',
  fatherOccupation: '',
  motherName: '',
  motherOccupation: '',
  familyType: 'Nuclear' as const,
  familyStatus: 'Middle Class',
  nativePlace: '',
  birthTime: '',
  birthPlace: '',
  rashi: '',
  nakshatra: '',
  ageMin: 24,
  ageMax: 32,
  prefReligions: [] as string[],
  prefCastes: [] as string[],
  prefCities: [] as string[],
};

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initial,
      set: (patch) => set(patch),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'shubhmilan.onboarding.draft',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (key) => secureStorage.getItem(key),
        setItem: (key, value) => secureStorage.setItem(key, value),
        removeItem: (key) => secureStorage.removeItem(key),
      })),
      // Don't persist methods or the trivial defaults — only the user's input.
      partialize: (state) => {
        const { set: _set, reset: _reset, ...rest } = state;
        return rest;
      },
    },
  ),
);

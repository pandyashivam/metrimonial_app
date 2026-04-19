import { z } from 'zod';

import {
  DietEnum,
  FamilyTypeEnum,
  FamilyValuesEnum,
  GenderEnum,
  ManglikEnum,
  MaritalStatusEnum,
  PhotoPrivacyEnum,
  ReligionEnum,
  YesNoOccasionalEnum,
} from './enums.js';

export const ProfileInput = z
  .object({
    fullName: z.string().min(2).max(80),
    gender: GenderEnum,
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ISO date YYYY-MM-DD'),
    height: z.string().min(3).max(10),
    weight: z.number().int().positive().max(300).optional().nullable(),
    maritalStatus: MaritalStatusEnum,
    motherTongue: z.string().min(2).max(40),
    religion: ReligionEnum,
    caste: z.string().min(2).max(60),
    subCaste: z.string().max(60).optional().nullable(),
    gotra: z.string().max(60).optional().nullable(),
    manglik: ManglikEnum,
    rashi: z.string().max(40).optional().nullable(),
    nakshatra: z.string().max(40).optional().nullable(),
    education: z.string().min(2).max(80),
    occupation: z.string().min(2).max(80),
    income: z.string().max(40).optional().nullable(),
    city: z.string().min(2).max(60),
    state: z.string().min(2).max(60),
    country: z.string().min(2).max(60),
    diet: DietEnum,
    smoking: YesNoOccasionalEnum,
    drinking: YesNoOccasionalEnum,
    aboutMe: z.string().min(40).max(1500),
    familyValues: FamilyValuesEnum,
    personalityTraits: z.array(z.string().min(1).max(30)).max(15).default([]),
    hobbies: z.array(z.string().min(1).max(30)).max(20).default([]),
    languages: z.array(z.string().min(1).max(30)).max(10).default([]),
    complexion: z.string().max(30).optional().nullable(),
    bodyType: z.string().max(30).optional().nullable(),
  })
  .strict();

export const FamilyInput = z
  .object({
    fatherName: z.string().min(2).max(80),
    fatherOccupation: z.string().max(80).optional().nullable(),
    motherName: z.string().min(2).max(80),
    motherOccupation: z.string().max(80).optional().nullable(),
    siblings: z
      .array(
        z.object({
          relation: z.enum(['brother', 'sister']),
          maritalStatus: z.enum(['married', 'unmarried']),
        }),
      )
      .default([]),
    familyType: FamilyTypeEnum,
    familyStatus: z.enum(['Middle Class', 'Upper Middle Class', 'Rich', 'Affluent']),
    nativePlace: z.string().max(80).optional().nullable(),
  })
  .strict();

export const HoroscopeInput = z
  .object({
    birthTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
    birthPlace: z.string().min(2).max(80),
    charan: z.string().max(40).optional().nullable(),
    nadi: z.enum(['Aadi', 'Madhya', 'Antya']).optional().nullable(),
    gana: z.enum(['Deva', 'Manushya', 'Rakshasa']).optional().nullable(),
    yoni: z.string().max(40).optional().nullable(),
    doshas: z
      .object({
        manglik: z.boolean().default(false),
        nadiDosha: z.boolean().default(false),
        bhakootDosha: z.boolean().default(false),
      })
      .default({ manglik: false, nadiDosha: false, bhakootDosha: false }),
  })
  .strict();

export const PhotoPrivacyInput = z.object({ privacy: PhotoPrivacyEnum }).strict();

export type ProfileInput = z.infer<typeof ProfileInput>;
export type FamilyInput = z.infer<typeof FamilyInput>;
export type HoroscopeInput = z.infer<typeof HoroscopeInput>;

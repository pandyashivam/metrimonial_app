import { z } from 'zod';

import { DietEnum, ManglikEnum, ReligionEnum } from './enums.js';

export const PartnerPreferenceInput = z
  .object({
    ageMin: z.number().int().min(18).max(80),
    ageMax: z.number().int().min(18).max(80),
    heightMin: z.string().max(10).optional().nullable(),
    heightMax: z.string().max(10).optional().nullable(),
    religions: z.array(ReligionEnum).max(8).default([]),
    castes: z.array(z.string().min(1).max(60)).max(30).default([]),
    motherTongues: z.array(z.string().min(1).max(40)).max(20).default([]),
    education: z.array(z.string().min(1).max(80)).max(20).default([]),
    occupation: z.array(z.string().min(1).max(80)).max(20).default([]),
    incomeMin: z.string().max(40).optional().nullable(),
    cities: z.array(z.string().min(1).max(60)).max(50).default([]),
    diet: z.array(DietEnum).max(5).default([]),
    manglik: ManglikEnum.optional().nullable(),
  })
  .strict()
  .refine((v) => v.ageMax >= v.ageMin, { message: 'ageMax must be >= ageMin', path: ['ageMax'] });

export const DiscoveryFilter = z
  .object({
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    ageMin: z.coerce.number().int().min(18).max(80).optional(),
    ageMax: z.coerce.number().int().min(18).max(80).optional(),
    religion: z.string().max(40).optional(),
    caste: z.string().max(60).optional(),
    motherTongue: z.string().max(40).optional(),
    city: z.string().max(60).optional(),
    state: z.string().max(60).optional(),
    education: z.string().max(80).optional(),
    diet: DietEnum.optional(),
    manglik: ManglikEnum.optional(),
    verified: z.coerce.boolean().optional(),
    online: z.coerce.boolean().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type PartnerPreferenceInput = z.infer<typeof PartnerPreferenceInput>;
export type DiscoveryFilter = z.infer<typeof DiscoveryFilter>;

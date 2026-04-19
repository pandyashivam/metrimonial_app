import { z } from 'zod';

import { InterestStatusEnum } from './enums.js';

export const SendInterestInput = z
  .object({
    toProfileId: z.string().min(1),
    note: z.string().max(240).optional(),
  })
  .strict();

export const RespondInterestInput = z
  .object({
    action: z.enum(['ACCEPT', 'DECLINE', 'WITHDRAW']),
  })
  .strict();

export const ReportInput = z
  .object({
    reason: z.enum([
      'FAKE_PROFILE',
      'INAPPROPRIATE',
      'SPAM',
      'HARASSMENT',
      'ASKING_MONEY',
      'MARRIED',
      'OTHER',
    ]),
    detail: z.string().max(1000).optional(),
  })
  .strict();

export const BlockInput = z
  .object({
    reason: z.string().max(200).optional(),
  })
  .strict();

export { InterestStatusEnum };

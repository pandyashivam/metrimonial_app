import { z } from 'zod';

export const SendMessageInput = z
  .object({
    body: z.string().min(1).max(4000),
    mediaUrl: z.string().url().optional().nullable(),
  })
  .strict();

export const ListMessagesQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .strict();

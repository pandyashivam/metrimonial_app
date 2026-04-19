import { z } from 'zod';

/**
 * Messages are end-to-end encrypted. Clients do nacl.box(plaintext, nonce, peerPublicKey,
 * secretKey) and send the result here. The server only stores the opaque blob.
 */
export const SendMessageInput = z
  .object({
    ciphertext: z.string().min(1).max(12_000),
    nonce: z.string().length(32), // 24 raw bytes base64 = 32 chars (no padding) or 36 with padding
    mediaUrl: z.string().url().optional().nullable(),
    mediaMime: z.string().max(100).optional().nullable(),
  })
  .strict();

export const ListMessagesQuery = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .strict();

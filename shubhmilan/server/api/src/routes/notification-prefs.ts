import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { prisma } from '../db.js';
import { fail, ok } from '../lib/response.js';

const PrefsInput = z
  .object({
    newInterest: z.boolean().optional(),
    interestAccepted: z.boolean().optional(),
    newMessage: z.boolean().optional(),
    profileViewed: z.boolean().optional(),
    premiumMatch: z.boolean().optional(),
    verificationApproved: z.boolean().optional(),
  })
  .strict();

/**
 * Per-category push preferences. Missing row = all categories enabled.
 * Client-side the Settings screen posts partials; server upserts.
 */
export async function notificationPrefRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/me/notification-prefs', async (request, reply) => {
    const row = await prisma.notificationPref.findUnique({
      where: { userId: request.auth!.sub },
    });
    // Default all-on if the user hasn't explicitly opted out of anything yet.
    return ok(
      reply,
      row ?? {
        userId: request.auth!.sub,
        newInterest: true,
        interestAccepted: true,
        newMessage: true,
        profileViewed: true,
        premiumMatch: true,
        verificationApproved: true,
      },
    );
  });

  app.put('/me/notification-prefs', async (request, reply) => {
    const parsed = PrefsInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const row = await prisma.notificationPref.upsert({
      where: { userId: request.auth!.sub },
      update: parsed.data,
      create: { userId: request.auth!.sub, ...parsed.data },
    });
    return ok(reply, row);
  });
}

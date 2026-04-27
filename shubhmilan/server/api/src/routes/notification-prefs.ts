import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { NotificationPref } from '../db.js';
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

export async function notificationPrefRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.get('/me/notification-prefs', async (request, reply) => {
    const row = await NotificationPref.findOne({ where: { userId: request.auth!.sub } });
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
    const existing = await NotificationPref.findOne({ where: { userId: request.auth!.sub } });
    if (existing) {
      await existing.update(parsed.data);
      return ok(reply, existing);
    }
    const row = await NotificationPref.create({ userId: request.auth!.sub, ...parsed.data });
    return ok(reply, row);
  });
}

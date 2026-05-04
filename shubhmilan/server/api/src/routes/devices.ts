import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { Device } from '../db.js';
import { fail, ok } from '../lib/response.js';

const RegisterDeviceInput = z
  .object({
    // Native Expo tokens are short (~50 chars). Web Push subscriptions ship as
    // stringified JSON (~500 chars typical) — both share this column, so the
    // upper bound here matches the Device.fcmToken column width.
    fcmToken: z.string().min(10).max(2048),
    platform: z.enum(['ios', 'android', 'web']),
  })
  .strict();

export async function deviceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAuth);

  app.post('/me/devices', async (request, reply) => {
    const parsed = RegisterDeviceInput.safeParse(request.body);
    if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
    const existing = await Device.findOne({ where: { fcmToken: parsed.data.fcmToken } });
    if (existing) {
      await existing.update({
        userId: request.auth!.sub,
        platform: parsed.data.platform,
        lastSeenAt: new Date(),
      });
      return ok(reply, { id: existing.id }, 201);
    }
    const device = await Device.create({
      userId: request.auth!.sub,
      fcmToken: parsed.data.fcmToken,
      platform: parsed.data.platform,
    });
    return ok(reply, { id: device.id }, 201);
  });

  app.delete<{ Body: { fcmToken: string } }>('/me/devices', async (request, reply) => {
    const token = request.body?.fcmToken;
    if (!token) return fail(reply, 400, 'VALIDATION', 'fcmToken required');
    await Device.destroy({
      where: { userId: request.auth!.sub, fcmToken: token },
    });
    return ok(reply, { ok: true as const });
  });
}

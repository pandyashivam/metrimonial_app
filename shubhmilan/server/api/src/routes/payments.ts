import { CreateOrderInput, VerifyPaymentInput } from '@shubhmilan/validation';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db.js';
import { env } from '../env.js';
import { fail, ok } from '../lib/response.js';
import { createOrder, verifyPaymentSignature, verifyWebhookSignature } from '../services/razorpay.js';

export async function paymentRoutes(app: FastifyInstance) {
  // ---- Webhook scope: PUBLIC, signature-gated ----
  // We need the RAW body to verify the HMAC. Register a custom content-type parser that
  // stashes the raw buffer on the request before JSON parsing.
  await app.register(async (scope) => {
    scope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (request, body, done) => {
        try {
          const raw = (body as Buffer).toString('utf8');
          const parsed = raw.length > 0 ? JSON.parse(raw) : {};
          (request as unknown as { rawBody?: string }).rawBody = raw;
          done(null, parsed);
        } catch (err) {
          done(err as Error, undefined);
        }
      },
    );

    scope.post('/webhook', async (request, reply) => {
      const signature = request.headers['x-razorpay-signature'] as string | undefined;
      if (!signature) return fail(reply, 400, 'NO_SIGNATURE', 'Missing signature');
      const raw = (request as unknown as { rawBody?: string }).rawBody ?? '';
      if (!verifyWebhookSignature(raw, signature)) {
        return fail(reply, 400, 'BAD_SIGNATURE', 'Invalid signature');
      }

      const event = (request.body ?? {}) as {
        event?: string;
        payload?: { payment?: { entity?: { order_id?: string; id?: string; status?: string } } };
      };
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id) {
        const sub = await prisma.subscription.findFirst({
          where: { razorpayOrderId: payment.order_id },
        });
        if (sub && event.event === 'payment.captured') {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'ACTIVE', razorpayPaymentId: payment.id ?? null },
          });
        } else if (sub && event.event === 'payment.failed') {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: 'FAILED' },
          });
        }
      }
      return ok(reply, { received: true });
    });
  });

  // ---- Auth'd endpoints ----
  await app.register(async (scope) => {
    scope.addHook('preHandler', app.requireAuth);

    scope.get('/me/subscription', async (request, reply) => {
      const row = await prisma.subscription.findFirst({
        where: { userId: request.auth!.sub, status: 'ACTIVE' },
        orderBy: { endsAt: 'desc' },
        include: { plan: true },
      });
      return ok(reply, row);
    });

    scope.post('/subscriptions/order', async (request, reply) => {
      const parsed = CreateOrderInput.safeParse(request.body);
      if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');

      const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
      if (!plan || !plan.active) return fail(reply, 404, 'PLAN_NOT_FOUND', 'Plan unavailable');
      if (plan.priceInr === 0) return fail(reply, 400, 'FREE_PLAN', 'No payment needed');

      const receipt = `sub_${request.auth!.sub}_${Date.now()}`;
      const order = await createOrder(plan.priceInr, receipt);

      const now = new Date();
      const endsAt = new Date(now.getTime() + plan.durationDays * 86400 * 1000);
      await prisma.subscription.create({
        data: {
          userId: request.auth!.sub,
          planId: plan.id,
          status: 'PENDING',
          startsAt: now,
          endsAt,
          razorpayOrderId: order.id,
        },
      });

      return ok(reply, {
        orderId: order.id,
        amount: order.amount,
        keyId: env.RAZORPAY_KEY_ID,
        receipt,
      });
    });

    scope.post('/subscriptions/verify', async (request, reply) => {
      const parsed = VerifyPaymentInput.safeParse(request.body);
      if (!parsed.success) return fail(reply, 400, 'VALIDATION', 'Invalid payload');
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;
      if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
        return fail(reply, 400, 'BAD_SIGNATURE', 'Signature mismatch');
      }
      const sub = await prisma.subscription.findFirst({
        where: { razorpayOrderId, userId: request.auth!.sub },
      });
      if (!sub) return fail(reply, 404, 'NOT_FOUND', 'Subscription not found');
      const updated = await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE', razorpayPaymentId, razorpaySignature },
      });
      return ok(reply, updated);
    });
  });
}

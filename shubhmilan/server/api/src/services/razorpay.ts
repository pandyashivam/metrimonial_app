import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '../env.js';

/**
 * Razorpay helpers. We keep the SDK thin — most operations go through signed REST via fetch —
 * so the service has zero native deps and works in containers without node-gyp.
 */

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export async function createOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    // Dev fallback: synthesize a fake order so the full flow is exercisable without keys.
    return {
      id: `order_dev_${Date.now()}`,
      amount: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
    };
  }
  const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Razorpay order failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as RazorpayOrder;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return true; // dev mode
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeCompareHex(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeCompareHex(expected, signature);
}

function safeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

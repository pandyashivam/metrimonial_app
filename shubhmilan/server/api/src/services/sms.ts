/* eslint-disable no-console */
import { env } from '../env.js';

/**
 * SMS sender with provider priority: MSG91 (India-native) → Twilio (global) → dev console.
 * Every provider is fetch-only so there are zero native deps.
 */

export interface SmsPayload {
  to: string;
  body: string;
  purpose?: string;
}

async function sendViaMsg91(p: SmsPayload): Promise<boolean> {
  if (!env.MSG91_AUTH_KEY) return false;
  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: env.MSG91_AUTH_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: env.MSG91_TEMPLATE_ID,
        sender: env.MSG91_SENDER_ID,
        short_url: 0,
        recipients: [{ mobiles: p.to.replace(/^\+/, ''), body: p.body }],
      }),
    });
    if (!res.ok) {
      console.warn('[msg91] HTTP', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[msg91] error', err);
    return false;
  }
}

async function sendViaTwilio(p: SmsPayload): Promise<boolean> {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) return false;
  try {
    const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const form = new URLSearchParams({ From: env.TWILIO_FROM, To: p.to, Body: p.body });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${auth}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      },
    );
    if (!res.ok) {
      console.warn('[twilio] HTTP', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[twilio] error', err);
    return false;
  }
}

export async function sendSms(p: SmsPayload): Promise<void> {
  if (await sendViaMsg91(p)) return;
  if (await sendViaTwilio(p)) return;
  // Dev fallback — log to console so developers can grab the code.
  console.info(`📱 [DEV SMS] ${p.to} | ${p.purpose ?? ''} | ${p.body}`);
}

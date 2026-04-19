import { otpEmail, sendEmail } from '../services/email.js';
import { sendSms } from '../services/sms.js';

/**
 * Thin façade the rest of the code calls. Delegates to real providers (MSG91 / Twilio /
 * SMTP) and falls back to console logging when credentials aren't configured — so dev
 * machines without provider keys still surface the OTP for testing.
 */
export async function sendOtpSms(target: string, code: string, purpose: string) {
  await sendSms({
    to: target,
    body: `${code} is your ShubhMilan verification code. Valid for 10 minutes. Do not share with anyone.`,
    purpose,
  });
}

export async function sendOtpEmail(target: string, code: string, purpose: string) {
  const { subject, html } = otpEmail(code, purpose);
  await sendEmail({ to: target, subject, html, purpose });
}

export function isEmail(s: string) {
  return /@/.test(s);
}

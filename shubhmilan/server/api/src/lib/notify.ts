/* eslint-disable no-console */
import { env } from '../env.js';

/**
 * Thin SMS/email facade. In dev, prints the OTP to the console so you don't
 * need Twilio/MSG91 keys. Wire real providers in production.
 */
export async function sendOtpSms(target: string, code: string, purpose: string) {
  if (env.NODE_ENV === 'development' || !process.env.TWILIO_ACCOUNT_SID) {
    console.info(`📱 [DEV SMS] ${target} | ${purpose} | code=${code}`);
    return;
  }
  // TODO: integrate Twilio / MSG91 here.
}

export async function sendOtpEmail(target: string, code: string, purpose: string) {
  if (env.NODE_ENV === 'development' || !env.SMTP_HOST) {
    console.info(`✉️  [DEV EMAIL] ${target} | ${purpose} | code=${code}`);
    return;
  }
  // TODO: integrate nodemailer / transactional provider here.
}

export function isEmail(s: string) {
  return /@/.test(s);
}

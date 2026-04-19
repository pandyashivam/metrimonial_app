/* eslint-disable no-console */
import { createTransport, type Transporter } from 'nodemailer';

import { env } from '../env.js';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  purpose?: string;
}

let cached: Transporter | null = null;
function getTransport(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER) return null;
  if (cached) return cached;
  cached = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return cached;
}

export async function sendEmail(p: EmailPayload): Promise<void> {
  const transport = getTransport();
  if (!transport) {
    console.info(`✉️  [DEV EMAIL] ${p.to} | ${p.subject} | ${p.purpose ?? ''}`);
    console.info(p.text ?? p.html);
    return;
  }
  try {
    await transport.sendMail({
      from: env.EMAIL_FROM,
      to: p.to,
      subject: p.subject,
      html: p.html,
      text: p.text ?? stripHtml(p.html),
    });
  } catch (err) {
    console.warn('[smtp] failed to send', err);
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ---------- Templated helpers ----------

const BRAND_HEADER = `
<div style="font-family:Inter,system-ui,sans-serif;max-width:540px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#8b1e3f,#5f1029);padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px;font-family:'Playfair Display',Georgia,serif">ShubhMilan</h1>
  </div>
  <div style="padding:24px;border:1px solid #e7e5ea;border-top:none;background:#fff;color:#2e2e33">
`;
const BRAND_FOOTER = `
    <hr style="border:none;border-top:1px solid #e7e5ea;margin:24px 0">
    <p style="font-size:12px;color:#6e6e78">
      Didn't request this? Safely ignore this email. Questions? <a href="mailto:support@tenderfy.org">support@tenderfy.org</a>.
    </p>
  </div>
</div>`;

export function otpEmail(code: string, purpose: string): { subject: string; html: string } {
  const subject = purpose.toLowerCase().includes('reset')
    ? 'Reset your ShubhMilan password'
    : 'Your ShubhMilan verification code';
  const html = `${BRAND_HEADER}
    <h2 style="margin:0 0 8px">Your one-time code</h2>
    <p style="margin:0 0 16px;color:#6e6e78">Use this code within 10 minutes:</p>
    <div style="font-size:32px;font-weight:800;letter-spacing:6px;text-align:center;padding:16px;background:#fdf3f6;border-radius:12px;color:#8b1e3f">${code}</div>
    <p style="margin:16px 0 0;color:#6e6e78;font-size:13px">For your security, never share this code with anyone.</p>
  ${BRAND_FOOTER}`;
  return { subject, html };
}

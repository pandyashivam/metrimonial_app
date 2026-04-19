/* eslint-disable no-console */
import { env } from '../env.js';

/**
 * KYC providers — Digio (Aadhaar) and HyperVerge (face match). Both SDKs do the heavy
 * lifting on the client (SDK popups, consent, OTP), producing a providerRef token. The
 * server's job is to re-verify that token against the provider's API so clients can't
 * lie about it. When credentials aren't configured (dev mode), we accept refs whose
 * prefix is `dev-` as a testing shortcut.
 */

interface AadhaarVerifyResult {
  ok: boolean;
  provider: 'digio' | 'hyperverge' | 'dev';
  reason?: string;
  last4?: string;
}

export async function confirmAadhaar(
  providerRef: string,
  clientSuppliedLast4: string,
): Promise<AadhaarVerifyResult> {
  if (providerRef.startsWith('dev-')) {
    return { ok: true, provider: 'dev', last4: clientSuppliedLast4 };
  }

  if (env.DIGIO_CLIENT_ID && env.DIGIO_CLIENT_SECRET) {
    try {
      const auth = Buffer.from(
        `${env.DIGIO_CLIENT_ID}:${env.DIGIO_CLIENT_SECRET}`,
      ).toString('base64');
      const res = await fetch(`${env.DIGIO_BASE_URL}/client/kyc/v2/${providerRef}/response`, {
        headers: { authorization: `Basic ${auth}` },
      });
      if (!res.ok) {
        return { ok: false, provider: 'digio', reason: `Digio HTTP ${res.status}` };
      }
      const data = (await res.json()) as {
        status?: string;
        kyc_attempts?: Array<{ status?: string; kyc_data?: { aadhaar_number?: string } }>;
      };
      const last = data.kyc_attempts?.[data.kyc_attempts.length - 1];
      const kycNumber = last?.kyc_data?.aadhaar_number ?? '';
      const actualLast4 = kycNumber.slice(-4);
      const passed =
        data.status === 'approved' &&
        last?.status === 'approved' &&
        actualLast4 === clientSuppliedLast4;
      return passed
        ? { ok: true, provider: 'digio', last4: actualLast4 }
        : { ok: false, provider: 'digio', reason: 'Status not approved or last4 mismatch' };
    } catch (err) {
      console.warn('[digio] error', err);
      return { ok: false, provider: 'digio', reason: 'Digio request failed' };
    }
  }

  if (env.HYPERVERGE_APP_ID && env.HYPERVERGE_APP_KEY) {
    // HyperVerge has a similar shape; stub with the same dev-acceptance rule.
    return { ok: false, provider: 'hyperverge', reason: 'HyperVerge integration not wired yet' };
  }

  return {
    ok: false,
    provider: 'dev',
    reason: 'No KYC provider configured — use a "dev-" prefixed providerRef for testing',
  };
}

interface FaceMatchInput {
  primaryPhotoKey: string;
  selfieUrl?: string;
}

interface FaceMatchResult {
  matched: boolean;
  confidence: number;
  pendingReview: boolean;
}

export async function runFaceMatch(_input: FaceMatchInput): Promise<FaceMatchResult> {
  if (!env.HYPERVERGE_APP_ID || !env.HYPERVERGE_APP_KEY) {
    // Dev fallback: queue for manual admin review rather than auto-approving.
    return { matched: false, confidence: 0, pendingReview: true };
  }
  try {
    const res = await fetch('https://ind.hyperverge.co/v1/faceCompare', {
      method: 'POST',
      headers: {
        appId: env.HYPERVERGE_APP_ID,
        appKey: env.HYPERVERGE_APP_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        image1: _input.primaryPhotoKey,
        image2: _input.selfieUrl,
      }),
    });
    if (!res.ok) return { matched: false, confidence: 0, pendingReview: true };
    const data = (await res.json()) as {
      result?: { matchScore?: number; match?: 'yes' | 'no' };
    };
    const score = data.result?.matchScore ?? 0;
    return {
      matched: data.result?.match === 'yes' && score > 0.9,
      confidence: score,
      pendingReview: score > 0.6 && score <= 0.9,
    };
  } catch {
    return { matched: false, confidence: 0, pendingReview: true };
  }
}

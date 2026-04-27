import { Verification } from '../db.js';

export type VerificationStep =
  | 'email'
  | 'phone'
  | 'aadhaar'
  | 'selfie'
  | 'video'
  | 'background';

const STEP_WEIGHTS: Record<VerificationStep, number> = {
  email: 10,
  phone: 15,
  aadhaar: 25,
  selfie: 20,
  video: 20,
  background: 10,
};

export function computeTrustScore(flags: {
  emailVerified: boolean;
  phoneVerified: boolean;
  aadhaarVerified: boolean;
  selfieVerified: boolean;
  videoKycVerified: boolean;
  backgroundVerified: boolean;
}): number {
  let s = 0;
  if (flags.emailVerified) s += STEP_WEIGHTS.email;
  if (flags.phoneVerified) s += STEP_WEIGHTS.phone;
  if (flags.aadhaarVerified) s += STEP_WEIGHTS.aadhaar;
  if (flags.selfieVerified) s += STEP_WEIGHTS.selfie;
  if (flags.videoKycVerified) s += STEP_WEIGHTS.video;
  if (flags.backgroundVerified) s += STEP_WEIGHTS.background;
  return Math.min(100, s);
}

export function tierFromScore(score: number): 'BASIC' | 'VERIFIED' | 'PREMIUM' {
  if (score >= 81) return 'PREMIUM';
  if (score >= 41) return 'VERIFIED';
  return 'BASIC';
}

export async function markStepSimple(profileId: string, step: VerificationStep): Promise<void> {
  const field =
    step === 'email'
      ? 'emailVerified'
      : step === 'phone'
        ? 'phoneVerified'
        : step === 'aadhaar'
          ? 'aadhaarVerified'
          : step === 'selfie'
            ? 'selfieVerified'
            : step === 'video'
              ? 'videoKycVerified'
              : 'backgroundVerified';

  let row = await Verification.findOne({ where: { profileId } });
  if (row) {
    await row.update({ [field]: true });
  } else {
    row = await Verification.create({
      profileId,
      [field]: true,
    });
  }

  const trustScore = computeTrustScore({
    emailVerified: row.emailVerified ?? false,
    phoneVerified: row.phoneVerified ?? false,
    aadhaarVerified: row.aadhaarVerified ?? false,
    selfieVerified: row.selfieVerified ?? false,
    videoKycVerified: row.videoKycVerified ?? false,
    backgroundVerified: row.backgroundVerified ?? false,
  });
  await row.update({ trustScore, tier: tierFromScore(trustScore) });
}

export type VerificationTier = 'BASIC' | 'VERIFIED' | 'PREMIUM';
export type VerificationStep =
  | 'email'
  | 'phone'
  | 'aadhaar'
  | 'selfie'
  | 'video'
  | 'background';

export interface VerificationStatus {
  profileId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  aadhaarVerified: boolean;
  selfieVerified: boolean;
  videoKycVerified: boolean;
  backgroundVerified: boolean;
  trustScore: number;
  tier: VerificationTier;
  /** Last admin rejection — if present, surface the reason on the user's
   *  /verify screen so they know what to fix before resubmitting. */
  lastRejectionStep?: VerificationStep | null;
  lastRejectionReason?: string | null;
  lastRejectionAt?: string | null;
}

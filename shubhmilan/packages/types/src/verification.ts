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
}

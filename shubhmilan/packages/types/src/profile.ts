export type Gender = 'Male' | 'Female' | 'Other';
export type MaritalStatus = 'Never Married' | 'Divorced' | 'Widowed' | 'Awaiting Divorce';
export type Diet = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Jain Vegetarian' | 'Vegan';
export type YesNoOccasional = 'No' | 'Occasionally' | 'Yes';
export type ManglikStatus = 'No' | 'Yes' | 'Anshik (Partial)' | "Don't Know";
export type FamilyType = 'Nuclear' | 'Joint';
export type FamilyValues = 'Traditional' | 'Moderate' | 'Liberal';
export type PhotoPrivacy = 'PUBLIC' | 'MEMBERS' | 'REQUEST';

export interface Profile {
  id: string;
  userId: string;
  fullName: string;
  gender: Gender;
  dob: string;
  height: string;
  weight?: number | null;
  maritalStatus: MaritalStatus;
  motherTongue: string;
  religion: string;
  caste: string;
  subCaste?: string | null;
  gotra?: string | null;
  manglik: ManglikStatus;
  rashi?: string | null;
  nakshatra?: string | null;
  education: string;
  occupation: string;
  income?: string | null;
  city: string;
  state: string;
  country: string;
  diet: Diet;
  smoking: YesNoOccasional;
  drinking: YesNoOccasional;
  aboutMe: string;
  familyValues: FamilyValues;
  personalityTraits: string[];
  hobbies: string[];
  languages: string[];
  complexion?: string | null;
  bodyType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSummary {
  id: string;
  fullName: string;
  gender: Gender;
  age: number;
  height: string;
  religion: string;
  caste: string;
  city: string;
  state: string;
  education: string;
  occupation: string;
  primaryPhotoUrl: string | null;
  verificationTier: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  trustScore: number;
  isOnline: boolean;
  lastActiveAt: string | null;
}

export interface PartnerPreference {
  id: string;
  profileId: string;
  ageMin: number;
  ageMax: number;
  heightMin?: string | null;
  heightMax?: string | null;
  religions: string[];
  castes: string[];
  motherTongues: string[];
  education: string[];
  occupation: string[];
  incomeMin?: string | null;
  cities: string[];
  diet: Diet[];
  manglik?: ManglikStatus | null;
}

export interface Photo {
  id: string;
  profileId: string;
  url: string;
  isPrimary: boolean;
  privacy: PhotoPrivacy;
  uploadedAt: string;
  moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

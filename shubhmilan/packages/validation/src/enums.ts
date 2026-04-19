import { z } from 'zod';

export const GenderEnum = z.enum(['Male', 'Female', 'Other']);
export const MaritalStatusEnum = z.enum([
  'Never Married',
  'Divorced',
  'Widowed',
  'Awaiting Divorce',
]);
export const DietEnum = z.enum([
  'Vegetarian',
  'Non-Vegetarian',
  'Eggetarian',
  'Jain Vegetarian',
  'Vegan',
]);
export const YesNoOccasionalEnum = z.enum(['No', 'Occasionally', 'Yes']);
export const ManglikEnum = z.enum(['No', 'Yes', 'Anshik (Partial)', "Don't Know"]);
export const FamilyTypeEnum = z.enum(['Nuclear', 'Joint']);
export const FamilyValuesEnum = z.enum(['Traditional', 'Moderate', 'Liberal']);
export const PhotoPrivacyEnum = z.enum(['PUBLIC', 'MEMBERS', 'REQUEST']);
export const VerificationStepEnum = z.enum([
  'email',
  'phone',
  'aadhaar',
  'selfie',
  'video',
  'background',
]);
export const InterestStatusEnum = z.enum(['SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN']);

export const ReligionEnum = z.enum([
  'Hindu',
  'Sikh',
  'Jain',
  'Muslim',
  'Christian',
  'Buddhist',
  'Parsi',
  'Other',
]);

export const IndianStateEnum = z.enum([
  'Andhra Pradesh',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Chandigarh',
]);

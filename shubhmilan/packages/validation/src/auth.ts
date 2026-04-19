import { z } from 'zod';

export const emailSchema = z.string().email().toLowerCase().trim();
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number');
export const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/\d/, 'Must contain a digit');

export const SignupInput = z
  .object({
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
  })
  .strict();

export const LoginInput = z
  .object({
    identifier: z.union([emailSchema, phoneSchema]),
    password: z.string().min(1).optional(),
    otp: z.string().length(6).optional(),
  })
  .strict()
  .refine((v) => !!(v.password || v.otp), { message: 'Password or OTP is required' });

export const VerifyOtpInput = z
  .object({
    target: z.union([emailSchema, phoneSchema]),
    code: z.string().length(6),
    purpose: z.enum(['SIGNUP', 'LOGIN', 'RESET', 'VERIFY_EMAIL', 'VERIFY_PHONE']),
  })
  .strict();

export const ResendOtpInput = z
  .object({
    target: z.union([emailSchema, phoneSchema]),
    purpose: VerifyOtpInput.shape.purpose,
  })
  .strict();

export const RefreshInput = z
  .object({
    refreshToken: z.string().min(10),
  })
  .strict();

export const ForgotPasswordInput = z
  .object({
    identifier: z.union([emailSchema, phoneSchema]),
  })
  .strict();

export const ResetPasswordInput = z
  .object({
    target: z.union([emailSchema, phoneSchema]),
    code: z.string().length(6),
    password: passwordSchema,
  })
  .strict();

export type SignupInput = z.infer<typeof SignupInput>;
export type LoginInput = z.infer<typeof LoginInput>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpInput>;
export type RefreshInput = z.infer<typeof RefreshInput>;

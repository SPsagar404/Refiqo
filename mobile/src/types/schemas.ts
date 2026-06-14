/** Zod form schemas (RHF resolvers), mirrored from docs/API.md. */
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type SignupForm = z.infer<typeof signupSchema>;

const optionalUrl = z
  .string()
  .trim()
  .url('Enter a valid URL')
  .optional()
  .or(z.literal(''));

export const basicInfoSchema = z.object({
  fullName: z.string().trim().min(2, 'Required'),
  // jobTitle / experienceYears / company are collected once in Step 2 (Experience);
  // target roles are collected in Step 4 (Preferences) — not duplicated here.
  city: z.string().trim().min(1, 'Required'),
  country: z.string().trim().min(1, 'Required'),
  phone: z.string().trim().min(5, 'Required'),
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  about: z.string().trim().max(500, 'Max 500 characters').optional(),
  // Education (optional)
  degree: z.string().trim().optional(),
  fieldOfStudy: z.string().trim().optional(),
  institution: z.string().trim().optional(),
});
export type BasicInfoForm = z.infer<typeof basicInfoSchema>;

export const sendReferralSchema = z.object({
  jobRole: z.string().trim().min(1, 'Select a role'),
  jobLink: optionalUrl,
  message: z.string().trim().min(1, 'Message is required').max(500, 'Max 500 characters'),
  note: z.string().trim().max(200, 'Max 200 characters').optional(),
});
export type SendReferralForm = z.infer<typeof sendReferralSchema>;

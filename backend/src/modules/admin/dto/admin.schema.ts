import { z } from 'zod';
import { emailSchema, urlSchema } from '../../../contracts/common.schema';
import {
  AnnouncementAudience,
  JobStatus,
  ReferralStatus,
  UserStatus,
  VerificationStatus,
  WorkMode,
} from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});
export type AdminLoginDto = z.infer<typeof adminLoginSchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});
export type ListQueryDto = z.infer<typeof listQuerySchema>;

export const userStatusSchema = z.object({
  status: z.enum(enumValues(UserStatus)),
});
export type UserStatusDto = z.infer<typeof userStatusSchema>;

export const verificationSchema = z.object({
  verificationStatus: z.enum(enumValues(VerificationStatus)),
  canRefer: z.boolean().optional(),
});
export type VerificationDto = z.infer<typeof verificationSchema>;

export const referralStatusSchema = z.object({
  status: z.enum(enumValues(ReferralStatus)),
  rejectionReason: z.string().trim().max(300).optional(),
});
export type ReferralStatusDto = z.infer<typeof referralStatusSchema>;

export const jobSchema = z.object({
  title: z.string().trim().min(1).max(160),
  companyName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  workMode: z.enum(enumValues(WorkMode)).optional(),
  description: z.string().trim().max(4000).optional(),
  applyUrl: urlSchema.optional().or(z.literal('')),
  status: z.enum(enumValues(JobStatus)).default('DRAFT'),
});
export type JobDto = z.infer<typeof jobSchema>;

export const jobUpdateSchema = jobSchema.partial();
export type JobUpdateDto = z.infer<typeof jobUpdateSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(2000),
  audience: z.enum(enumValues(AnnouncementAudience)).default('ALL'),
  send: z.boolean().default(false),
});
export type AnnouncementDto = z.infer<typeof announcementSchema>;

export const settingsSchema = z.object({
  key: z.string().trim().min(1),
  value: z.unknown(),
});
export type SettingsDto = z.infer<typeof settingsSchema>;

import { z } from 'zod';
import { urlSchema } from '../../../contracts/common.schema';
import { WorkMode } from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    jobTitle: z.string().trim().max(120).optional(),
    experienceYears: z.coerce.number().int().min(0).max(60).optional(),
    companyName: z.string().trim().max(120).optional(),
    city: z.string().trim().max(80).optional(),
    country: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(20).optional(),
    linkedinUrl: urlSchema.optional().or(z.literal('')),
    portfolioUrl: urlSchema.optional().or(z.literal('')),
    about: z.string().trim().max(500).optional(),
    lookingFor: z.string().trim().max(300).optional(),
    preferredWorkMode: z.enum(enumValues(WorkMode)).optional(),
    willingToRelocate: z.boolean().optional(),
    avatarUrl: urlSchema.optional().or(z.literal('')),
  })
  .strict();
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const replaceExperienceSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        companyName: z.string().trim().min(1),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        current: z.boolean().optional(),
        description: z.string().trim().max(1000).optional(),
      }),
    )
    .default([]),
});
export type ReplaceExperienceDto = z.infer<typeof replaceExperienceSchema>;

export const replaceEducationSchema = z.object({
  items: z
    .array(
      z.object({
        degree: z.string().trim().min(1),
        fieldOfStudy: z.string().trim().optional(),
        institution: z.string().trim().min(1),
        graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
        currentlyPursuing: z.boolean().optional(),
      }),
    )
    .default([]),
});
export type ReplaceEducationDto = z.infer<typeof replaceEducationSchema>;

export const replaceSkillsSchema = z.object({
  skillIds: z.array(z.string().uuid()).default([]),
  customSkills: z.array(z.string().trim().min(1).max(60)).default([]),
});
export type ReplaceSkillsDto = z.infer<typeof replaceSkillsSchema>;

export const notificationPrefsSchema = z
  .object({
    referralUpdates: z.boolean().optional(),
    newMessages: z.boolean().optional(),
    reminders: z.boolean().optional(),
    milestones: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .strict();
export type NotificationPrefsDto = z.infer<typeof notificationPrefsSchema>;

export const privacySchema = z
  .object({
    profilePublic: z.boolean().optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
  })
  .strict();
export type PrivacyDto = z.infer<typeof privacySchema>;

export const registerDeviceSchema = z.object({
  fcmToken: z.string().min(1),
  platform: z.enum(['ANDROID', 'IOS', 'WEB']).default('ANDROID'),
});
export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;

export const canReferSchema = z.object({ canRefer: z.boolean() });
export type CanReferDto = z.infer<typeof canReferSchema>;

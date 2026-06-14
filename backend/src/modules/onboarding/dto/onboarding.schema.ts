import { z } from 'zod';
import { urlSchema } from '../../../contracts/common.schema';
import {
  AvailabilityStatus,
  ContactMethod,
  EmploymentType,
  PortfolioType,
  ReferralCategory,
  ResponseTime,
  WorkMode,
} from '../../../contracts/enums';

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

export const basicInfoSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  // jobTitle / experienceYears / companyName are derived from the Step-2
  // "current" work experience, so they are optional here (kept for back-compat).
  jobTitle: z.string().trim().min(1).max(120).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  companyName: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(5).max(20),
  linkedinUrl: urlSchema.optional().or(z.literal('')),
  portfolioUrl: urlSchema.optional().or(z.literal('')),
  about: z.string().trim().max(500).optional(),
  lookingFor: z.string().trim().max(300).optional(),
  preferredWorkMode: z.enum(enumValues(WorkMode)).optional(),
  willingToRelocate: z.boolean().optional(),
  education: z
    .object({
      degree: z.string().trim().min(1),
      fieldOfStudy: z.string().trim().optional(),
      institution: z.string().trim().min(1),
      graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
      currentlyPursuing: z.boolean().optional(),
    })
    .optional(),
});
export type BasicInfoDto = z.infer<typeof basicInfoSchema>;

export const skillsStepSchema = z.object({
  skillIds: z.array(z.string().uuid()).default([]),
  customSkills: z.array(z.string().trim().min(1).max(60)).default([]),
});
export type SkillsStepDto = z.infer<typeof skillsStepSchema>;

// Step 2 — Professional Experience & Skills
const experienceItemSchema = z
  .object({
    companyName: z.string().trim().min(1).max(120),
    title: z.string().trim().min(1).max(120),
    employmentType: z.enum(enumValues(EmploymentType)),
    location: z.string().trim().max(120).optional().or(z.literal('')),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    current: z.boolean().default(false),
    description: z.string().trim().max(1000).optional().or(z.literal('')),
  })
  .refine((e) => e.current || !!e.endDate, {
    message: 'End date is required for past experience',
    path: ['endDate'],
  })
  .refine((e) => !e.endDate || e.current || e.endDate >= e.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const experienceSkillsSchema = z
  .object({
    experiences: z.array(experienceItemSchema).min(1, 'Add at least one experience'),
    skillIds: z.array(z.string().uuid()).default([]),
    customSkills: z.array(z.string().trim().min(1).max(60)).default([]),
  })
  .refine((d) => d.experiences.filter((e) => e.current).length <= 1, {
    message: 'Only one experience can be marked as current',
    path: ['experiences'],
  });
export type ExperienceSkillsDto = z.infer<typeof experienceSkillsSchema>;

export const resumePortfolioSchema = z.object({
  resumeId: z.string().uuid().optional(),
  portfolioLinks: z
    .array(
      z.object({
        type: z.enum(enumValues(PortfolioType)),
        url: urlSchema,
        title: z.string().trim().max(120).optional(),
        description: z.string().trim().max(300).optional(),
      }),
    )
    .default([]),
});
export type ResumePortfolioDto = z.infer<typeof resumePortfolioSchema>;

export const preferencesSchema = z.object({
  categories: z.array(z.enum(enumValues(ReferralCategory))).min(1),
  roles: z.array(z.string().trim().min(1)).min(1),
  preferredCompanies: z.array(z.string().trim().min(1)).default([]),
  preferredLocations: z.array(z.string().trim().min(1)).default([]),
});
export type PreferencesDto = z.infer<typeof preferencesSchema>;

export const availabilitySchema = z.object({
  availabilityStatus: z.enum(enumValues(AvailabilityStatus)),
  responseTime: z.enum(enumValues(ResponseTime)),
  contactMethods: z.array(z.enum(enumValues(ContactMethod))).min(1),
});
export type AvailabilityDto = z.infer<typeof availabilitySchema>;

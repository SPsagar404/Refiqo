/**
 * Project-local enum contracts. These mirror the canonical Prisma enums
 * (see prisma/schema.prisma) and are re-exported from the generated client so
 * there is a single source of truth within this standalone project.
 */
export {
  UserRole,
  UserStatus,
  OAuthProvider,
  VerificationStatus,
  ReferralStatus,
  ReferralCategory,
  AvailabilityStatus,
  ResponseTime,
  ContactMethod,
  MessageType,
  PortfolioType,
  NotificationType,
  JobStatus,
  WorkMode,
  DevicePlatform,
  AdminRole,
  AnnouncementAudience,
} from '@prisma/client';

/**
 * Employment type for work experience. Stored as a plain string column on
 * Experience (kept out of the Prisma enum set so new types can be added without
 * a migration). This const is the source of truth for validation/labels.
 */
export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  INTERNSHIP: 'INTERNSHIP',
  CONTRACT: 'CONTRACT',
  FREELANCE: 'FREELANCE',
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

/** Valid transitions for a referral request's lifecycle. */
export const REFERRAL_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  UNDER_REVIEW: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: [],
  REJECTED: [],
};

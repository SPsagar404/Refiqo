/**
 * Project-local enum contracts, mirrored from the backend Prisma schema /
 * docs/DATABASE.md. Kept in sync manually (no cross-project imports).
 */
export const UserRole = {
  USER: 'USER',
  REFERRER: 'REFERRER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ReferralStatus = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;
export type ReferralStatus = (typeof ReferralStatus)[keyof typeof ReferralStatus];

export const ReferralCategory = {
  FULL_TIME: 'FULL_TIME',
  INTERNSHIP: 'INTERNSHIP',
  CONTRACT: 'CONTRACT',
  PART_TIME: 'PART_TIME',
  FREELANCE: 'FREELANCE',
  OTHER: 'OTHER',
} as const;
export type ReferralCategory = (typeof ReferralCategory)[keyof typeof ReferralCategory];

export const AvailabilityStatus = {
  AVAILABLE_NOW: 'AVAILABLE_NOW',
  AVAILABLE_1_2_WEEKS: 'AVAILABLE_1_2_WEEKS',
  LIMITED: 'LIMITED',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
} as const;
export type AvailabilityStatus = (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

export const ResponseTime = {
  WITHIN_24H: 'WITHIN_24H',
  WITHIN_2_3_DAYS: 'WITHIN_2_3_DAYS',
  WITHIN_A_WEEK: 'WITHIN_A_WEEK',
  MORE_THAN_A_WEEK: 'MORE_THAN_A_WEEK',
} as const;
export type ResponseTime = (typeof ResponseTime)[keyof typeof ResponseTime];

export const ContactMethod = {
  IN_APP_CHAT: 'IN_APP_CHAT',
  EMAIL: 'EMAIL',
  LINKEDIN: 'LINKEDIN',
  PHONE_CALL: 'PHONE_CALL',
  VIDEO_CALL: 'VIDEO_CALL',
} as const;
export type ContactMethod = (typeof ContactMethod)[keyof typeof ContactMethod];

export const PortfolioType = {
  WEBSITE: 'WEBSITE',
  LINKEDIN: 'LINKEDIN',
  GITHUB: 'GITHUB',
  OTHER: 'OTHER',
} as const;
export type PortfolioType = (typeof PortfolioType)[keyof typeof PortfolioType];

export const WorkMode = {
  ONSITE: 'ONSITE',
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
} as const;
export type WorkMode = (typeof WorkMode)[keyof typeof WorkMode];

export const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  INTERNSHIP: 'INTERNSHIP',
  CONTRACT: 'CONTRACT',
  FREELANCE: 'FREELANCE',
} as const;
export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const NotificationType = {
  REFERRAL_ACCEPTED: 'REFERRAL_ACCEPTED',
  REFERRAL_REJECTED: 'REFERRAL_REJECTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  REFERRAL_REQUEST_RECEIVED: 'REFERRAL_REQUEST_RECEIVED',
  REFERRAL_UNDER_REVIEW: 'REFERRAL_UNDER_REVIEW',
  REMINDER: 'REMINDER',
  MILESTONE: 'MILESTONE',
  WELCOME: 'WELCOME',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const MessageType = {
  TEXT: 'TEXT',
  FILE: 'FILE',
  IMAGE: 'IMAGE',
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];

// ── Human-readable labels for pickers / chips ──────────────────────────────
export const REFERRAL_CATEGORY_LABELS: Record<ReferralCategory, string> = {
  FULL_TIME: 'Full-time Jobs',
  INTERNSHIP: 'Internships',
  CONTRACT: 'Contract Roles',
  PART_TIME: 'Part-time Jobs',
  FREELANCE: 'Freelance Projects',
  OTHER: 'Other Opportunities',
};

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  AVAILABLE_NOW: 'Available Now',
  AVAILABLE_1_2_WEEKS: 'Available in 1–2 Weeks',
  LIMITED: 'Limited Availability',
  NOT_AVAILABLE: 'Not Available Right Now',
};

export const RESPONSE_TIME_LABELS: Record<ResponseTime, string> = {
  WITHIN_24H: 'Within 24 Hours',
  WITHIN_2_3_DAYS: 'Within 2–3 Days',
  WITHIN_A_WEEK: 'Within a Week',
  MORE_THAN_A_WEEK: 'More than a Week',
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  IN_APP_CHAT: 'In-App Chat',
  EMAIL: 'Email',
  LINKEDIN: 'LinkedIn',
  PHONE_CALL: 'Phone Call',
  VIDEO_CALL: 'Video Call',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
};

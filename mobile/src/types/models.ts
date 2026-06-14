/** API response model types (the subset the mobile app consumes). */
import {
  AvailabilityStatus,
  MessageType,
  NotificationType,
  ReferralStatus,
  UserRole,
} from './enums';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  onboardingStep: number;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ReferrerCard {
  id: string;
  fullName: string;
  jobTitle: string | null;
  avatarUrl: string | null;
  company: string | null;
  companyLogoUrl: string | null;
  location: string | null;
  experienceYears: number | null;
  canRefer: boolean;
  verificationStatus: string;
  availabilityStatus: AvailabilityStatus | null;
  avgResponseHours: number | null;
  ratingAvg: number;
  skills: string[];
  matchScore?: number;
  isSaved?: boolean;
}

export interface ReferrerProfileDetail extends ReferrerCard {
  about: string | null;
  experiences: {
    title: string;
    company: string | null;
    startDate: string;
    endDate: string | null;
    current: boolean;
    description: string | null;
  }[];
  educations: {
    degree: string;
    fieldOfStudy: string | null;
    institution: string;
    graduationYear: number | null;
  }[];
  identity: { emailVerified: boolean; companyVerified: boolean };
  stats: {
    experienceYears: number | null;
    referralsGiven: number;
    responseRatePct: number;
    avgResponseHours: number | null;
    ratingAvg: number;
    ratingCount: number;
  };
}

export interface ReferralRequestCard {
  id: string;
  status: ReferralStatus;
  jobRole: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  party: {
    id: string;
    fullName: string;
    jobTitle: string | null;
    avatarUrl: string | null;
    experienceYears: number | null;
    company: string | null;
    location: string | null;
  };
}

export interface StatusEvent {
  status: string;
  at: string;
  by: string;
  reason?: string;
}

export interface ConversationSummary {
  id: string;
  participant: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    lastSeenAt: string | null;
  } | null;
  lastMessage: { body: string | null; type: MessageType; createdAt: string; senderId: string } | null;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  type: MessageType;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  attachments: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  isPopular: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

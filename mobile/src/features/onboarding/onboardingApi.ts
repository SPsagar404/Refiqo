import { api, unwrap } from '@/lib/apiClient';
import {
  AvailabilityStatus,
  ContactMethod,
  EmploymentType,
  PortfolioType,
  ReferralCategory,
  ResponseTime,
} from '@/types/enums';
import { Skill } from '@/types/models';
import { BasicInfoForm } from '@/types/schemas';

export async function saveBasicInfo(form: BasicInfoForm) {
  // Map the flat form to the API shape (education is a nested object).
  const { degree, fieldOfStudy, institution, ...rest } = form;
  const body = {
    ...rest,
    education:
      degree && institution ? { degree, fieldOfStudy: fieldOfStudy || undefined, institution } : undefined,
  };
  return unwrap((await api.patch('/onboarding/basic-info', body)).data);
}

export async function saveSkills(skillIds: string[], customSkills: string[]) {
  return unwrap((await api.patch('/onboarding/skills', { skillIds, customSkills })).data);
}

export interface ExperiencePayload {
  companyName: string;
  title: string;
  employmentType: EmploymentType;
  location?: string;
  startDate: string; // ISO
  endDate?: string | null; // ISO; null/omitted when current
  current: boolean;
  description?: string;
}

/** Step 2 — professional experience + skills in one request. */
export async function saveExperienceSkills(body: {
  experiences: ExperiencePayload[];
  skillIds: string[];
  customSkills: string[];
}) {
  return unwrap((await api.patch('/onboarding/experience-skills', body)).data);
}

export async function saveResumePortfolio(body: {
  resumeId?: string;
  portfolioLinks: { type: PortfolioType; url: string; title?: string; description?: string }[];
}) {
  return unwrap((await api.patch('/onboarding/resume-portfolio', body)).data);
}

export async function savePreferences(body: {
  categories: ReferralCategory[];
  roles: string[];
  preferredCompanies: string[];
  preferredLocations: string[];
}) {
  return unwrap((await api.patch('/onboarding/preferences', body)).data);
}

export async function saveAvailability(body: {
  availabilityStatus: AvailabilityStatus;
  responseTime: ResponseTime;
  contactMethods: ContactMethod[];
}) {
  return unwrap((await api.patch('/onboarding/availability', body)).data);
}

export async function completeOnboarding() {
  return unwrap((await api.post('/onboarding/complete', {})).data);
}

export async function searchSkills(search: string): Promise<Skill[]> {
  return unwrap<Skill[]>((await api.get('/skills', { params: { search, popular: !search } })).data);
}

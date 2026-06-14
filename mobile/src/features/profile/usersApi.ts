import { api, unwrap } from '@/lib/apiClient';

export interface FullProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  about: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  experienceYears: number | null;
  company: { name: string } | null;
  location: { city: string; country: string } | null;
  skills: { id: string; name: string }[];
  resumes: { id: string; fileName: string; isPrimary: boolean }[];
  referrerProfile: {
    referralsGiven: number;
    responseRatePct: number;
    ratingAvg: number;
    ratingCount: number;
  } | null;
}

export async function getMyProfile(): Promise<FullProfile> {
  return unwrap<FullProfile>((await api.get('/users/me')).data);
}

export async function becomeReferrer(): Promise<FullProfile> {
  return unwrap<FullProfile>((await api.post('/users/me/become-referrer', {})).data);
}

import { api, unwrap } from '@/lib/apiClient';
import { Paginated, ReferrerCard, ReferrerProfileDetail } from '@/types/models';

export interface ReferrerFilters {
  search?: string;
  company?: string;
  location?: string;
  minExp?: number;
  availability?: string;
  page?: number;
}

export async function fetchTopMatches(): Promise<ReferrerCard[]> {
  return unwrap<ReferrerCard[]>((await api.get('/referrers/top-matches')).data);
}

export async function fetchRecommended(): Promise<ReferrerCard[]> {
  return unwrap<ReferrerCard[]>((await api.get('/referrers/recommended')).data);
}

export async function discoverReferrers(params: Record<string, unknown>): Promise<Paginated<ReferrerCard>> {
  const res = (await api.get('/referrers', { params })).data;
  return { data: res.data as ReferrerCard[], meta: res.meta };
}

export async function fetchReferrer(id: string): Promise<ReferrerProfileDetail> {
  return unwrap<ReferrerProfileDetail>((await api.get(`/referrers/${id}`)).data);
}

export async function toggleSaveReferrer(id: string): Promise<{ saved: boolean }> {
  return unwrap<{ saved: boolean }>((await api.post(`/referrers/${id}/save`)).data);
}

export async function fetchSavedReferrers(): Promise<ReferrerCard[]> {
  return unwrap<ReferrerCard[]>((await api.get('/referrers/saved')).data);
}

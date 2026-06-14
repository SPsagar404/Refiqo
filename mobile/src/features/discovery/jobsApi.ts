import { api, unwrap } from '@/lib/apiClient';
import { Paginated } from '@/types/models';

export interface JobCard {
  id: string;
  title: string;
  company: string | null;
  companyLogoUrl: string | null;
  location: string | null;
  workMode: string | null;
  description: string | null;
  createdAt: string;
  isSaved: boolean;
}

export async function discoverJobs(params: Record<string, unknown>): Promise<Paginated<JobCard>> {
  const res = (await api.get('/jobs', { params })).data;
  return { data: res.data as JobCard[], meta: res.meta };
}

export async function toggleSaveJob(id: string): Promise<{ saved: boolean }> {
  return unwrap<{ saved: boolean }>((await api.post(`/jobs/${id}/save`)).data);
}

export async function fetchSavedJobs(): Promise<JobCard[]> {
  return unwrap<JobCard[]>((await api.get('/jobs/saved')).data);
}

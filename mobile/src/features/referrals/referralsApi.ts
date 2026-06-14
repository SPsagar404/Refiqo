import { api, unwrap } from '@/lib/apiClient';
import { Paginated, ReferralRequestCard, StatusEvent } from '@/types/models';

export async function createReferral(body: {
  referrerId: string;
  jobRole: string;
  jobLink?: string;
  message: string;
  note?: string;
  resumeId: string;
}) {
  return unwrap((await api.post('/referrals', body)).data);
}

export async function listReferrals(params: {
  role: 'seeker' | 'referrer';
  status?: string;
  page?: number;
}): Promise<Paginated<ReferralRequestCard>> {
  const res = (await api.get('/referrals', { params })).data;
  return { data: res.data as ReferralRequestCard[], meta: res.meta };
}

export interface ReferralDetail extends ReferralRequestCard {
  message: string;
  note: string | null;
  jobLink: string | null;
  statusHistory: StatusEvent[];
  resume: { id: string; fileName: string } | null;
}

export async function fetchReferral(id: string): Promise<ReferralDetail> {
  return unwrap<ReferralDetail>((await api.get(`/referrals/${id}`)).data);
}

export async function updateReferralStatus(id: string, status: string, rejectionReason?: string) {
  return unwrap((await api.patch(`/referrals/${id}/status`, { status, rejectionReason })).data);
}

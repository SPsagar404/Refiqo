import { api, unwrap } from '@/lib/apiClient';
import { AppNotification, Paginated } from '@/types/models';

export async function listNotifications(filter: string): Promise<Paginated<AppNotification>> {
  const res = (await api.get('/notifications', { params: { filter } })).data;
  return { data: res.data as AppNotification[], meta: res.meta };
}

export async function unreadCount(): Promise<number> {
  return unwrap<{ count: number }>((await api.get('/notifications/unread-count')).data).count;
}

export async function markRead(id: string) {
  return unwrap((await api.post(`/notifications/${id}/read`, {})).data);
}

export async function markAllRead() {
  return unwrap((await api.post('/notifications/read-all', {})).data);
}

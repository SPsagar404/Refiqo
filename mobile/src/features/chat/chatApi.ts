import { api, unwrap } from '@/lib/apiClient';
import { ChatMessage, ConversationSummary } from '@/types/models';

export async function listConversations(): Promise<ConversationSummary[]> {
  return unwrap<ConversationSummary[]>((await api.get('/conversations')).data);
}

export async function getOrCreateConversation(participantId: string): Promise<ConversationSummary> {
  return unwrap<ConversationSummary>((await api.post('/conversations', { participantId })).data);
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<{ data: ChatMessage[]; meta: { nextCursor: string | null; hasMore: boolean } }> {
  const res = (await api.get(`/conversations/${conversationId}/messages`, { params: { cursor } })).data;
  return { data: res.data as ChatMessage[], meta: res.meta };
}

export async function sendMessage(
  conversationId: string,
  body: { body?: string; type?: 'TEXT' | 'FILE' | 'IMAGE' },
): Promise<ChatMessage> {
  return unwrap<ChatMessage>(
    (await api.post(`/conversations/${conversationId}/messages`, { type: 'TEXT', ...body })).data,
  );
}

export async function markConversationRead(conversationId: string) {
  return unwrap((await api.post(`/conversations/${conversationId}/read`, {})).data);
}

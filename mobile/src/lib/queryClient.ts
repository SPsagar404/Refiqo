import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Centralized query keys per feature. */
export const qk = {
  me: ['me'] as const,
  onboarding: ['onboarding'] as const,
  feed: ['feed'] as const,
  skills: (search?: string) => ['skills', search ?? ''] as const,
  topMatches: ['referrers', 'top-matches'] as const,
  recommended: ['referrers', 'recommended'] as const,
  referrers: (params: Record<string, unknown>) => ['referrers', params] as const,
  referrer: (id: string) => ['referrers', id] as const,
  referrals: (params: Record<string, unknown>) => ['referrals', params] as const,
  referral: (id: string) => ['referrals', id] as const,
  conversations: ['conversations'] as const,
  messages: (id: string) => ['conversations', id, 'messages'] as const,
  notifications: (filter: string) => ['notifications', filter] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

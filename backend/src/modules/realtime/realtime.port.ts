export type RealtimeEvent = 'message.created' | 'message.read' | 'typing' | 'presence';

export interface RealtimeMessage {
  event: RealtimeEvent;
  channel: string;
  payload: Record<string, unknown>;
}

/**
 * Realtime transport abstraction. Local adapter is an in-memory pub/sub fed to
 * clients over SSE; the cloud adapter publishes to Supabase Realtime channels.
 * The interface is Socket.IO-ready (channel + event + payload).
 */
export abstract class RealtimePort {
  /** Publish an event to everyone subscribed to a channel. */
  abstract publish(channel: string, event: RealtimeEvent, payload: Record<string, unknown>): void;

  /** Credentials/token a client uses to subscribe (provider-specific). */
  abstract issueClientToken(userId: string): Promise<{ token: string; mode: string }>;
}

export const REALTIME_PORT = Symbol('REALTIME_PORT');

/** Conversation channel naming convention shared by all adapters. */
export const conversationChannel = (conversationId: string) => `conversation:${conversationId}`;
export const userChannel = (userId: string) => `user:${userId}`;

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Push notification transport. Local adapter logs to console; the FCM adapter
 * (ADAPTER_MODE=cloud) sends to Firebase Cloud Messaging.
 */
export abstract class PushPort {
  abstract sendToTokens(tokens: string[], message: PushMessage): Promise<void>;
}

export const PUSH_PORT = Symbol('PUSH_PORT');

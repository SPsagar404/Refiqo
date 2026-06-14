import { Injectable, Logger } from '@nestjs/common';
import { PushMessage, PushPort } from './push.port';

/** Dev adapter — logs instead of sending. Swap for an FCM adapter in cloud mode. */
@Injectable()
export class LocalPushAdapter extends PushPort {
  private readonly logger = new Logger('Push');

  async sendToTokens(tokens: string[], message: PushMessage): Promise<void> {
    if (!tokens.length) return;
    this.logger.debug(`[push→${tokens.length} device(s)] ${message.title} — ${message.body}`);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter } from 'events';
import { RealtimeEvent, RealtimeMessage, RealtimePort } from './realtime.port';

/**
 * In-memory pub/sub. SSE clients (see ChatController.stream) subscribe via
 * `on()`; emitting is synchronous and process-local — fine for single-instance
 * dev. Swap for the Supabase adapter (or Socket.IO) in cloud mode.
 */
@Injectable()
export class LocalRealtimeAdapter extends RealtimePort {
  private readonly emitter = new EventEmitter();
  private readonly secret: string;

  constructor(
    config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    super();
    this.emitter.setMaxListeners(0);
    this.secret = `${config.get<string>('jwt.accessSecret')}:realtime`;
  }

  publish(channel: string, event: RealtimeEvent, payload: Record<string, unknown>): void {
    const message: RealtimeMessage = { event, channel, payload };
    this.emitter.emit(channel, message);
    this.emitter.emit('*', message);
  }

  async issueClientToken(userId: string): Promise<{ token: string; mode: string }> {
    const token = await this.jwt.signAsync(
      { sub: userId },
      { secret: this.secret, expiresIn: 3600 },
    );
    return { token, mode: 'local-sse' };
  }

  /** SSE bridge used by the local stream endpoint. */
  subscribe(channels: string[], handler: (msg: RealtimeMessage) => void): () => void {
    const wrapped = (msg: RealtimeMessage) => {
      if (channels.includes(msg.channel)) handler(msg);
    };
    this.emitter.on('*', wrapped);
    return () => this.emitter.off('*', wrapped);
  }

  verifyClientToken(token: string): Promise<{ sub: string }> {
    return this.jwt.verifyAsync(token, { secret: this.secret });
  }
}

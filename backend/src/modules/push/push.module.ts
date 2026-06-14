import { Global, Module } from '@nestjs/common';
import { LocalPushAdapter } from './local-push.adapter';
import { PUSH_PORT } from './push.port';

@Global()
@Module({
  providers: [{ provide: PUSH_PORT, useClass: LocalPushAdapter }],
  exports: [PUSH_PORT],
})
export class PushModule {}

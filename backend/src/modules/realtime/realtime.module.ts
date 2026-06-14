import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LocalRealtimeAdapter } from './local-realtime.adapter';
import { REALTIME_PORT } from './realtime.port';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [LocalRealtimeAdapter, { provide: REALTIME_PORT, useExisting: LocalRealtimeAdapter }],
  exports: [REALTIME_PORT, LocalRealtimeAdapter],
})
export class RealtimeModule {}

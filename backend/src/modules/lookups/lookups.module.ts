import { Global, Module } from '@nestjs/common';
import { LookupsService } from './lookups.service';

@Global()
@Module({
  providers: [LookupsService],
  exports: [LookupsService],
})
export class LookupsModule {}

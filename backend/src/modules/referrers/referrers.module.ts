import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { ReferrersController } from './referrers.controller';
import { ReferrersService } from './referrers.service';

@Module({
  controllers: [ReferrersController],
  providers: [ReferrersService, MatchingService],
  exports: [MatchingService],
})
export class ReferrersModule {}

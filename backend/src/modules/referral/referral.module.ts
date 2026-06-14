import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReferralController],
  providers: [ReferralService],
})
export class ReferralModule {}

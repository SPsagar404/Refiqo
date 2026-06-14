import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodBody, ZodQuery } from '../../common/decorators/zod.decorator';
import {
  createReferralSchema,
  referralListQuerySchema,
  updateStatusSchema,
} from './dto/referral.schema';
import { ReferralService } from './referral.service';

@ApiTags('referrals')
@ApiBearerAuth()
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referral: ReferralService) {}

  @Post()
  @ApiOperation({ summary: 'Send a referral request' })
  create(
    @CurrentUser('id') userId: string,
    @ZodBody(createReferralSchema) body: typeof createReferralSchema._type,
  ) {
    return this.referral.create(userId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List my requests (seeker) or incoming (referrer)' })
  list(
    @CurrentUser('id') userId: string,
    @ZodQuery(referralListQuerySchema) query: typeof referralListQuerySchema._type,
  ) {
    return this.referral.list(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Request detail + status history' })
  detail(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.referral.detail(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Referrer/admin: update request status' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ZodBody(updateStatusSchema) body: typeof updateStatusSchema._type,
  ) {
    return this.referral.updateStatus(user.id, user.role, id, body);
  }
}

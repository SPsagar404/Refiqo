import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodQuery } from '../../common/decorators/zod.decorator';
import { referrerQuerySchema } from './dto/referrers.schema';
import { ReferrersService } from './referrers.service';

@ApiTags('referrers')
@ApiBearerAuth()
@Controller('referrers')
export class ReferrersController {
  constructor(private readonly referrers: ReferrersService) {}

  @Get()
  @ApiOperation({ summary: 'Discover referrers with filters' })
  discover(
    @CurrentUser('id') userId: string,
    @ZodQuery(referrerQuerySchema) query: typeof referrerQuerySchema._type,
  ) {
    return this.referrers.discover(userId, query);
  }

  @Get('top-matches')
  @ApiOperation({ summary: 'Personalized top matches (dashboard)' })
  topMatches(@CurrentUser('id') userId: string) {
    return this.referrers.topMatches(userId);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Recommended referrers' })
  recommended(@CurrentUser('id') userId: string) {
    return this.referrers.recommended(userId);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get user saved referrers' })
  getSaved(@CurrentUser('id') userId: string) {
    return this.referrers.listSaved(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full referrer profile' })
  getOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.referrers.getById(userId, id);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Toggle save/like a referrer' })
  toggleSave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.referrers.toggleSave(userId, id);
  }
}

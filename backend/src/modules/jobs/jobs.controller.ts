import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodQuery } from '../../common/decorators/zod.decorator';
import { jobQuerySchema } from './dto/jobs.schema';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Discover open jobs' })
  list(
    @CurrentUser('id') userId: string,
    @ZodQuery(jobQuerySchema) query: typeof jobQuerySchema._type,
  ) {
    return this.jobs.list(userId, query);
  }

  @Get('saved')
  @ApiOperation({ summary: 'Get user saved jobs' })
  getSaved(@CurrentUser('id') userId: string) {
    return this.jobs.listSaved(userId);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Toggle save/like a job' })
  toggleSave(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobs.toggleSave(userId, id);
  }
}

import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodBody, ZodQuery } from '../../common/decorators/zod.decorator';
import { createSkillSchema, skillQuerySchema } from './dto/skills.schema';
import { SkillsService } from './skills.service';

@ApiTags('skills')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'Skill catalog / autocomplete' })
  list(@ZodQuery(skillQuerySchema) query: typeof skillQuerySchema._type) {
    return this.skills.list(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a custom skill (deduped by slug)' })
  create(@ZodBody(createSkillSchema) body: typeof createSkillSchema._type) {
    return this.skills.create(body);
  }
}

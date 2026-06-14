import { Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodBody } from '../../common/decorators/zod.decorator';
import {
  availabilitySchema,
  basicInfoSchema,
  experienceSkillsSchema,
  preferencesSchema,
  resumePortfolioSchema,
  skillsStepSchema,
} from './dto/onboarding.schema';
import { OnboardingService } from './onboarding.service';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  @ApiOperation({ summary: 'Current onboarding draft + step' })
  draft(@CurrentUser('id') userId: string) {
    return this.onboarding.getDraft(userId);
  }

  @Patch('basic-info')
  @ApiOperation({ summary: 'Step 1 — basic information' })
  basicInfo(
    @CurrentUser('id') userId: string,
    @ZodBody(basicInfoSchema) body: typeof basicInfoSchema._type,
  ) {
    return this.onboarding.saveBasicInfo(userId, body);
  }

  @Patch('skills')
  @ApiOperation({ summary: 'Step 2 — skills & expertise (legacy; skills only)' })
  skills(
    @CurrentUser('id') userId: string,
    @ZodBody(skillsStepSchema) body: typeof skillsStepSchema._type,
  ) {
    return this.onboarding.saveSkills(userId, body);
  }

  @Patch('experience-skills')
  @ApiOperation({ summary: 'Step 2 — professional experience & skills' })
  experienceSkills(
    @CurrentUser('id') userId: string,
    @ZodBody(experienceSkillsSchema) body: typeof experienceSkillsSchema._type,
  ) {
    return this.onboarding.saveExperienceSkills(userId, body);
  }

  @Patch('resume-portfolio')
  @ApiOperation({ summary: 'Step 3 — resume & portfolio' })
  resumePortfolio(
    @CurrentUser('id') userId: string,
    @ZodBody(resumePortfolioSchema) body: typeof resumePortfolioSchema._type,
  ) {
    return this.onboarding.saveResumePortfolio(userId, body);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Step 4 — referral preferences' })
  preferences(
    @CurrentUser('id') userId: string,
    @ZodBody(preferencesSchema) body: typeof preferencesSchema._type,
  ) {
    return this.onboarding.savePreferences(userId, body);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Step 5 — referral availability' })
  availability(
    @CurrentUser('id') userId: string,
    @ZodBody(availabilitySchema) body: typeof availabilitySchema._type,
  ) {
    return this.onboarding.saveAvailability(userId, body);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Mark onboarding complete; returns profile summary' })
  complete(@CurrentUser('id') userId: string) {
    return this.onboarding.complete(userId);
  }
}

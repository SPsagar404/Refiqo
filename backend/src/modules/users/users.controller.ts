import { Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodBody } from '../../common/decorators/zod.decorator';
import {
  canReferSchema,
  notificationPrefsSchema,
  privacySchema,
  registerDeviceSchema,
  replaceEducationSchema,
  replaceExperienceSchema,
  replaceSkillsSchema,
  updateProfileSchema,
} from './dto/users.schema';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Full profile' })
  me(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update personal info' })
  update(
    @CurrentUser('id') userId: string,
    @ZodBody(updateProfileSchema) body: typeof updateProfileSchema._type,
  ) {
    return this.users.updateProfile(userId, body);
  }

  @Put('me/experience')
  @ApiOperation({ summary: 'Replace experience collection' })
  experience(
    @CurrentUser('id') userId: string,
    @ZodBody(replaceExperienceSchema) body: typeof replaceExperienceSchema._type,
  ) {
    return this.users.replaceExperience(userId, body);
  }

  @Put('me/education')
  @ApiOperation({ summary: 'Replace education collection' })
  education(
    @CurrentUser('id') userId: string,
    @ZodBody(replaceEducationSchema) body: typeof replaceEducationSchema._type,
  ) {
    return this.users.replaceEducation(userId, body);
  }

  @Put('me/skills')
  @ApiOperation({ summary: 'Replace skills collection' })
  skills(
    @CurrentUser('id') userId: string,
    @ZodBody(replaceSkillsSchema) body: typeof replaceSkillsSchema._type,
  ) {
    return this.users.replaceSkills(userId, body);
  }

  @Get('me/notification-preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getNotificationPrefs(@CurrentUser('id') userId: string) {
    return this.users.getNotificationPrefs(userId);
  }

  @Patch('me/notification-preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  setNotificationPrefs(
    @CurrentUser('id') userId: string,
    @ZodBody(notificationPrefsSchema) body: typeof notificationPrefsSchema._type,
  ) {
    return this.users.updateNotificationPrefs(userId, body);
  }

  @Get('me/privacy')
  @ApiOperation({ summary: 'Get privacy settings' })
  getPrivacy(@CurrentUser('id') userId: string) {
    return this.users.getPrivacy(userId);
  }

  @Patch('me/privacy')
  @ApiOperation({ summary: 'Update privacy settings' })
  setPrivacy(
    @CurrentUser('id') userId: string,
    @ZodBody(privacySchema) body: typeof privacySchema._type,
  ) {
    return this.users.updatePrivacy(userId, body);
  }

  @Post('me/devices')
  @ApiOperation({ summary: 'Register an FCM device token' })
  registerDevice(
    @CurrentUser('id') userId: string,
    @ZodBody(registerDeviceSchema) body: typeof registerDeviceSchema._type,
  ) {
    return this.users.registerDevice(userId, body);
  }

  @Post('me/become-referrer')
  @ApiOperation({ summary: 'Become a referrer (role=REFERRER + referrer profile)' })
  becomeReferrer(@CurrentUser('id') userId: string) {
    return this.users.becomeReferrer(userId);
  }

  @Patch('me/can-refer')
  @ApiOperation({ summary: 'Toggle accepting referral requests' })
  setCanRefer(
    @CurrentUser('id') userId: string,
    @ZodBody(canReferSchema) body: typeof canReferSchema._type,
  ) {
    return this.users.setCanRefer(userId, body.canRefer);
  }
}

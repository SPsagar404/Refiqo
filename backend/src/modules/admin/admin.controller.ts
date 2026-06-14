import { Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ZodBody, ZodQuery } from '../../common/decorators/zod.decorator';
import { AdminService } from './admin.service';
import { CurrentAdmin } from './decorators/current-admin.decorator';
import {
  adminLoginSchema,
  announcementSchema,
  jobSchema,
  jobUpdateSchema,
  listQuerySchema,
  referralStatusSchema,
  settingsSchema,
  userStatusSchema,
  verificationSchema,
} from './dto/admin.schema';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: 'Admin login' })
  login(@ZodBody(adminLoginSchema) body: typeof adminLoginSchema._type) {
    return this.admin.login(body);
  }

  // ─── Everything below requires a valid admin JWT ───────────────────────────
}

@ApiTags('admin')
@ApiBearerAuth()
@Public() // bypass the global user JwtAuthGuard; AdminJwtGuard enforces admin auth
@UseGuards(AdminJwtGuard)
@Controller('admin')
export class AdminProtectedController {
  constructor(private readonly admin: AdminService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Dashboard metrics' })
  metrics() {
    return this.admin.metrics();
  }

  @Get('users')
  @ApiOperation({ summary: 'List users' })
  users(@ZodQuery(listQuerySchema) query: typeof listQuerySchema._type) {
    return this.admin.listUsers(query);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Enable/disable/suspend a user' })
  userStatus(
    @Param('id') id: string,
    @ZodBody(userStatusSchema) body: typeof userStatusSchema._type,
  ) {
    return this.admin.setUserStatus(id, body);
  }

  @Get('referrers')
  @ApiOperation({ summary: 'List referrers' })
  referrers(@ZodQuery(listQuerySchema) query: typeof listQuerySchema._type) {
    return this.admin.listReferrers(query);
  }

  @Patch('referrers/:id/verification')
  @ApiOperation({ summary: 'Verify/suspend a referrer' })
  verification(
    @Param('id') id: string,
    @ZodBody(verificationSchema) body: typeof verificationSchema._type,
  ) {
    return this.admin.setVerification(id, body);
  }

  @Get('referrals')
  @ApiOperation({ summary: 'List referral requests' })
  referrals(@ZodQuery(listQuerySchema) query: typeof listQuerySchema._type) {
    return this.admin.listReferrals(query);
  }

  @Patch('referrals/:id/status')
  @ApiOperation({ summary: 'Update a referral request status' })
  referralStatus(
    @Param('id') id: string,
    @ZodBody(referralStatusSchema) body: typeof referralStatusSchema._type,
  ) {
    return this.admin.setReferralStatus(id, body);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List jobs' })
  jobs(@ZodQuery(listQuerySchema) query: typeof listQuerySchema._type) {
    return this.admin.listJobs(query);
  }

  @Post('jobs')
  @ApiOperation({ summary: 'Create a job' })
  createJob(@CurrentAdmin('id') adminId: string, @ZodBody(jobSchema) body: typeof jobSchema._type) {
    return this.admin.createJob(adminId, body);
  }

  @Patch('jobs/:id')
  @ApiOperation({ summary: 'Update a job' })
  updateJob(@Param('id') id: string, @ZodBody(jobUpdateSchema) body: typeof jobUpdateSchema._type) {
    return this.admin.updateJob(id, body);
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete (soft) a job' })
  deleteJob(@Param('id') id: string) {
    return this.admin.deleteJob(id);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List announcements' })
  announcements(@ZodQuery(listQuerySchema) query: typeof listQuerySchema._type) {
    return this.admin.listAnnouncements(query);
  }

  @Post('announcements')
  @ApiOperation({ summary: 'Create/broadcast an announcement' })
  createAnnouncement(
    @CurrentAdmin('id') adminId: string,
    @ZodBody(announcementSchema) body: typeof announcementSchema._type,
  ) {
    return this.admin.createAnnouncement(adminId, body);
  }

  @Get('reports/:kind')
  @ApiOperation({
    summary: 'Analytics report (user-growth|referral-growth|success-rate|status-breakdown)',
  })
  reports(@Param('kind') kind: string) {
    return this.admin.reports(kind);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Platform settings' })
  getSettings() {
    return this.admin.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Upsert a platform setting' })
  upsertSetting(@ZodBody(settingsSchema) body: typeof settingsSchema._type) {
    return this.admin.upsertSetting(body);
  }
}

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import {
  AnnouncementAudience,
  JobStatus,
  ReferralStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
  WorkMode,
} from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import {
  AdminLoginDto,
  AnnouncementDto,
  JobDto,
  JobUpdateDto,
  ListQueryDto,
  ReferralStatusDto,
  SettingsDto,
  UserStatusDto,
  VerificationDto,
} from './dto/admin.schema';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly lookups: LookupsService,
  ) {}

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !(await argon2.verify(admin.passwordHash, dto.password))) {
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });
    const accessToken = await this.jwt.signAsync(
      { sub: admin.id, email: admin.email, role: admin.role, type: 'admin-access' },
      { secret: `${this.config.get<string>('jwt.accessSecret')}:admin`, expiresIn: 28800 },
    );
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    };
  }

  // ─── Dashboard metrics ──────────────────────────────────────────────────────

  async metrics() {
    const [totalUsers, referrers, totalReferrals, accepted, pending, openJobs] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { role: UserRole.REFERRER, deletedAt: null } }),
        this.prisma.referralRequest.count(),
        this.prisma.referralRequest.count({ where: { status: ReferralStatus.ACCEPTED } }),
        this.prisma.referralRequest.count({ where: { status: ReferralStatus.PENDING } }),
        this.prisma.job.count({ where: { status: JobStatus.OPEN, deletedAt: null } }),
      ]);
    return {
      totalUsers,
      referrers,
      totalReferrals,
      acceptedReferrals: accepted,
      pendingReferrals: pending,
      openJobs,
      successRatePct: totalReferrals ? Math.round((accepted / totalReferrals) * 100) : 0,
    };
  }

  // ─── User management ──────────────────────────────────────────────────────

  async listUsers(query: ListQueryDto) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status as UserStatus } : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          isVerified: true,
          onboardingComplete: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async setUserStatus(id: string, dto: UserStatusDto) {
    await this.ensureUser(id);
    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status as UserStatus },
      select: { id: true, status: true },
    });
  }

  // ─── Referrer management ──────────────────────────────────────────────────

  async listReferrers(query: ListQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: UserRole.REFERRER,
      deletedAt: null,
      ...(query.search ? { fullName: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.status
        ? { referrerProfile: { is: { verificationStatus: query.status as VerificationStatus } } }
        : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          company: { select: { name: true } },
          referrerProfile: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async setVerification(userId: string, dto: VerificationDto) {
    await this.ensureUser(userId);
    return this.prisma.referrerProfile.upsert({
      where: { userId },
      update: {
        verificationStatus: dto.verificationStatus as VerificationStatus,
        ...(dto.canRefer !== undefined ? { canRefer: dto.canRefer } : {}),
      },
      create: {
        userId,
        verificationStatus: dto.verificationStatus as VerificationStatus,
        canRefer: dto.canRefer ?? true,
      },
    });
  }

  // ─── Referral management ──────────────────────────────────────────────────

  async listReferrals(query: ListQueryDto) {
    const where: Prisma.ReferralRequestWhereInput = {
      ...(query.status ? { status: query.status as ReferralStatus } : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.referralRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          seeker: { select: { id: true, fullName: true, email: true } },
          referrer: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.referralRequest.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async setReferralStatus(id: string, dto: ReferralStatusDto) {
    const existing = await this.prisma.referralRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ message: 'Request not found', code: 'NOT_FOUND' });
    return this.prisma.referralRequest.update({
      where: { id },
      data: {
        status: dto.status as ReferralStatus,
        rejectionReason: dto.status === ReferralStatus.REJECTED ? dto.rejectionReason : null,
      },
    });
  }

  // ─── Job management ──────────────────────────────────────────────────────

  async listJobs(query: ListQueryDto) {
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
      ...(query.status ? { status: query.status as JobStatus } : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { company: { select: { name: true } }, location: true },
      }),
      this.prisma.job.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async createJob(adminId: string, dto: JobDto) {
    const companyId = await this.lookups.companyId(dto.companyName);
    const locationId = await this.lookups.locationId(dto.city, dto.country);
    return this.prisma.job.create({
      data: {
        title: dto.title,
        companyId,
        locationId,
        workMode: dto.workMode as WorkMode | undefined,
        description: dto.description,
        applyUrl: dto.applyUrl || null,
        status: dto.status as JobStatus,
        postedByAdminId: adminId,
      },
    });
  }

  async updateJob(id: string, dto: JobUpdateDto) {
    const job = await this.prisma.job.findFirst({ where: { id, deletedAt: null } });
    if (!job) throw new NotFoundException({ message: 'Job not found', code: 'NOT_FOUND' });
    const companyId =
      dto.companyName !== undefined ? await this.lookups.companyId(dto.companyName) : undefined;
    const locationId =
      dto.city && dto.country ? await this.lookups.locationId(dto.city, dto.country) : undefined;
    return this.prisma.job.update({
      where: { id },
      data: {
        title: dto.title,
        ...(companyId !== undefined ? { companyId } : {}),
        ...(locationId !== undefined ? { locationId } : {}),
        workMode: dto.workMode as WorkMode | undefined,
        description: dto.description,
        applyUrl: dto.applyUrl === '' ? null : dto.applyUrl,
        status: dto.status as JobStatus | undefined,
      },
    });
  }

  async deleteJob(id: string) {
    await this.prisma.job.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ─── Announcements ──────────────────────────────────────────────────────

  async listAnnouncements(query: ListQueryDto) {
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.announcement.findMany({ skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.announcement.count(),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async createAnnouncement(adminId: string, dto: AnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        body: dto.body,
        audience: dto.audience as AnnouncementAudience,
        createdByAdminId: adminId,
        sentAt: dto.send ? new Date() : null,
      },
    });
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  async reports(kind: string) {
    switch (kind) {
      case 'user-growth':
        return this.growth('User');
      case 'referral-growth':
        return this.growth('ReferralRequest');
      case 'success-rate': {
        const m = await this.metrics();
        return {
          successRatePct: m.successRatePct,
          accepted: m.acceptedReferrals,
          total: m.totalReferrals,
        };
      }
      case 'status-breakdown': {
        const grouped = await this.prisma.referralRequest.groupBy({
          by: ['status'],
          _count: { _all: true },
        });
        return grouped.map((g) => ({ status: g.status, count: g._count._all }));
      }
      default:
        throw new NotFoundException({ message: 'Unknown report', code: 'NOT_FOUND' });
    }
  }

  /** Raw daily counts for the last 30 days (parameterized; table name is from a fixed allowlist). */
  private async growth(table: 'User' | 'ReferralRequest') {
    const rows = await this.prisma.$queryRawUnsafe<{ day: Date; count: bigint }[]>(
      `SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::bigint AS count
       FROM "${table}"
       WHERE "createdAt" >= NOW() - INTERVAL '30 days'
       GROUP BY 1 ORDER BY 1`,
    );
    return rows.map((r) => ({ day: r.day, count: Number(r.count) }));
  }

  // ─── Settings ──────────────────────────────────────────────────────────────

  async getSettings() {
    return this.prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertSetting(dto: SettingsDto) {
    return this.prisma.platformSetting.upsert({
      where: { key: dto.key },
      update: { value: dto.value as Prisma.InputJsonValue },
      create: { key: dto.key, value: dto.value as Prisma.InputJsonValue },
    });
  }

  private async ensureUser(id: string) {
    const exists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException({ message: 'User not found', code: 'NOT_FOUND' });
  }
}

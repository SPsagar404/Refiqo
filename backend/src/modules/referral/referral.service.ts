import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { parseSort } from '../../contracts/common.schema';
import {
  NotificationType,
  REFERRAL_STATUS_TRANSITIONS,
  ReferralStatus,
  UserRole,
} from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReferralDto, ReferralListQueryDto, UpdateStatusDto } from './dto/referral.schema';

export interface StatusEvent {
  status: string;
  at: string;
  by: string;
  reason?: string;
}

const PARTY_SELECT = {
  id: true,
  fullName: true,
  jobTitle: true,
  avatarUrl: true,
  experienceYears: true,
  company: { select: { name: true } },
  location: { select: { city: true, country: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class ReferralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(seekerId: string, dto: CreateReferralDto) {
    if (dto.referrerId === seekerId) {
      throw new BadRequestException({ message: 'Cannot refer yourself', code: 'SELF_REFERRAL' });
    }
    const referrer = await this.prisma.user.findFirst({
      where: { id: dto.referrerId, role: UserRole.REFERRER, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!referrer)
      throw new NotFoundException({ message: 'Referrer not found', code: 'NOT_FOUND' });

    const resume = await this.prisma.resume.findFirst({
      where: { id: dto.resumeId, userId: seekerId },
      select: { id: true },
    });
    if (!resume)
      throw new BadRequestException({ message: 'Resume not found', code: 'RESUME_NOT_FOUND' });

    const seeker = await this.prisma.user.findUnique({
      where: { id: seekerId },
      select: { fullName: true },
    });

    const history: StatusEvent[] = [
      { status: ReferralStatus.PENDING, at: new Date().toISOString(), by: seekerId },
    ];

    const request = await this.prisma.referralRequest.create({
      data: {
        seekerId,
        referrerId: dto.referrerId,
        jobId: dto.jobId,
        jobRole: dto.jobRole,
        jobLink: dto.jobLink || null,
        message: dto.message,
        note: dto.note,
        resumeId: dto.resumeId,
        status: ReferralStatus.PENDING,
        statusHistory: history as unknown as Prisma.InputJsonValue,
      },
    });

    await this.notifications.dispatch({
      userId: dto.referrerId,
      type: NotificationType.REFERRAL_REQUEST_RECEIVED,
      title: 'New referral request',
      body: `${seeker?.fullName ?? 'Someone'} requested a referral for ${dto.jobRole}`,
      data: { referralId: request.id },
    });

    return request;
  }

  async list(userId: string, query: ReferralListQueryDto) {
    const where: Prisma.ReferralRequestWhereInput = {
      ...(query.role === 'seeker' ? { seekerId: userId } : { referrerId: userId }),
      ...(query.status ? { status: query.status as ReferralStatus } : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const orderBy = parseSort(query.sort, ['createdAt', 'updatedAt']);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.referralRequest.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          seeker: { select: PARTY_SELECT },
          referrer: { select: PARTY_SELECT },
        },
      }),
      this.prisma.referralRequest.count({ where }),
    ]);
    return paginate(
      items.map((r) => this.toCard(r, query.role)),
      total,
      query.page,
      query.limit,
    );
  }

  async detail(userId: string, id: string) {
    const request = await this.prisma.referralRequest.findUnique({
      where: { id },
      include: {
        seeker: { select: PARTY_SELECT },
        referrer: { select: PARTY_SELECT },
        resume: { select: { id: true, fileName: true } },
        job: { select: { id: true, title: true } },
      },
    });
    if (!request || (request.seekerId !== userId && request.referrerId !== userId)) {
      throw new NotFoundException({ message: 'Request not found', code: 'NOT_FOUND' });
    }
    return {
      ...request,
      statusHistory: (request.statusHistory as unknown as StatusEvent[]) ?? [],
    };
  }

  async updateStatus(userId: string, role: UserRole, id: string, dto: UpdateStatusDto) {
    const request = await this.prisma.referralRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException({ message: 'Request not found', code: 'NOT_FOUND' });

    const isReferrer = request.referrerId === userId;
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    if (!isReferrer && !isAdmin) {
      throw new ForbiddenException({ message: 'Not allowed', code: 'FORBIDDEN' });
    }

    const allowedNext = REFERRAL_STATUS_TRANSITIONS[request.status] ?? [];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException({
        message: `Cannot transition from ${request.status} to ${dto.status}`,
        code: 'INVALID_STATUS_TRANSITION',
      });
    }

    const history = ((request.statusHistory as unknown as StatusEvent[]) ?? []).concat({
      status: dto.status,
      at: new Date().toISOString(),
      by: userId,
      reason: dto.rejectionReason,
    });

    const updated = await this.prisma.referralRequest.update({
      where: { id },
      data: {
        status: dto.status as ReferralStatus,
        rejectionReason: dto.status === ReferralStatus.REJECTED ? dto.rejectionReason : null,
        statusHistory: history as unknown as Prisma.InputJsonValue,
      },
    });

    // Bump referrer stats on acceptance.
    if (dto.status === ReferralStatus.ACCEPTED) {
      await this.prisma.referrerProfile
        .update({
          where: { userId: request.referrerId },
          data: { referralsGiven: { increment: 1 } },
        })
        .catch(() => undefined);
    }

    await this.notifySeeker(
      request.seekerId,
      dto.status,
      request.jobRole,
      request.id,
      dto.rejectionReason,
    );
    return updated;
  }

  private async notifySeeker(
    seekerId: string,
    status: string,
    jobRole: string,
    referralId: string,
    reason?: string,
  ) {
    const map: Partial<Record<string, { type: NotificationType; title: string; body: string }>> = {
      ACCEPTED: {
        type: NotificationType.REFERRAL_ACCEPTED,
        title: 'Referral accepted 🎉',
        body: `Your request for ${jobRole} was accepted`,
      },
      REJECTED: {
        type: NotificationType.REFERRAL_REJECTED,
        title: 'Referral declined',
        body: reason ? `Declined: ${reason}` : `Your request for ${jobRole} was declined`,
      },
      UNDER_REVIEW: {
        type: NotificationType.REFERRAL_UNDER_REVIEW,
        title: 'Request under review',
        body: `Your request for ${jobRole} is being reviewed`,
      },
    };
    const n = map[status];
    if (n) {
      await this.notifications.dispatch({ userId: seekerId, ...n, data: { referralId } });
    }
  }

  private toCard(
    r: Prisma.ReferralRequestGetPayload<{
      include: {
        seeker: { select: typeof PARTY_SELECT };
        referrer: { select: typeof PARTY_SELECT };
      };
    }>,
    role: 'seeker' | 'referrer',
  ) {
    const party = role === 'seeker' ? r.referrer : r.seeker;
    return {
      id: r.id,
      status: r.status,
      jobRole: r.jobRole,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      party: {
        id: party.id,
        fullName: party.fullName,
        jobTitle: party.jobTitle,
        avatarUrl: party.avatarUrl,
        experienceYears: party.experienceYears,
        company: party.company?.name ?? null,
        location: party.location ? `${party.location.city}, ${party.location.country}` : null,
      },
    };
  }
}

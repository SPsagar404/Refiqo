import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AvailabilityStatus, UserRole } from '../../contracts/enums';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { ReferrerQueryDto } from './dto/referrers.schema';
import { MatchingService, ReferrerCandidate } from './matching.service';

const CARD_INCLUDE = (viewerId?: string) => ({
  company: true,
  location: true,
  skills: { include: { skill: true } },
  availabilitySetting: true,
  referrerProfile: true,
  ...(viewerId ? {
    savedBySeekers: {
      where: { userId: viewerId },
      select: { id: true },
    },
  } : {}),
}) satisfies Prisma.UserInclude;

type ReferrerCardRow = Prisma.UserGetPayload<{
  include: {
    company: true;
    location: true;
    skills: { include: { skill: true } };
    availabilitySetting: true;
    referrerProfile: true;
    savedBySeekers: { select: { id: true } };
  };
}>;

@Injectable()
export class ReferrersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
  ) {}

  /** Base filter: active referrers with a referrer profile, excluding the viewer. */
  private baseWhere(viewerId: string): Prisma.UserWhereInput {
    return {
      id: { not: viewerId },
      role: UserRole.REFERRER,
      status: 'ACTIVE',
      deletedAt: null,
      referrerProfile: { is: { canRefer: true } },
    };
  }

  async discover(viewerId: string, query: ReferrerQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...this.baseWhere(viewerId),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { jobTitle: { contains: query.search, mode: 'insensitive' } },
              { company: { name: { contains: query.search, mode: 'insensitive' } } },
              { skills: { some: { skill: { name: { contains: query.search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
      ...(query.company
        ? { company: { name: { contains: query.company, mode: 'insensitive' } } }
        : {}),
      ...(query.location
        ? {
            location: {
              OR: [
                { city: { contains: query.location, mode: 'insensitive' } },
                { country: { contains: query.location, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      ...(query.minExp !== undefined ? { experienceYears: { gte: query.minExp } } : {}),
      ...(query.availability
        ? {
            availabilitySetting: {
              is: { availabilityStatus: query.availability as AvailabilityStatus },
            },
          }
        : {}),
      ...(query.skills.length
        ? { skills: { some: { skill: { name: { in: query.skills, mode: 'insensitive' } } } } }
        : {}),
    };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: CARD_INCLUDE(viewerId),
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(
      rows.map((r) => this.toCard(r)),
      total,
      query.page,
      query.limit,
    );
  }

  async topMatches(viewerId: string, limit = 10) {
    const ctx = await this.matching.buildSeekerContext(viewerId);
    const weights = await this.matching.getWeights();
    const candidates = await this.prisma.user.findMany({
      where: this.baseWhere(viewerId),
      include: CARD_INCLUDE(viewerId),
      take: 100, // MVP: score a recent window in JS (see ARCHITECTURE §matching)
      orderBy: { createdAt: 'desc' },
    });
    return candidates
      .map((c) => ({
        card: this.toCard(c),
        score: this.matching.score(c as ReferrerCandidate, ctx, weights),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ card, score }) => ({ ...card, matchScore: score }));
  }

  async recommended(viewerId: string, limit = 10) {
    const rows = await this.prisma.user.findMany({
      where: this.baseWhere(viewerId),
      include: CARD_INCLUDE(viewerId),
      orderBy: [
        { referrerProfile: { ratingAvg: 'desc' } },
        { referrerProfile: { referralsGiven: 'desc' } },
      ],
      take: limit,
    });
    return rows.map((r) => this.toCard(r));
  }

  async getById(viewerId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { ...this.baseWhere(viewerId), id },
      include: {
        ...CARD_INCLUDE(viewerId),
        experiences: { include: { company: true }, orderBy: { startDate: 'desc' } },
        educations: { orderBy: { graduationYear: 'desc' } },
      },
    });
    if (!user) throw new NotFoundException({ message: 'Referrer not found', code: 'NOT_FOUND' });
    const profile = user.referrerProfile;
    return {
      ...this.toCard(user),
      about: user.about,
      experiences: user.experiences.map((e) => ({
        title: e.title,
        company: e.company?.name ?? e.companyName,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        description: e.description,
      })),
      educations: user.educations,
      identity: {
        emailVerified: user.isVerified,
        companyVerified: user.companyVerified,
      },
      stats: {
        experienceYears: user.experienceYears,
        referralsGiven: profile?.referralsGiven ?? 0,
        responseRatePct: profile?.responseRatePct ?? 0,
        avgResponseHours: profile?.avgResponseHours ?? null,
        ratingAvg: profile?.ratingAvg ?? 0,
        ratingCount: profile?.ratingCount ?? 0,
      },
    };
  }

  private toCard(user: ReferrerCardRow) {
    return {
      id: user.id,
      fullName: user.fullName,
      jobTitle: user.jobTitle,
      avatarUrl: user.avatarUrl,
      company: user.company?.name ?? null,
      companyLogoUrl: user.company?.logoUrl ?? null,
      location: user.location ? `${user.location.city}, ${user.location.country}` : null,
      experienceYears: user.experienceYears,
      canRefer: user.referrerProfile?.canRefer ?? false,
      verificationStatus: user.referrerProfile?.verificationStatus ?? 'UNVERIFIED',
      availabilityStatus: user.availabilitySetting?.availabilityStatus ?? null,
      avgResponseHours: user.referrerProfile?.avgResponseHours ?? null,
      ratingAvg: user.referrerProfile?.ratingAvg ?? 0,
      skills: user.skills.map((s) => s.skill.name),
      isSaved: !!(user as any).savedBySeekers?.length,
    };
  }

  async toggleSave(userId: string, referrerId: string) {
    const existing = await this.prisma.savedReferrer.findUnique({
      where: { userId_referrerId: { userId, referrerId } },
    });
    if (existing) {
      await this.prisma.savedReferrer.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.savedReferrer.create({ data: { userId, referrerId } });
    return { saved: true };
  }

  async listSaved(userId: string) {
    const saved = await this.prisma.savedReferrer.findMany({
      where: { userId },
      include: { referrer: { include: CARD_INCLUDE(userId) } },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((s) => this.toCard(s.referrer));
  }
}


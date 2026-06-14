import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JobStatus, WorkMode } from '../../contracts/enums';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { JobQueryDto } from './dto/jobs.schema';

const JOB_INCLUDE = (viewerId?: string) => ({
  company: true,
  location: true,
  ...(viewerId ? {
    savedByUsers: {
      where: { userId: viewerId },
      select: { id: true },
    },
  } : {}),
}) satisfies Prisma.JobInclude;

type JobCardRow = Prisma.JobGetPayload<{
  include: {
    company: true;
    location: true;
    savedByUsers: { select: { id: true } };
  };
}>;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(viewerId: string, query: JobQueryDto) {
    const where: Prisma.JobWhereInput = {
      status: JobStatus.OPEN,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
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
      ...(query.workMode ? { workMode: query.workMode as WorkMode } : {}),
    };

    const { skip, take } = toSkipTake(query.page, query.limit);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: JOB_INCLUDE(viewerId),
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return paginate(
      rows.map((r) => this.toJobCard(r)),
      total,
      query.page,
      query.limit,
    );
  }

  async toggleSave(userId: string, jobId: string) {
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) {
      await this.prisma.savedJob.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.savedJob.create({ data: { userId, jobId } });
    return { saved: true };
  }

  async listSaved(userId: string) {
    const saved = await this.prisma.savedJob.findMany({
      where: { userId },
      include: { job: { include: JOB_INCLUDE(userId) } },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((s) => this.toJobCard(s.job));
  }

  private toJobCard(job: JobCardRow) {
    return {
      id: job.id,
      title: job.title,
      company: job.company?.name ?? null,
      companyLogoUrl: job.company?.logoUrl ?? null,
      location: job.location ? `${job.location.city}, ${job.location.country}` : null,
      workMode: job.workMode,
      description: job.description,
      createdAt: job.createdAt,
      isSaved: !!job.savedByUsers?.length,
    };
  }
}

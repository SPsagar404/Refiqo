import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillDto, SkillQueryDto } from './dto/skills.schema';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: SkillQueryDto) {
    return this.prisma.skill.findMany({
      where: {
        ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
        ...(query.popular ? { isPopular: true } : {}),
      },
      orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
      take: query.limit,
    });
  }

  /** Create-or-return a skill by slug so custom skills don't duplicate. */
  async create(dto: CreateSkillDto) {
    const slug = slugify(dto.name);
    return this.prisma.skill.upsert({
      where: { slug },
      update: {},
      create: { name: dto.name, slug, isPopular: false },
    });
  }
}

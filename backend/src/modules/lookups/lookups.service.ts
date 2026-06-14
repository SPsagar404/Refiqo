import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Get-or-create helpers for normalized Company / Location rows. */
@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  async companyId(name?: string | null): Promise<string | undefined> {
    const trimmed = name?.trim();
    if (!trimmed) return undefined;
    const company = await this.prisma.company.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
    });
    return company.id;
  }

  async locationId(city?: string | null, country?: string | null): Promise<string | undefined> {
    const c = city?.trim();
    const k = country?.trim();
    if (!c || !k) return undefined;
    const location = await this.prisma.location.upsert({
      where: { city_country: { city: c, country: k } },
      update: {},
      create: { city: c, country: k },
    });
    return location.id;
  }
}

import { Injectable } from '@nestjs/common';
import { AvailabilityStatus } from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';

export interface MatchWeights {
  skillOverlap: number;
  companyPreference: number;
  locationMatch: number;
  rolePreference: number;
  availabilityBoost: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  skillOverlap: 0.4,
  companyPreference: 0.2,
  locationMatch: 0.15,
  rolePreference: 0.15,
  availabilityBoost: 0.1,
};

const AVAILABILITY_SCORE: Record<string, number> = {
  [AvailabilityStatus.AVAILABLE_NOW]: 1,
  [AvailabilityStatus.AVAILABLE_1_2_WEEKS]: 0.7,
  [AvailabilityStatus.LIMITED]: 0.4,
  [AvailabilityStatus.NOT_AVAILABLE]: 0,
};

interface SeekerContext {
  skillNames: Set<string>;
  preferredCompanies: Set<string>;
  preferredLocations: Set<string>;
  preferredRoles: Set<string>;
}

export interface ReferrerCandidate {
  id: string;
  jobTitle: string | null;
  skills: { skill: { name: string } }[];
  company: { name: string } | null;
  location: { city: string; country: string } | null;
  availabilitySetting: { availabilityStatus: string } | null;
}

/**
 * Weighted match scoring (0–100). Weights are admin-tunable via the
 * `match_weights` PlatformSetting (see ARCHITECTURE §matching).
 */
@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async getWeights(): Promise<MatchWeights> {
    const row = await this.prisma.platformSetting.findUnique({ where: { key: 'match_weights' } });
    if (!row) return DEFAULT_WEIGHTS;
    return { ...DEFAULT_WEIGHTS, ...(row.value as Partial<MatchWeights>) };
  }

  async buildSeekerContext(seekerId: string): Promise<SeekerContext> {
    const seeker = await this.prisma.user.findUnique({
      where: { id: seekerId },
      include: { skills: { include: { skill: true } }, referralPreference: true },
    });
    const lower = (s: string) => s.toLowerCase().trim();
    return {
      skillNames: new Set(seeker?.skills.map((s) => lower(s.skill.name)) ?? []),
      preferredCompanies: new Set(
        (seeker?.referralPreference?.preferredCompanies ?? []).map(lower),
      ),
      preferredLocations: new Set(
        (seeker?.referralPreference?.preferredLocations ?? []).map(lower),
      ),
      preferredRoles: new Set((seeker?.referralPreference?.roles ?? []).map(lower)),
    };
  }

  score(referrer: ReferrerCandidate, ctx: SeekerContext, weights: MatchWeights): number {
    const lower = (s: string) => s.toLowerCase().trim();
    const refSkills = referrer.skills.map((s) => lower(s.skill.name));

    // skill overlap (relative to seeker's skill set)
    const overlap = ctx.skillNames.size
      ? refSkills.filter((s) => ctx.skillNames.has(s)).length / ctx.skillNames.size
      : 0;

    const companyMatch =
      referrer.company && ctx.preferredCompanies.has(lower(referrer.company.name)) ? 1 : 0;

    const locationMatch =
      referrer.location &&
      (ctx.preferredLocations.has(lower(referrer.location.city)) ||
        ctx.preferredLocations.has(lower(referrer.location.country)))
        ? 1
        : 0;

    const roleMatch =
      referrer.jobTitle &&
      [...ctx.preferredRoles].some(
        (role) =>
          lower(referrer.jobTitle!).includes(role) || role.includes(lower(referrer.jobTitle!)),
      )
        ? 1
        : 0;

    const availability =
      AVAILABILITY_SCORE[referrer.availabilitySetting?.availabilityStatus ?? ''] ?? 0;

    const raw =
      weights.skillOverlap * Math.min(overlap, 1) +
      weights.companyPreference * companyMatch +
      weights.locationMatch * locationMatch +
      weights.rolePreference * roleMatch +
      weights.availabilityBoost * availability;

    return Math.round(raw * 100);
  }
}

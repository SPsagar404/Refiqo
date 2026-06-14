import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AvailabilityStatus,
  ContactMethod,
  PortfolioType,
  ReferralCategory,
  ResponseTime,
  WorkMode,
} from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { SkillsService } from '../skills/skills.service';
import {
  AvailabilityDto,
  BasicInfoDto,
  ExperienceSkillsDto,
  PreferencesDto,
  ResumePortfolioDto,
  SkillsStepDto,
} from './dto/onboarding.schema';

const STEP = {
  BASIC_INFO: 1,
  SKILLS: 2,
  RESUME: 3,
  PREFERENCES: 4,
  AVAILABILITY: 5,
} as const;

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
    private readonly skills: SkillsService,
  ) {}

  /** Current draft + the highest step reached. */
  async getDraft(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        location: true,
        educations: true,
        experiences: { orderBy: { startDate: 'desc' } },
        skills: { include: { skill: true } },
        resumes: true,
        portfolioLinks: true,
        referralPreference: true,
        availabilitySetting: true,
      },
    });
    if (!user) throw new BadRequestException({ message: 'User not found', code: 'NOT_FOUND' });
    return {
      onboardingStep: user.onboardingStep,
      onboardingComplete: user.onboardingComplete,
      basicInfo: {
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        experienceYears: user.experienceYears,
        companyName: user.company?.name ?? null,
        city: user.location?.city ?? null,
        country: user.location?.country ?? null,
        phone: user.phone,
        linkedinUrl: user.linkedinUrl,
        portfolioUrl: user.portfolioUrl,
        about: user.about,
        lookingFor: user.lookingFor,
        preferredWorkMode: user.preferredWorkMode,
        willingToRelocate: user.willingToRelocate,
        education: user.educations[0] ?? null,
      },
      experiences: user.experiences.map((e) => ({
        id: e.id,
        companyName: e.companyName,
        title: e.title,
        employmentType: e.employmentType,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        description: e.description,
      })),
      skills: user.skills.map((s) => ({ id: s.skill.id, name: s.skill.name })),
      resumes: user.resumes,
      portfolioLinks: user.portfolioLinks,
      preferences: user.referralPreference,
      availability: user.availabilitySetting,
    };
  }

  async saveBasicInfo(userId: string, dto: BasicInfoDto) {
    const locationId = await this.lookups.locationId(dto.city, dto.country);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        locationId,
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl || null,
        portfolioUrl: dto.portfolioUrl || null,
        about: dto.about,
        preferredWorkMode: dto.preferredWorkMode as WorkMode | undefined,
        willingToRelocate: dto.willingToRelocate ?? false,
        // Headline fields (jobTitle/company/experienceYears) are derived from
        // Step-2 experience; only set here if explicitly provided (back-compat).
        ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
        ...(dto.experienceYears !== undefined ? { experienceYears: dto.experienceYears } : {}),
        ...(dto.companyName ? { companyId: await this.lookups.companyId(dto.companyName) } : {}),
        ...(dto.lookingFor !== undefined ? { lookingFor: dto.lookingFor } : {}),
      },
    });

    if (dto.education) {
      // single highest-degree record during onboarding: replace existing
      await this.prisma.education.deleteMany({ where: { userId } });
      await this.prisma.education.create({
        data: {
          userId,
          degree: dto.education.degree,
          fieldOfStudy: dto.education.fieldOfStudy,
          institution: dto.education.institution,
          graduationYear: dto.education.graduationYear,
          currentlyPursuing: dto.education.currentlyPursuing ?? false,
        },
      });
    }

    await this.advanceStep(userId, STEP.BASIC_INFO);
    return this.getDraft(userId);
  }

  async saveSkills(userId: string, dto: SkillsStepDto) {
    await this.replaceSkills(userId, dto.skillIds, dto.customSkills);
    await this.advanceStep(userId, STEP.SKILLS);
    return this.getDraft(userId);
  }

  /** Step 2 (new): replace work experiences and skills in one shot. */
  async saveExperienceSkills(userId: string, dto: ExperienceSkillsDto) {
    if (dto.experiences.filter((e) => e.current).length > 1) {
      throw new BadRequestException({
        message: 'Only one experience can be marked as current',
        code: 'MULTIPLE_CURRENT_EXPERIENCES',
      });
    }
    // Replace the user's experience set with what was submitted.
    await this.prisma.experience.deleteMany({ where: { userId } });
    await this.prisma.experience.createMany({
      data: dto.experiences.map((e) => ({
        userId,
        companyName: e.companyName,
        title: e.title,
        employmentType: e.employmentType,
        location: e.location || null,
        startDate: e.startDate,
        endDate: e.current ? null : (e.endDate ?? null),
        current: e.current,
        description: e.description || null,
      })),
    });

    // Derive the profile headline from experience (single source of truth):
    // prefer the "current" role, else the most recent by start date.
    const headline =
      dto.experiences.find((e) => e.current) ??
      [...dto.experiences].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0];
    const earliestStart = Math.min(...dto.experiences.map((e) => e.startDate.getTime()));
    const latestEnd = Math.max(
      ...dto.experiences.map((e) => (e.current || !e.endDate ? Date.now() : e.endDate.getTime())),
    );
    const experienceYears = Math.max(
      0,
      Math.floor((latestEnd - earliestStart) / (365.25 * 24 * 60 * 60 * 1000)),
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        jobTitle: headline.title,
        experienceYears,
        companyId: await this.lookups.companyId(headline.companyName),
      },
    });

    await this.replaceSkills(userId, dto.skillIds, dto.customSkills);
    await this.advanceStep(userId, STEP.SKILLS);
    return this.getDraft(userId);
  }

  /** Resolves custom skill names to ids, then replaces the user's skill set. */
  private async replaceSkills(userId: string, skillIds: string[], customSkills: string[]) {
    const ids = new Set(skillIds);
    for (const name of customSkills) {
      const skill = await this.skills.create({ name });
      ids.add(skill.id);
    }
    if (ids.size === 0) {
      throw new BadRequestException({ message: 'Add at least one skill', code: 'SKILLS_REQUIRED' });
    }
    await this.prisma.userSkill.deleteMany({ where: { userId } });
    await this.prisma.userSkill.createMany({
      data: [...ids].map((skillId) => ({ userId, skillId })),
      skipDuplicates: true,
    });
  }

  async saveResumePortfolio(userId: string, dto: ResumePortfolioDto) {
    if (dto.resumeId) {
      const resume = await this.prisma.resume.findFirst({
        where: { id: dto.resumeId, userId },
      });
      if (!resume) {
        throw new BadRequestException({ message: 'Resume not found', code: 'RESUME_NOT_FOUND' });
      }
      await this.prisma.resume.updateMany({ where: { userId }, data: { isPrimary: false } });
      await this.prisma.resume.update({ where: { id: dto.resumeId }, data: { isPrimary: true } });
    }
    await this.prisma.portfolioLink.deleteMany({ where: { userId } });
    if (dto.portfolioLinks.length) {
      await this.prisma.portfolioLink.createMany({
        data: dto.portfolioLinks.map((l) => ({
          userId,
          type: l.type as PortfolioType,
          url: l.url,
          title: l.title,
          description: l.description,
        })),
      });
    }
    await this.advanceStep(userId, STEP.RESUME);
    return this.getDraft(userId);
  }

  async savePreferences(userId: string, dto: PreferencesDto) {
    await this.prisma.referralPreference.upsert({
      where: { userId },
      update: {
        categories: dto.categories as ReferralCategory[],
        roles: dto.roles,
        preferredCompanies: dto.preferredCompanies,
        preferredLocations: dto.preferredLocations,
      },
      create: {
        userId,
        categories: dto.categories as ReferralCategory[],
        roles: dto.roles,
        preferredCompanies: dto.preferredCompanies,
        preferredLocations: dto.preferredLocations,
      },
    });
    await this.advanceStep(userId, STEP.PREFERENCES);
    return this.getDraft(userId);
  }

  async saveAvailability(userId: string, dto: AvailabilityDto) {
    await this.prisma.availabilitySetting.upsert({
      where: { userId },
      update: {
        availabilityStatus: dto.availabilityStatus as AvailabilityStatus,
        responseTime: dto.responseTime as ResponseTime,
        contactMethods: dto.contactMethods as ContactMethod[],
      },
      create: {
        userId,
        availabilityStatus: dto.availabilityStatus as AvailabilityStatus,
        responseTime: dto.responseTime as ResponseTime,
        contactMethods: dto.contactMethods as ContactMethod[],
      },
    });
    await this.advanceStep(userId, STEP.AVAILABILITY);
    return this.getDraft(userId);
  }

  async complete(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        experiences: true,
        referralPreference: true,
        availabilitySetting: true,
      },
    });
    if (!user) throw new BadRequestException({ message: 'User not found', code: 'NOT_FOUND' });
    if (
      user.skills.length === 0 ||
      user.experiences.length === 0 ||
      !user.referralPreference ||
      !user.availabilitySetting
    ) {
      throw new BadRequestException({
        message: 'Complete all onboarding steps first',
        code: 'ONBOARDING_INCOMPLETE',
      });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingComplete: true, onboardingStep: STEP.AVAILABILITY, isVerified: true },
    });
    return {
      onboardingComplete: true,
      profile: {
        status: 'Complete',
        visibility: 'Active',
        verification: 'Verified',
        fullName: user.fullName,
        jobTitle: user.jobTitle,
      },
    };
  }

  /** Only ever moves the step counter forward. */
  private async advanceStep(userId: string, step: number) {
    await this.prisma.user.updateMany({
      where: { id: userId, onboardingStep: { lt: step } },
      data: { onboardingStep: step },
    });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { DevicePlatform, UserRole, VerificationStatus, WorkMode } from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { SkillsService } from '../skills/skills.service';
import {
  NotificationPrefsDto,
  PrivacyDto,
  RegisterDeviceDto,
  ReplaceEducationDto,
  ReplaceExperienceDto,
  ReplaceSkillsDto,
  UpdateProfileDto,
} from './dto/users.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
    private readonly skills: SkillsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        location: true,
        skills: { include: { skill: true } },
        experiences: { include: { company: true }, orderBy: { startDate: 'desc' } },
        educations: { orderBy: { graduationYear: 'desc' } },
        resumes: { orderBy: { createdAt: 'desc' } },
        portfolioLinks: true,
        referralPreference: true,
        availabilitySetting: true,
        referrerProfile: true,
      },
    });
    if (!user) throw new NotFoundException({ message: 'User not found', code: 'NOT_FOUND' });
    const { passwordHash: _pw, ...safe } = user;
    return { ...safe, skills: user.skills.map((s) => s.skill) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const companyId =
      dto.companyName !== undefined ? await this.lookups.companyId(dto.companyName) : undefined;
    const locationId =
      dto.city && dto.country ? await this.lookups.locationId(dto.city, dto.country) : undefined;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        jobTitle: dto.jobTitle,
        experienceYears: dto.experienceYears,
        ...(companyId !== undefined ? { companyId } : {}),
        ...(locationId !== undefined ? { locationId } : {}),
        phone: dto.phone,
        linkedinUrl: dto.linkedinUrl === '' ? null : dto.linkedinUrl,
        portfolioUrl: dto.portfolioUrl === '' ? null : dto.portfolioUrl,
        about: dto.about,
        lookingFor: dto.lookingFor,
        preferredWorkMode: dto.preferredWorkMode as WorkMode | undefined,
        willingToRelocate: dto.willingToRelocate,
        avatarUrl: dto.avatarUrl === '' ? null : dto.avatarUrl,
      },
    });
    return this.getProfile(userId);
  }

  async replaceExperience(userId: string, dto: ReplaceExperienceDto) {
    await this.prisma.experience.deleteMany({ where: { userId } });
    for (const item of dto.items) {
      const companyId = await this.lookups.companyId(item.companyName);
      await this.prisma.experience.create({
        data: {
          userId,
          companyId,
          companyName: item.companyName,
          title: item.title,
          startDate: item.startDate,
          endDate: item.current ? null : item.endDate,
          current: item.current ?? false,
          description: item.description,
        },
      });
    }
    return this.getProfile(userId);
  }

  async replaceEducation(userId: string, dto: ReplaceEducationDto) {
    await this.prisma.education.deleteMany({ where: { userId } });
    if (dto.items.length) {
      await this.prisma.education.createMany({
        data: dto.items.map((e) => ({
          userId,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy,
          institution: e.institution,
          graduationYear: e.graduationYear,
          currentlyPursuing: e.currentlyPursuing ?? false,
        })),
      });
    }
    return this.getProfile(userId);
  }

  async replaceSkills(userId: string, dto: ReplaceSkillsDto) {
    const ids = new Set(dto.skillIds);
    for (const name of dto.customSkills) {
      const skill = await this.skills.create({ name });
      ids.add(skill.id);
    }
    await this.prisma.userSkill.deleteMany({ where: { userId } });
    await this.prisma.userSkill.createMany({
      data: [...ids].map((skillId) => ({ userId, skillId })),
      skipDuplicates: true,
    });
    return this.getProfile(userId);
  }

  async getNotificationPrefs(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updateNotificationPrefs(userId: string, dto: NotificationPrefsDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async getPrivacy(userId: string) {
    const prefs = await this.getNotificationPrefs(userId);
    return {
      profilePublic: prefs.profilePublic,
      showEmail: prefs.showEmail,
      showPhone: prefs.showPhone,
    };
  }

  async updatePrivacy(userId: string, dto: PrivacyDto) {
    const updated = await this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
    return {
      profilePublic: updated.profilePublic,
      showEmail: updated.showEmail,
      showPhone: updated.showPhone,
    };
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    return this.prisma.device.upsert({
      where: { fcmToken: dto.fcmToken },
      update: { userId, platform: dto.platform as DevicePlatform },
      create: { userId, fcmToken: dto.fcmToken, platform: dto.platform as DevicePlatform },
    });
  }

  /**
   * Promote the current user into a referrer: set role=REFERRER and ensure a
   * ReferrerProfile with canRefer=true so they appear in discovery/matches.
   */
  async becomeReferrer(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ message: 'User not found', code: 'NOT_FOUND' });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.REFERRER },
    });
    await this.prisma.referrerProfile.upsert({
      where: { userId },
      update: { canRefer: true },
      create: {
        userId,
        companyId: user.companyId,
        canRefer: true,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });
    return this.getProfile(userId);
  }

  /** Toggle whether the referrer is currently accepting referral requests. */
  async setCanRefer(userId: string, canRefer: boolean) {
    await this.prisma.referrerProfile.upsert({
      where: { userId },
      update: { canRefer },
      create: { userId, canRefer },
    });
    return this.getProfile(userId);
  }
}

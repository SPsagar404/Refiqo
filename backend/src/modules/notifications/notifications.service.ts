import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationType } from '../../contracts/enums';
import { paginate, toSkipTake } from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { PUSH_PORT, PushPort } from '../push/push.port';
import { NotificationPrefsDto, NotificationQueryDto } from './dto/notifications.schema';

export interface DispatchInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Maps a notification type to the preference flag that gates it. */
const TYPE_PREF: Record<string, keyof PrefFlags> = {
  REFERRAL_ACCEPTED: 'referralUpdates',
  REFERRAL_REJECTED: 'referralUpdates',
  REFERRAL_REQUEST_RECEIVED: 'referralUpdates',
  REFERRAL_UNDER_REVIEW: 'referralUpdates',
  NEW_MESSAGE: 'newMessages',
  REMINDER: 'reminders',
  MILESTONE: 'milestones',
  WELCOME: 'milestones',
};

interface PrefFlags {
  referralUpdates: boolean;
  newMessages: boolean;
  reminders: boolean;
  milestones: boolean;
  marketing: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PUSH_PORT) private readonly push: PushPort,
  ) {}

  /**
   * Persist a notification and fan out a push to the user's devices,
   * respecting per-type preferences. Called by referral/chat modules.
   */
  async dispatch(input: DispatchInput) {
    const prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId: input.userId },
    });
    const flag = TYPE_PREF[input.type];
    const allowed = !prefs || !flag || (prefs as unknown as PrefFlags)[flag] !== false;

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: (input.data ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (allowed) {
      const devices = await this.prisma.device.findMany({
        where: { userId: input.userId },
        select: { fcmToken: true },
      });
      await this.push.sendToTokens(
        devices.map((d) => d.fcmToken),
        {
          title: input.title,
          body: input.body,
          data: { type: input.type, notificationId: notification.id },
        },
      );
    }
    return notification;
  }

  async list(userId: string, query: NotificationQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.filter === 'unread' ? { readAt: null } : {}),
      ...(query.filter === 'mentions' ? { type: NotificationType.NEW_MESSAGE } : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(items, total, query.page, query.limit);
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async updatePreferences(userId: string, dto: NotificationPrefsDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }
}

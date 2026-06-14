import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType, NotificationType, ReferralStatus } from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  REALTIME_PORT,
  RealtimePort,
  conversationChannel,
  userChannel,
} from '../realtime/realtime.port';
import { CreateConversationDto, MessageQueryDto, SendMessageDto } from './dto/chat.schema';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(REALTIME_PORT) private readonly realtime: RealtimePort,
  ) {}

  /** Idempotent get-or-create of a 1:1 conversation. */
  async getOrCreate(userId: string, dto: CreateConversationDto) {
    if (dto.participantId === userId) {
      throw new ForbiddenException({ message: 'Cannot chat with yourself', code: 'SELF_CHAT' });
    }
    const other = await this.prisma.user.findUnique({
      where: { id: dto.participantId },
      select: { id: true },
    });
    if (!other) throw new NotFoundException({ message: 'User not found', code: 'NOT_FOUND' });

    // Gate: the two users can only chat once a referral request between them
    // has been ACCEPTED. Until then, communication is not allowed.
    await this.assertReferralAccepted(userId, dto.participantId);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.participantId } } },
        ],
      },
    });
    if (existing) return this.withMeta(userId, existing.id);

    const created = await this.prisma.conversation.create({
      data: {
        createdById: userId,
        participants: { create: [{ userId }, { userId: dto.participantId }] },
      },
    });
    return this.withMeta(userId, created.id);
  }

  async list(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                jobTitle: true,
                lastSeenAt: true,
              },
            },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return Promise.all(
      conversations.map(async (c) => {
        const me = c.participants.find((p) => p.userId === userId);
        const other = c.participants.find((p) => p.userId !== userId);
        const unread = await this.prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            createdAt: me?.lastReadAt ? { gt: me.lastReadAt } : undefined,
          },
        });
        const last = c.messages[0];
        return {
          id: c.id,
          participant: other?.user ?? null,
          lastMessage: last
            ? {
                body: last.body,
                type: last.type,
                createdAt: last.createdAt,
                senderId: last.senderId,
              }
            : null,
          lastMessageAt: c.lastMessageAt,
          unreadCount: unread,
        };
      }),
    );
  }

  async messages(userId: string, conversationId: string, query: MessageQueryDto) {
    await this.assertMember(userId, conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { attachments: true },
    });
    const hasMore = messages.length > query.limit;
    const page = hasMore ? messages.slice(0, query.limit) : messages;
    return {
      items: page.reverse(),
      meta: { nextCursor: hasMore ? page[0]?.id : null, hasMore },
    };
  }

  async send(userId: string, conversationId: string, dto: SendMessageDto) {
    const { other } = await this.assertMember(userId, conversationId);
    // Defense in depth: re-check the referral gate on every send so messaging
    // stays blocked unless an accepted referral exists between the two users.
    if (other) await this.assertReferralAccepted(userId, other);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        body: dto.body,
        type: dto.type as MessageType,
        deliveredAt: new Date(),
        ...(dto.attachment
          ? {
              attachments: {
                create: {
                  fileKey: dto.attachment.fileKey,
                  fileName: dto.attachment.fileName,
                  mimeType: dto.attachment.mimeType,
                  sizeBytes: dto.attachment.sizeBytes,
                },
              },
            }
          : {}),
      },
      include: { attachments: true },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    this.realtime.publish(conversationChannel(conversationId), 'message.created', {
      message: { ...message, createdAt: message.createdAt.toISOString() },
    });

    if (other) {
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      });
      await this.notifications.dispatch({
        userId: other,
        type: NotificationType.NEW_MESSAGE,
        title: sender?.fullName ?? 'New message',
        body: dto.type === 'TEXT' ? (dto.body ?? '') : 'Sent an attachment',
        data: { conversationId, messageId: message.id },
      });
    }
    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertMember(userId, conversationId);
    const now = new Date();
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: now },
    });
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: now },
    });
    this.realtime.publish(conversationChannel(conversationId), 'message.read', {
      conversationId,
      userId,
      readAt: now.toISOString(),
    });
    return { success: true };
  }

  async typing(userId: string, conversationId: string, isTyping: boolean) {
    await this.assertMember(userId, conversationId);
    this.realtime.publish(conversationChannel(conversationId), 'typing', {
      conversationId,
      userId,
      isTyping,
    });
    return { success: true };
  }

  async realtimeToken(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
    this.realtime.publish(userChannel(userId), 'presence', { userId, online: true });
    return this.realtime.issueClientToken(userId);
  }

  /**
   * Enforces the core rule: two users may only communicate once a referral
   * request between them (in either direction) has been ACCEPTED.
   */
  private async assertReferralAccepted(a: string, b: string) {
    const accepted = await this.prisma.referralRequest.findFirst({
      where: {
        status: ReferralStatus.ACCEPTED,
        OR: [
          { seekerId: a, referrerId: b },
          { seekerId: b, referrerId: a },
        ],
      },
      select: { id: true },
    });
    if (!accepted) {
      throw new ForbiddenException({
        message: 'You can message each other once a referral request has been accepted.',
        code: 'REFERRAL_NOT_ACCEPTED',
      });
    }
  }

  private async assertMember(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: { select: { userId: true } } },
    });
    if (!conversation || !conversation.participants.some((p) => p.userId === userId)) {
      throw new NotFoundException({ message: 'Conversation not found', code: 'NOT_FOUND' });
    }
    const other = conversation.participants.find((p) => p.userId !== userId)?.userId;
    return { conversation, other };
  }

  private async withMeta(userId: string, conversationId: string) {
    const list = await this.list(userId);
    return list.find((c) => c.id === conversationId) ?? { id: conversationId };
  }
}

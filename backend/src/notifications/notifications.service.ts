import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type FindNotificationsOptions = {
  take?: number;
  skip?: number;
  onlyUnread?: boolean;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string, opts: FindNotificationsOptions = {}) {
    const { take = 20, skip = 0, onlyUnread = false } = opts;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(onlyUnread ? { readAt: null } : {}),
    };

    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return { items, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    if (notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async notifyMany(
    userIds: string[],
    type: NotificationType,
    payload: Prisma.JsonObject,
  ): Promise<void> {
    if (userIds.length === 0) return;

    const actions = userIds.map((userId) =>
      this.prisma.notification.create({
        data: {
          userId,
          type,
          payload: payload as Prisma.InputJsonValue,
        },
      }),
    );

    await this.prisma.$transaction(actions);
  }

  async createSystemNotification(userId: string, title: string, body?: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        payload: { title, body: body ?? null } as Prisma.InputJsonValue,
      },
    });
  }
}

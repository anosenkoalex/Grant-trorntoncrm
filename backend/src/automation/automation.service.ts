import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { TelegramService } from '../telegram/telegram.service.js';

export type UpdateAutomationSettingsDto = {
  triggerOnCreate?: boolean;
  triggerOnUpdate?: boolean;
  triggerOnCancel?: boolean;
  reminderEnabled?: boolean;
  reminderHoursBefore?: number;
};

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly telegram: TelegramService,
  ) {}

  async getSettings(orgId: string) {
    const existing = await this.prisma.automationSettings.findUnique({
      where: { orgId },
    });

    if (existing) return existing;

    return {
      id: null as string | null,
      orgId,
      triggerOnCreate: true,
      triggerOnUpdate: true,
      triggerOnCancel: true,
      reminderEnabled: true,
      reminderHoursBefore: 24,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async updateSettings(orgId: string, dto: UpdateAutomationSettingsDto) {
    return this.prisma.automationSettings.upsert({
      where: { orgId },
      create: {
        orgId,
        triggerOnCreate: dto.triggerOnCreate ?? true,
        triggerOnUpdate: dto.triggerOnUpdate ?? true,
        triggerOnCancel: dto.triggerOnCancel ?? true,
        reminderEnabled: dto.reminderEnabled ?? true,
        reminderHoursBefore: dto.reminderHoursBefore ?? 24,
      },
      update: {
        ...(dto.triggerOnCreate !== undefined && { triggerOnCreate: dto.triggerOnCreate }),
        ...(dto.triggerOnUpdate !== undefined && { triggerOnUpdate: dto.triggerOnUpdate }),
        ...(dto.triggerOnCancel !== undefined && { triggerOnCancel: dto.triggerOnCancel }),
        ...(dto.reminderEnabled !== undefined && { reminderEnabled: dto.reminderEnabled }),
        ...(dto.reminderHoursBefore !== undefined && {
          reminderHoursBefore: dto.reminderHoursBefore,
        }),
      },
    });
  }

  async getNotificationLog(orgId: string, params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 50 } = params;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { orgId },
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notificationLog.count({ where: { orgId } }),
    ]);

    return { items, total, page, pageSize };
  }

  private async logNotification(
    orgId: string,
    userId: string | null,
    userLabel: string | null,
    type: string,
    channel: 'SYSTEM' | 'TELEGRAM',
  ) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          orgId,
          userId: userId ?? undefined,
          userLabel: userLabel ?? undefined,
          type,
          channel,
        },
      });
    } catch (err) {
      this.logger.error('Failed to write notification log', err);
    }
  }

  /**
   * Условно отправляет уведомления по типу назначений.
   * Проверяет настройки автоматизации для данной организации.
   */
  async notifyWithCheck(
    orgId: string,
    userIds: string[],
    type: NotificationType,
    payload: Prisma.JsonObject,
  ): Promise<void> {
    const settings = await this.getSettings(orgId);

    if (type === NotificationType.ASSIGNMENT_CREATED && !settings.triggerOnCreate) return;
    if (type === NotificationType.ASSIGNMENT_UPDATED && !settings.triggerOnUpdate) return;
    if (type === NotificationType.ASSIGNMENT_CANCELLED && !settings.triggerOnCancel) return;

    await this.notifications.notifyMany(userIds, type, payload);

    // Log system notifications
    const users = userIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    for (const uid of userIds) {
      const u = userMap.get(uid);
      await this.logNotification(
        orgId,
        uid,
        u ? (u.fullName ?? u.email) : null,
        type,
        'SYSTEM',
      );
    }

    // Telegram уведомление для событий назначения
    if (
      type === NotificationType.ASSIGNMENT_CREATED ||
      type === NotificationType.ASSIGNMENT_UPDATED ||
      type === NotificationType.ASSIGNMENT_CANCELLED
    ) {
      const sent = await this.telegram.notifyAssignment(type, payload);
      if (sent) {
        await this.logNotification(orgId, null, null, type, 'TELEGRAM');
      }
    }
  }

  /**
   * Cron-задача: каждый час ищет назначения, начинающиеся через N часов,
   * и отправляет REMINDER тем сотрудникам, которым ещё не отправляли.
   */
  @Cron('0 * * * *')
  async sendSlaReminders(): Promise<void> {
    this.logger.log('SLA reminder cron: start');

    try {
      const now = new Date();

      const allOrgSettings = await this.prisma.automationSettings.findMany({
        select: { orgId: true, reminderEnabled: true, reminderHoursBefore: true },
      });

      const configuredOrgIds = allOrgSettings.map((s) => s.orgId);
      const enabledSettings = allOrgSettings.filter((s) => s.reminderEnabled);

      const unconfiguredOrgs = await this.prisma.org.findMany({
        where:
          configuredOrgIds.length > 0 ? { id: { notIn: configuredOrgIds } } : {},
        select: { id: true },
      });

      const targets: { orgId: string; hoursBefore: number }[] = [
        ...enabledSettings.map((s) => ({ orgId: s.orgId, hoursBefore: s.reminderHoursBefore })),
        ...unconfiguredOrgs.map((o) => ({ orgId: o.id, hoursBefore: 24 })),
      ];

      let totalSent = 0;

      for (const { orgId, hoursBefore } of targets) {
        const from = new Date(now.getTime() + (hoursBefore - 0.5) * 3_600_000);
        const to = new Date(now.getTime() + (hoursBefore + 0.5) * 3_600_000);

        const assignments = await this.prisma.assignment.findMany({
          where: {
            deletedAt: null,
            status: 'ACTIVE',
            reminderSentAt: null,
            startsAt: { gte: from, lte: to },
            user: { orgId },
          },
          select: {
            id: true,
            userId: true,
            workplaceId: true,
            workplace: { select: { code: true, name: true } },
            user: { select: { fullName: true, email: true } },
          },
        });

        for (const a of assignments) {
          const wpLabel = [a.workplace.code, a.workplace.name].filter(Boolean).join(' — ');

          await this.notifications.notifyMany(
            [a.userId],
            NotificationType.REMINDER,
            {
              assignmentId: a.id,
              workplaceCode: a.workplace.code,
              workplaceName: a.workplace.name ?? null,
              userFullName: a.user.fullName ?? null,
              hoursUntilStart: hoursBefore,
              title: `Напоминание: назначение через ${hoursBefore} ч.`,
              body: wpLabel,
            },
          );

          await this.logNotification(
            orgId,
            a.userId,
            a.user.fullName ?? a.user.email,
            'REMINDER',
            'SYSTEM',
          );

          await this.prisma.assignment.update({
            where: { id: a.id },
            data: { reminderSentAt: now },
          });

          totalSent++;
        }
      }

      this.logger.log(`SLA reminder cron: sent ${totalSent} reminders`);
    } catch (err) {
      this.logger.error('SLA reminder cron failed', err);
    }
  }
}

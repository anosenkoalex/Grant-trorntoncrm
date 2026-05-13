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

    // Telegram уведомление для событий назначения
    if (
      type === NotificationType.ASSIGNMENT_CREATED ||
      type === NotificationType.ASSIGNMENT_UPDATED ||
      type === NotificationType.ASSIGNMENT_CANCELLED
    ) {
      await this.telegram.notifyAssignment(type, payload);
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

      // Получаем все настройки (enabled и disabled) — чтобы знать, кому НЕ слать
      const allOrgSettings = await this.prisma.automationSettings.findMany({
        select: { orgId: true, reminderEnabled: true, reminderHoursBefore: true },
      });

      const configuredOrgIds = allOrgSettings.map((s) => s.orgId);
      const enabledSettings = allOrgSettings.filter((s) => s.reminderEnabled);

      // Организации без настроек — дефолт: включено, 24 ч.
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
        // ±30 мин окно вокруг нужного момента
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
            user: { select: { fullName: true } },
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

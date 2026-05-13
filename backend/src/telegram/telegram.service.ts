import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type TelegramSettingsDto = {
  token?: string | null;
  chatId?: string | null;
  enabled: boolean;
};

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<TelegramSettingsDto & { id: string | null }> {
    const s = await this.prisma.telegramSettings.findFirst();
    if (!s) return { id: null, token: null, chatId: null, enabled: false };
    return { id: s.id, token: s.token, chatId: s.chatId, enabled: s.enabled };
  }

  async updateSettings(dto: TelegramSettingsDto): Promise<void> {
    const existing = await this.prisma.telegramSettings.findFirst();
    const data = {
      enabled: dto.enabled,
      token: dto.token?.trim() ?? null,
      chatId: dto.chatId?.trim() ?? null,
    };

    if (existing) {
      await this.prisma.telegramSettings.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.telegramSettings.create({ data });
    }

    this.logger.log('Telegram settings updated');
  }

  async sendMessage(text: string): Promise<void> {
    const settings = await this.getSettings();

    if (!settings.enabled) return;

    if (!settings.token || !settings.chatId) {
      this.logger.warn('Telegram token/chatId not set, skip');
      return;
    }

    try {
      await axios.post(
        `https://api.telegram.org/bot${settings.token}/sendMessage`,
        { chat_id: settings.chatId, text, parse_mode: 'HTML' },
        { timeout: 8000 },
      );
      this.logger.log('Telegram message sent');
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(`Telegram send failed: ${msg}`);
    }
  }

  async notifyAssignment(type: NotificationType, payload: Prisma.JsonObject): Promise<void> {
    const typeEmoji: Partial<Record<NotificationType, string>> = {
      ASSIGNMENT_CREATED: '🆕',
      ASSIGNMENT_UPDATED: '✏️',
      ASSIGNMENT_CANCELLED: '❌',
      ASSIGNMENT_MOVED: '🔄',
      REMINDER: '⏰',
      SYSTEM: '🔔',
    };

    const typeLabel: Partial<Record<NotificationType, string>> = {
      ASSIGNMENT_CREATED: 'Назначение создано',
      ASSIGNMENT_UPDATED: 'Назначение обновлено',
      ASSIGNMENT_CANCELLED: 'Назначение отменено',
      ASSIGNMENT_MOVED: 'Назначение перемещено',
      REMINDER: 'Напоминание',
      SYSTEM: 'Системное уведомление',
    };

    const emoji = typeEmoji[type] ?? '🔔';
    const label = typeLabel[type] ?? String(type);
    const lines = [`${emoji} <b>${label}</b>`];

    const user = payload['userFullName'] ?? payload['userName'];
    const code = payload['workplaceCode'];
    const workplace = payload['workplaceName'];
    const title = payload['title'];

    if (typeof user === 'string' && user) lines.push(`👤 ${user}`);
    if (typeof code === 'string' && code) {
      const namePart = typeof workplace === 'string' && workplace ? ` — ${workplace}` : '';
      lines.push(`🏢 ${code}${namePart}`);
    } else if (typeof workplace === 'string' && workplace) {
      lines.push(`🏢 ${workplace}`);
    }
    if (!user && !workplace && typeof title === 'string' && title) {
      lines.push(title);
    }

    await this.sendMessage(lines.join('\n'));
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException } from '@nestjs/common';
import { VacationStatus, VacationType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export type CreateVacationDto = {
  dateFrom: string;
  dateTo: string;
  type: VacationType;
  comment?: string;
};

const userSelect = { id: true, fullName: true, email: true } as const;

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, orgId: string, dto: CreateVacationDto) {
    return this.prisma.vacationRequest.create({
      data: {
        userId,
        orgId,
        dateFrom: new Date(dto.dateFrom),
        dateTo: new Date(dto.dateTo),
        type: dto.type,
        comment: dto.comment?.trim() ?? null,
      },
      include: { user: { select: userSelect } },
    });
  }

  async findAll(
    orgId: string,
    params: {
      status?: VacationStatus;
      userId?: string;
      page?: number;
      pageSize?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const {
      status,
      userId,
      page = 1,
      pageSize = 20,
      dateFrom,
      dateTo,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      orgId,
      ...(status ? { status } : {}),
      ...(userId ? { userId } : {}),
      ...(dateFrom || dateTo
        ? {
            AND: [
              ...(dateTo ? [{ dateFrom: { lte: new Date(dateTo) } }] : []),
              ...(dateFrom ? [{ dateTo: { gte: new Date(dateFrom) } }] : []),
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.vacationRequest.findMany({
        where,
        include: {
          user: { select: userSelect },
          decidedBy: { select: userSelect },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.vacationRequest.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findMine(userId: string) {
    return this.prisma.vacationRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, decidedById: string) {
    const req = await this.prisma.vacationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('VacationRequest not found');

    const updated = await this.prisma.vacationRequest.update({
      where: { id },
      data: {
        status: VacationStatus.APPROVED,
        decidedById,
        decidedAt: new Date(),
      },
      include: {
        user: { select: userSelect },
        decidedBy: { select: userSelect },
      },
    });

    const typeLabel = this.getTypeLabel(req.type);
    await this.notifications.createSystemNotification(
      req.userId,
      `Заявка одобрена`,
      `Ваша заявка (${typeLabel}) с ${this.formatDate(req.dateFrom)} по ${this.formatDate(req.dateTo)} одобрена.`,
    );

    return updated;
  }

  async reject(id: string, decidedById: string, comment?: string) {
    const req = await this.prisma.vacationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException('VacationRequest not found');

    const updated = await this.prisma.vacationRequest.update({
      where: { id },
      data: {
        status: VacationStatus.REJECTED,
        decidedById,
        decidedAt: new Date(),
        ...(comment ? { comment } : {}),
      },
      include: {
        user: { select: userSelect },
        decidedBy: { select: userSelect },
      },
    });

    const typeLabel = this.getTypeLabel(req.type);
    await this.notifications.createSystemNotification(
      req.userId,
      `Заявка отклонена`,
      `Ваша заявка (${typeLabel}) с ${this.formatDate(req.dateFrom)} по ${this.formatDate(req.dateTo)} отклонена${comment ? `: ${comment}` : '.'}`,
    );

    return updated;
  }

  private getTypeLabel(type: VacationType): string {
    const map: Record<VacationType, string> = {
      VACATION: 'Отпуск',
      SICK_LEAVE: 'Больничный',
      DAY_OFF: 'Отгул',
    };
    return map[type] ?? type;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}

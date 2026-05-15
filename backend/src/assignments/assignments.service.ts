/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  NotificationType,
  Prisma,
  UserRole,
  ShiftKind,
  AssignmentRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { UpdateAssignmentDto } from './dto/update-assignment.dto.js';
import { ListAssignmentsDto } from './dto/list-assignments.dto.js';
import { AutomationService } from '../automation/automation.service.js';
import { EmailService } from '../notifications/email.service.js';
import { SmsService } from '../sms/sms.service.js';
import { AuditService } from '../audit/audit.service.js';

type AdjustmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type RequestScheduleAdjustmentPayload = {
  date: string;
  startsAt?: string;
  endsAt?: string;
  kind?: ShiftKind | string;
  comment: string;
};

type ListScheduleAdjustmentsParams = {
  page?: number;
  pageSize?: number;
  status?: AdjustmentStatus;
  userId?: string;
  assignmentId?: string;
};

type ScheduleAdjustmentDecisionPayload = {
  managerComment?: string;
};

type ApproveOrReject = 'APPROVED' | 'REJECTED';

type CreateAssignmentRequestPayload = {
  workplaceId?: string | null;
  dateFrom: string | Date;
  dateTo: string | Date;
  slots?: unknown;
  comment?: string | null;
};

type ListAssignmentRequestsParams = {
  page?: number;
  pageSize?: number;
  status?: AssignmentRequestStatus;
  requesterId?: string;
  workplaceId?: string;
};

type AssignmentRequestDecisionPayload = {
  decisionComment?: string;
};

/**
 * Описывает одну смену, которую сотрудник запросил в комментарии
 * (мы будем по этому массиву полностью пересобирать график).
 */
type ParsedRequestedShift = {
  date: Date; // дата (с учётом локального часового пояса организации)
  startsAt: Date;
  endsAt: Date;
  kind: ShiftKind;
};

/**
 * Краткая статистика по назначениям для каждого сотрудника.
 * Используем для:
 *  - блока "Сотрудники без назначений"
 *  - подсветки в модалке выбора сотрудника.
 */
type UserAssignmentsSummary = {
  id: string;
  fullName: string | null;
  email: string;
  assignmentsCount: number; // количество активных назначений
};

@Injectable()
export class AssignmentsService {
  // Локальный часовой пояс организации (Кыргызстан, UTC+6).
  // Нужно, чтобы восстановить те же UTC-времена, которые даёт фронт при toISOString().
  private readonly LOCAL_TZ_OFFSET_MINUTES = 6 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly automation: AutomationService,
    private readonly email: EmailService,
    private readonly smsService: SmsService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Приводим from/to к Date
   */
  private normalizeRange(params: ListAssignmentsDto): {
    from: Date;
    to: Date;
  } {
    const rawFrom = params.from;
    const rawTo = params.to;

    const from =
      rawFrom instanceof Date
        ? rawFrom
        : rawFrom
          ? new Date(rawFrom)
          : new Date('1970-01-01T00:00:00.000Z');

    const to =
      rawTo instanceof Date
        ? rawTo
        : rawTo
          ? new Date(rawTo)
          : new Date('9999-12-31T23:59:59.999Z');

    return { from, to };
  }

  /**
   * Базовый where для обычных списков:
   *  - берём только НЕ удалённые (deletedAt = null)
   */
  private buildWhere(
    params: ListAssignmentsDto,
    orgId?: string,
  ): Prisma.AssignmentWhereInput {
    const where: Prisma.AssignmentWhereInput = {
      deletedAt: null,
    };

    if (orgId) {
      where.user = { orgId };
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.workplaceId) {
      where.workplaceId = params.workplaceId;
    }

    if (params.status) {
      where.status = params.status;
    }

    /**
     * Фильтрация по периоду:
     * берём все назначения, чьи интервалы [startsAt, endsAt/null=∞]
     * ПЕРЕСЕКАЮТСЯ с [from, to].
     */
    if (params.from || params.to) {
      const { from, to } = this.normalizeRange(params);

      where.AND = [
        // начало не позже конца выбранного периода
        { startsAt: { lte: to } },
        {
          // либо открытое (endsAt = null), либо конец не раньше начала периода
          OR: [{ endsAt: null }, { endsAt: { gte: from } }],
        },
      ];
    }

    return where;
  }

  /**
   * Отдельный where для КОРЗИНЫ (только удалённые).
   * Логика та же, но deletedAt != null.
   */
  private buildTrashWhere(
    params: ListAssignmentsDto,
    orgId?: string,
  ): Prisma.AssignmentWhereInput {
    const where: Prisma.AssignmentWhereInput = {
      deletedAt: { not: null },
    };

    if (orgId) {
      where.user = { orgId };
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.workplaceId) {
      where.workplaceId = params.workplaceId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.from || params.to) {
      const { from, to } = this.normalizeRange(params);

      where.AND = [
        { startsAt: { lte: to } },
        {
          OR: [{ endsAt: null }, { endsAt: { gte: from } }],
        },
      ];
    }

    return where;
  }

  /**
   * Проверяем пересечение интервалов назначений для сотрудника.
   * Разрешаем максимум 2 пересекающихся ACTIVE назначения.
   * На третье пересечение — кидаем ошибку.
   */
  private async ensureNoOverlap(
    userId: string,
    startsAt: Date,
    endsAt: Date | null,
    assignmentId?: string,
  ) {
    const rangeEnd = endsAt ?? new Date('9999-12-31T23:59:59.999Z');

    const overlapping = await this.prisma.assignment.findMany({
      where: {
        NOT: assignmentId ? { id: assignmentId } : undefined,
        userId,
        status: AssignmentStatus.ACTIVE,
        deletedAt: null,
        startsAt: { lte: rangeEnd },
        OR: [
          {
            endsAt: null,
          },
          {
            endsAt: { gte: startsAt },
          },
        ],
      },
      select: { id: true },
    });

    if (overlapping.length >= 2) {
      throw new ConflictException(
        'У сотрудника уже есть два активных назначения в этот период',
      );
    }
  }

  private async ensureWorkplaceInOrg(workplaceId: string, orgId: string) {
    const workplace = await this.prisma.workplace.findFirst({
      where: { id: workplaceId, orgId },
      select: { id: true },
    });

    if (!workplace) {
      throw new BadRequestException(
        'Рабочее место не принадлежит организации сотрудника',
      );
    }
  }

  // 🔒 Проверяем, что назначаем только обычного сотрудника (USER), не системного
  private async ensureCanAssign(userId: string, workplaceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        orgId: true,
        role: true,
        isSystemUser: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Сотрудник не найден');
    }

    if (!user.orgId) {
      throw new BadRequestException(
        'Сотрудник не привязан к организации, назначение невозможно',
      );
    }

    // Назначать можно только обычных сотрудников (USER),
    // админов / девелопера / менеджеров / системных — нельзя
    if (user.role !== UserRole.USER || user.isSystemUser) {
      throw new BadRequestException(
        'Назначать можно только сотрудников с ролью USER',
      );
    }

    await this.ensureWorkplaceInOrg(workplaceId, user.orgId);
  }

  private async resolveRecipients(userId: string, orgId: string) {
    const [orgAdmins, userEntity] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          orgId,
          role: UserRole.SUPER_ADMIN,
        },
        select: { id: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
    ]);

    const recipients = new Set<string>();

    for (const admin of orgAdmins) {
      recipients.add(admin.id);
    }

    if (userEntity) {
      recipients.add(userEntity.id);
    }

    return Array.from(recipients);
  }

  async create(payload: CreateAssignmentDto) {
    const { shifts, ...rest } = payload as any;

    await this.ensureCanAssign(rest.userId, rest.workplaceId);
    await this.ensureNoOverlap(rest.userId, rest.startsAt, rest.endsAt ?? null);

    const assignment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          userId: rest.userId,
          workplaceId: rest.workplaceId,
          startsAt: rest.startsAt,
          endsAt: rest.endsAt ?? null,
          status: rest.status ?? AssignmentStatus.ACTIVE,
          // deletedAt по умолчанию null в Prisma-схеме
        },
        include: {
          user: {
            select: { id: true, email: true, fullName: true, orgId: true },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              orgId: true,
              org: { select: { id: true } },
            },
          },
        },
      });

      // создаём смены для назначения
      await tx.assignmentShift.createMany({
        data: (shifts ?? []).map((shift: any) => ({
          assignmentId: created.id,
          date: shift.date,
          startsAt: shift.startsAt,
          endsAt: shift.endsAt,
          kind:
            shift.kind && ShiftKind[shift.kind as keyof typeof ShiftKind]
              ? shift.kind
              : ShiftKind.DEFAULT,
        })),
      });

      // возвращаем назначение уже с подгруженными сменами
      return tx.assignment.findUnique({
        where: { id: created.id },
        include: {
          user: {
            select: { id: true, email: true, fullName: true, orgId: true },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              orgId: true,
              org: { select: { id: true } },
            },
          },
          shifts: true,
        },
      });
    });

    const recipients = await this.resolveRecipients(
      assignment!.userId,
      assignment!.workplace.orgId,
    );

    await this.automation.notifyWithCheck(
      assignment!.workplace.orgId,
      recipients,
      NotificationType.ASSIGNMENT_CREATED,
      {
        assignmentId: assignment!.id,
        userId: assignment!.userId,
        workplaceId: assignment!.workplaceId,
      },
    );

    void this.audit.log(
      assignment!.workplace.orgId,
      assignment!.userId,
      'CREATE',
      'Assignment',
      assignment!.id,
      {
        employee:
          assignment!.user?.fullName?.trim() || assignment!.user?.email || '',
        workplace: [assignment!.workplace.code, assignment!.workplace.name]
          .filter(Boolean)
          .join(' — '),
      },
    );

    return assignment;
  }

  async notify(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        workplace: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    if (!assignment.user?.email) {
      throw new BadRequestException('У сотрудника не указан email');
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException('Назначение не активно');
    }

    await this.email.sendAssignmentNotification({
      email: assignment.user.email,
      fullName: assignment.user.fullName ?? null,
      workplaceCode: assignment.workplace.code,
      workplaceName: assignment.workplace.name ?? null,
      startsAt: assignment.startsAt,
      endsAt: assignment.endsAt ?? null,
    });

    // 🔔 SMS-уведомление сотруднику (если настроен шлюз и указан телефон)
    await this.smsService.sendAssignmentNotification(id);

    return { success: true } as const;
  }

  async findAll(params: ListAssignmentsDto, orgId?: string) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const where = this.buildWhere(params, orgId);

    const [items, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              org: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true,
              org: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          shifts: true,
        },
        orderBy: { startsAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Список назначений в корзине (deletedAt != null).
   * Это пригодится для экрана "Корзина" на фронте.
   */
  async findAllInTrash(params: ListAssignmentsDto, orgId?: string) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const where = this.buildTrashWhere(params, orgId);

    const [items, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              org: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true,
              org: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
          shifts: true,
        },
        orderBy: { deletedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            org: { select: { id: true, name: true, slug: true } },
          },
        },
        workplace: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
            org: { select: { id: true, name: true, slug: true } },
          },
        },
        shifts: true,
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    return assignment;
  }

  async update(id: string, payload: UpdateAssignmentDto) {
    const existing = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    const { shifts, ...rest } = payload as any;

    const effectiveUserId = rest.userId ?? existing.userId;
    const effectiveWorkplaceId = rest.workplaceId ?? existing.workplaceId;

    if (rest.userId && rest.userId !== existing.userId) {
      await this.ensureCanAssign(effectiveUserId, effectiveWorkplaceId);
    }

    if (rest.startsAt || rest.endsAt !== undefined) {
      const startsAt = rest.startsAt ?? existing.startsAt;
      const endsAt = rest.endsAt === undefined ? existing.endsAt : rest.endsAt;
      await this.ensureNoOverlap(effectiveUserId, startsAt, endsAt, id);
    }

    const assignment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: {
          userId: effectiveUserId,
          workplaceId: effectiveWorkplaceId,
          startsAt: rest.startsAt ?? existing.startsAt,
          endsAt: rest.endsAt === undefined ? existing.endsAt : rest.endsAt,
          status: rest.status ?? existing.status,
        },
      });

      if (Array.isArray(shifts)) {
        // Перезаписываем смены
        await tx.assignmentShift.deleteMany({
          where: { assignmentId: id },
        });

        if (shifts.length > 0) {
          await tx.assignmentShift.createMany({
            data: shifts.map((shift: any) => ({
              assignmentId: id,
              date: shift.date,
              startsAt: shift.startsAt,
              endsAt: shift.endsAt,
              kind:
                shift.kind && ShiftKind[shift.kind as keyof typeof ShiftKind]
                  ? shift.kind
                  : ShiftKind.DEFAULT,
            })),
          });
        }
      }

      return tx.assignment.findUnique({
        where: { id: updated.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              org: { select: { id: true, name: true, slug: true } },
            },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true,
              org: { select: { id: true, name: true, slug: true } },
            },
          },
          shifts: true,
        },
      });
    });

    const recipients = await this.resolveRecipients(
      assignment!.userId,
      existing.user.orgId!,
    );

    if (existing.user.orgId) {
      await this.automation.notifyWithCheck(
        existing.user.orgId,
        recipients,
        NotificationType.ASSIGNMENT_UPDATED,
        {
          assignmentId: assignment!.id,
          userId: assignment!.userId,
          workplaceId: assignment!.workplaceId,
        },
      );

      void this.audit.log(
        existing.user.orgId,
        assignment!.userId,
        'UPDATE',
        'Assignment',
        id,
        {
          employee:
            assignment!.user?.fullName?.trim() || assignment!.user?.email || '',
          workplace: [
            assignment!.workplace?.code,
            assignment!.workplace?.name,
          ]
            .filter(Boolean)
            .join(' — '),
        },
      );
    }

    return assignment;
  }

  async archive(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    if (assignment.status === AssignmentStatus.ARCHIVED) {
      throw new BadRequestException('Назначение уже в архиве');
    }

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.ARCHIVED,
      },
    });

    const workplace = await this.prisma.workplace.findUnique({
      where: { id: updated.workplaceId },
      select: { orgId: true },
    });

    const recipients = await this.resolveRecipients(
      updated.userId,
      workplace!.orgId,
    );

    await this.automation.notifyWithCheck(
      workplace!.orgId,
      recipients,
      NotificationType.ASSIGNMENT_CANCELLED,
      {
        assignmentId: updated.id,
        userId: updated.userId,
        workplaceId: updated.workplaceId,
      },
    );

    return updated;
  }

  /**
   * Завершение назначения:
   *  - только для ACTIVE
   *  - переводим в ARCHIVED
   *  - если endsAt пустой или в будущем — ставим сейчас
   */
  async complete(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        workplace: {
          select: { orgId: true },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    if (assignment.status !== AssignmentStatus.ACTIVE) {
      throw new BadRequestException('Назначение уже завершено');
    }

    const now = new Date();

    const finalEndsAt =
      assignment.endsAt && assignment.endsAt <= now ? assignment.endsAt : now;

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        status: AssignmentStatus.ARCHIVED,
        endsAt: finalEndsAt,
      },
    });

    const recipients = await this.resolveRecipients(
      updated.userId,
      assignment.workplace.orgId,
    );

    await this.automation.notifyWithCheck(
      assignment.workplace.orgId,
      recipients,
      NotificationType.ASSIGNMENT_CANCELLED,
      {
        assignmentId: updated.id,
        userId: updated.userId,
        workplaceId: updated.workplaceId,
      },
    );

    return updated;
  }

  /**
   * Мягкое удаление: перенос в корзину.
   *  - выставляем deletedAt = now (факт удаления)
   *  - статус в базе оставляем, но если вдруг был ACTIVE — переводим в ARCHIVED
   */
  async softDelete(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    const newStatus =
      assignment.status === AssignmentStatus.ACTIVE
        ? AssignmentStatus.ARCHIVED
        : assignment.status;

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: newStatus,
      },
    });

    const workplace = await this.prisma.workplace.findUnique({
      where: { id: updated.workplaceId },
      select: { orgId: true, code: true, name: true },
    });

    const deletedUser = await this.prisma.user.findUnique({
      where: { id: updated.userId },
      select: { fullName: true, email: true },
    });

    if (workplace?.orgId) {
      const recipients = await this.resolveRecipients(
        updated.userId,
        workplace.orgId,
      );

      await this.automation.notifyWithCheck(
        workplace.orgId,
        recipients,
        NotificationType.ASSIGNMENT_CANCELLED,
        {
          assignmentId: updated.id,
          userId: updated.userId,
          workplaceId: updated.workplaceId,
        },
      );

      void this.audit.log(
        workplace.orgId,
        updated.userId,
        'DELETE',
        'Assignment',
        id,
        {
          employee:
            deletedUser?.fullName?.trim() || deletedUser?.email || '',
          workplace: [workplace.code, workplace.name]
            .filter(Boolean)
            .join(' — '),
        },
      );
    }

    return updated;
  }

  /**
   * Восстановление из корзины:
   *  - deletedAt = null
   *  - статус не меняем (как был, так и остаётся, обычно ARCHIVED)
   */
  async restoreFromTrash(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment || !assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено в корзине');
    }

    const updated = await this.prisma.assignment.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });

    return updated;
  }

  // Текущее назначение пользователя (для /me/current-workplace и прочего)
  async getCurrentWorkplaceForUser(userId: string) {
    const now = new Date();

    return this.prisma.assignment.findFirst({
      where: {
        userId,
        status: AssignmentStatus.ACTIVE,
        deletedAt: null,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      include: {
        workplace: {
          select: { id: true, code: true, name: true, location: true },
        },
      },
      orderBy: { startsAt: 'desc' },
    });
  }

  async getHistoryForUser(userId: string, take = 10) {
    return this.prisma.assignment.findMany({
      where: { userId, deletedAt: null },
      include: {
        workplace: {
          select: { id: true, code: true, name: true, location: true },
        },
      },
      orderBy: { startsAt: 'desc' },
      take,
    });
  }

  /**
   * 📥 Экспорт назначений из корзины по списку id.
   * Возвращаем JSON, фронт сам делает таблицу/Excel/CSV.
   */
  async exportFromTrash(ids: string[]) {
    if (!ids.length) {
      return [];
    }

    const items = await this.prisma.assignment.findMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            position: true,
          },
        },
        workplace: {
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
          },
        },
        shifts: true,
      },
      orderBy: { startsAt: 'desc' },
    });

    return items;
  }

  /**
   * 🗑 Окончательное удаление назначений из корзины (hard delete).
   */
  async bulkDeleteFromTrash(ids: string[]) {
    if (!ids.length) {
      return { deletedCount: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const assignments = await tx.assignment.findMany({
        where: {
          id: { in: ids },
          deletedAt: { not: null },
        },
        select: { id: true },
      });

      if (!assignments.length) {
        return { deletedCount: 0 };
      }

      const assignmentIds = assignments.map((a) => a.id);

      // сначала удаляем все запросы на корректировку расписания
      await tx.assignmentAdjustment.deleteMany({
        where: {
          assignmentId: { in: assignmentIds },
        },
      });

      // затем удаляем смены, привязанные к этим назначениям
      await tx.assignmentShift.deleteMany({
        where: {
          assignmentId: { in: assignmentIds },
        },
      });

      // и только после этого удаляем сами назначения
      const result = await tx.assignment.deleteMany({
        where: {
          id: { in: assignmentIds },
          deletedAt: { not: null },
        },
      });

      return { deletedCount: result.count };
    });
  }

  /**
   * 📥 + 🗑 Экспорт + удаление:
   *  - достаём объекты
   *  - удаляем их из БД
   *  - возвращаем данные на фронт
   */
  async exportAndDeleteFromTrash(ids: string[]) {
    if (!ids.length) {
      return [];
    }

    return this.prisma.$transaction(async (tx) => {
      const items = await tx.assignment.findMany({
        where: {
          id: { in: ids },
          deletedAt: { not: null },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              position: true,
            },
          },
          workplace: {
            select: {
              id: true,
              code: true,
              name: true,
              location: true,
            },
          },
          shifts: true,
        },
        orderBy: { startsAt: 'desc' },
      });

      if (!items.length) {
        return [];
      }

      const assignmentIds = items.map((a) => a.id);

      // сначала удаляем все запросы на корректировку расписания
      await tx.assignmentAdjustment.deleteMany({
        where: {
          assignmentId: { in: assignmentIds },
        },
      });

      // затем удаляем смены, привязанные к этим назначениям
      await tx.assignmentShift.deleteMany({
        where: {
          assignmentId: { in: assignmentIds },
        },
      });

      // и только после этого удаляем сами назначения
      await tx.assignment.deleteMany({
        where: {
          id: { in: assignmentIds },
          deletedAt: { not: null },
        },
      });

      return items;
    });
  }

  /**
   * 📊 Статистика по сотрудникам:
   *  - все обычные сотрудники (USER, не system)
   *  - количество активных назначений (status = ACTIVE, deletedAt = null)
   *
   * orgId передаём, если хотим ограничить одной организацией.
   */
  async getUsersAssignmentsSummary(
    orgId?: string,
  ): Promise<UserAssignmentsSummary[]> {
    const userWhere: Prisma.UserWhereInput = {
      isSystemUser: false,
      role: UserRole.USER,
    };

    if (orgId) {
      userWhere.orgId = orgId;
    }

    const [users, grouped] = await Promise.all([
      this.prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          fullName: true,
          email: true,
        },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.assignment.groupBy({
        by: ['userId'],
        where: {
          deletedAt: null,
          status: AssignmentStatus.ACTIVE,
          ...(orgId
            ? {
                user: {
                  orgId,
                },
              }
            : {}),
        },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map<string, number>();
    for (const row of grouped) {
      countMap.set(row.userId, row._count._all);
    }

    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName ?? null,
      email: u.email,
      assignmentsCount: countMap.get(u.id) ?? 0,
    }));
  }

  // ============================================================
  //      🔔 ЗАПРОСЫ НА КОРРЕКТИРОВКУ РАСПИСАНИЯ
  // ============================================================

  /**
   * Нормализуем дату: поддерживаем как ISO, так и просто YYYY-MM-DD.
   * Для "YYYY-MM-DD" считаем, что это локальная дата в UTC+6,
   * и сохраняем такую же схему, как делает фронт через toISOString().
   */
  private parseDateOnly(dateStr: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map((v) => Number(v));
      if (!y || !m || !d) {
        throw new BadRequestException('Некорректная дата корректировки');
      }
      const offsetMs = this.LOCAL_TZ_OFFSET_MINUTES * 60 * 1000;
      const utcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - offsetMs;
      return new Date(utcMs);
    }

    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException('Некорректная дата корректировки');
    }
    return d;
  }

  /**
   * Склеиваем локальную дату (YYYY-MM-DD) и локальное время HH:mm
   * в UTC-время по той же логике, что и фронт (UTC+6).
   */
  private buildUtcFromLocalDateAndTime(dateIso: string, timeStr: string): Date {
    const [y, m, d] = dateIso.split('-').map((v) => Number(v));
    const [hh, mm] = timeStr.split(':').map((v) => Number(v));

    if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) {
      throw new BadRequestException('Некорректная дата/время корректировки');
    }

    const offsetMs = this.LOCAL_TZ_OFFSET_MINUTES * 60 * 1000;
    const utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - offsetMs;
    return new Date(utcMs);
  }

  /**
   * Парсим блок "Интервалы, которые сотрудник предлагает:"
   * из комментария и превращаем в массив смен.
   *
   * Пример строки:
   * 21.11.2025: 04:00 → 09:00 (Day off / больничный)
   */
  private parseRequestedScheduleFromComment(
    comment?: string | null,
  ): ParsedRequestedShift[] {
    if (!comment) return [];

    const marker = 'Интервалы, которые сотрудник предлагает:';
    const idx = comment.indexOf(marker);
    if (idx === -1) return [];

    const lines = comment
      .slice(idx + marker.length)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const re =
      /^(\d{2}\.\d{2}\.\d{4}):\s+(\d{2}:\d{2})\s*→\s*(\d{2}:\d{2})(?:\s*\((.+)\))?$/;

    const detectKind = (label?: string | null): ShiftKind => {
      if (!label) return ShiftKind.DEFAULT;
      const lower = label.toLowerCase();
      if (lower.includes('офис')) return ShiftKind.OFFICE;
      if (lower.includes('удал')) return ShiftKind.REMOTE;
      if (lower.includes('day off') || lower.includes('больнич'))
        return ShiftKind.DAY_OFF;
      return ShiftKind.DEFAULT;
    };

    const result: ParsedRequestedShift[] = [];

    for (const line of lines) {
      const match = line.match(re);
      if (!match) continue;

      const [, dateStr, startStr, endStr, kindLabel] = match;

      const [day, month, year] = dateStr.split('.').map((v) => Number(v));
      if (!day || !month || !year) continue;

      const [sh, sm] = startStr.split(':').map((v) => Number(v));
      const [eh, em] = endStr.split(':').map((v) => Number(v));
      if (
        Number.isNaN(sh) ||
        Number.isNaN(sm) ||
        Number.isNaN(eh) ||
        Number.isNaN(em)
      ) {
        continue;
      }

      // ISO-дата в формате YYYY-MM-DD, трактуем как локальную (UTC+6)
      const yyyy = String(year).padStart(4, '0');
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateIso = `${yyyy}-${mm}-${dd}`;

      const date = this.parseDateOnly(dateIso);
      const startsAt = this.buildUtcFromLocalDateAndTime(dateIso, startStr);
      const endsAt = this.buildUtcFromLocalDateAndTime(dateIso, endStr);

      const kind = detectKind(kindLabel);

      result.push({
        date,
        startsAt,
        endsAt,
        kind,
      });
    }

    return result;
  }

  /**
   * 📝 Пользователь подаёт запрос на корректировку по назначению.
   */
  async requestScheduleAdjustment(
    assignmentId: string,
    payload: RequestScheduleAdjustmentPayload,
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        user: {
          select: { id: true, orgId: true },
        },
        workplace: {
          select: { id: true, orgId: true, code: true, name: true },
        },
      },
    });

    if (!assignment || assignment.deletedAt) {
      throw new NotFoundException('Назначение не найдено');
    }

    if (!assignment.user) {
      throw new BadRequestException('У назначения не найден сотрудник');
    }

    const date = this.parseDateOnly(payload.date);
    const startsAt = payload.startsAt ? new Date(payload.startsAt) : null;
    const endsAt = payload.endsAt ? new Date(payload.endsAt) : null;

    const kind: ShiftKind = (payload.kind as ShiftKind) ?? ShiftKind.DAY_OFF;

    const adjustment = await this.prisma.assignmentAdjustment.create({
      data: {
        assignmentId: assignment.id,
        userId: assignment.userId,
        date,
        startsAt,
        endsAt,
        kind,
        comment: payload.comment.trim(),
        status: 'PENDING',
      } as any,
    });

    // Уведомляем участника + админов организации,
    // чтобы у менеджера/супера в колокольчике появился запрос.
    const orgId = assignment.workplace?.orgId ?? assignment.user.orgId ?? null;

    if (orgId) {
      const recipients = await this.resolveRecipients(assignment.userId, orgId);

      await this.automation.notifyWithCheck(
        orgId,
        recipients,
        NotificationType.ASSIGNMENT_UPDATED,
        {
          assignmentId: assignment.id,
          userId: assignment.userId,
          workplaceId: assignment.workplaceId,
          adjustmentId: adjustment.id,
          adjustmentType: 'REQUESTED',
        },
      );
    }

    return adjustment;
  }

  /**
   * 📋 Список запросов корректировок для менеджера/админа.
   */
  async listScheduleAdjustments(params: ListScheduleAdjustmentsParams) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.userId) {
      where.userId = params.userId;
    }
    if (params.assignmentId) {
      where.assignmentId = params.assignmentId;
    }

    const [items, total] = await Promise.all([
      this.prisma.assignmentAdjustment.findMany({
        where,
        include: {
          assignment: {
            include: {
              workplace: {
                select: { id: true, code: true, name: true },
              },
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }) as any,
      this.prisma.assignmentAdjustment.count({ where }) as any,
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * ✅ / ❌ Решение по запросу корректировки.
   *
   *  - меняем статус PENDING → APPROVED / REJECTED
   *  - сохраняем комментарий менеджера
   *  - при APPROVED:
   *      * если в комментарии есть блок "Интервалы, которые сотрудник предлагает:",
   *        ПОЛНОСТЬЮ пересобираем смены по всему назначению под этот график
   *      * иначе старое поведение: меняем kind/время только для указанной даты
   *  - шлём нотификации
   */
  async decideScheduleAdjustment(
    adjustmentId: string,
    decision: AdjustmentStatus,
    payload: ScheduleAdjustmentDecisionPayload,
  ) {
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      throw new BadRequestException('Некорректный статус решения');
    }

    const { updatedAdjustment, assignmentForNotify } =
      await this.prisma.$transaction(async (tx) => {
        const adjustment = await tx.assignmentAdjustment.findUnique({
          where: { id: adjustmentId },
          include: {
            assignment: {
              include: {
                workplace: {
                  select: { id: true, orgId: true, code: true, name: true },
                },
                user: { select: { id: true, orgId: true } },
              },
            },
            user: {
              select: { id: true, email: true, fullName: true },
            },
          },
        });

        if (!adjustment) {
          throw new NotFoundException('Запрос корректировки не найден');
        }

        if (adjustment.status !== 'PENDING') {
          throw new BadRequestException('По этому запросу уже принято решение');
        }

        // 1) обновляем сам запрос
        const updated = await tx.assignmentAdjustment.update({
          where: { id: adjustmentId },
          data: {
            status: decision,
            managerComment: payload.managerComment ?? null,
          } as any,
        });

        // 2) если APPROVED — применяем к сменам назначения
        if (decision === 'APPROVED') {
          const requestedShifts = this.parseRequestedScheduleFromComment(
            adjustment.comment,
          );

          if (requestedShifts.length > 0) {
            // Новый режим: полностью пересобираем смены для назначения
            const assignmentId = adjustment.assignmentId;

            // Удаляем все старые смены
            await tx.assignmentShift.deleteMany({
              where: { assignmentId },
            });

            // Создаём новые смены
            await tx.assignmentShift.createMany({
              data: requestedShifts.map((s) => ({
                assignmentId,
                date: s.date,
                startsAt: s.startsAt,
                endsAt: s.endsAt,
                kind: s.kind,
              })),
            });

            // Обновляем глобальный интервал назначения по min/max времени
            const minStart = requestedShifts.reduce(
              (min, s) => (s.startsAt < min ? s.startsAt : min),
              requestedShifts[0].startsAt,
            );
            const maxEnd = requestedShifts.reduce(
              (max, s) => (s.endsAt > max ? s.endsAt : max),
              requestedShifts[0].endsAt,
            );

            await tx.assignment.update({
              where: { id: assignmentId },
              data: {
                startsAt: minStart,
                endsAt: maxEnd,
              },
            });
          } else {
            // Старый fallback: меняем только вид/время смен на указанную дату
            const updateData: Prisma.AssignmentShiftUpdateManyMutationInput = {
              kind: adjustment.kind ?? ShiftKind.DAY_OFF,
            };

            if (adjustment.startsAt) {
              updateData.startsAt = adjustment.startsAt;
            }
            if (adjustment.endsAt) {
              updateData.endsAt = adjustment.endsAt;
            }

            await tx.assignmentShift.updateMany({
              where: {
                assignmentId: adjustment.assignmentId,
                date: adjustment.date,
              },
              data: updateData,
            });
          }
        }

        return {
          updatedAdjustment: updated,
          assignmentForNotify: adjustment.assignment,
        };
      });

    const assignment = assignmentForNotify;
    const orgId =
      assignment?.workplace?.orgId ?? assignment?.user?.orgId ?? null;

    if (orgId && assignment) {
      const recipients = await this.resolveRecipients(assignment.userId, orgId);

      await this.automation.notifyWithCheck(
        orgId,
        recipients,
        NotificationType.ASSIGNMENT_UPDATED,
        {
          assignmentId: assignment.id,
          userId: assignment.userId,
          workplaceId: assignment.workplaceId,
          adjustmentId: updatedAdjustment.id,
          adjustmentType: decision === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        },
      );
    }

    return updatedAdjustment;
  }
  // ================================================================
  //        📨 БЛОК ЗАПРОСОВ НА НОВОЕ НАЗНАЧЕНИЕ (AssignmentRequest)
  // ================================================================

  private parseAssignmentRequestSlots(slots: unknown): ParsedRequestedShift[] {
    const parsed: ParsedRequestedShift[] = [];

    if (!slots) return parsed;

    const asArray = Array.isArray(slots) ? slots : null;

    // Вариант 1: массив { date, from, to, shiftKind/kind }
    if (asArray) {
      for (const item of asArray as any[]) {
        if (!item) continue;

        const dateRaw = item.date ?? item.day ?? item.dateStr;
        const dateIso =
          typeof dateRaw === 'string'
            ? dateRaw
            : (dateRaw?.format?.('YYYY-MM-DD') ?? null);

        // item может быть Dayjs/Date
        const dateIsoFinal =
          dateIso ||
          (dateRaw instanceof Date ? dateRaw.toISOString().slice(0, 10) : null);

        // интервалы внутри item.intervals
        const intervals = Array.isArray(item.intervals) ? item.intervals : null;

        if (dateIsoFinal && intervals) {
          for (const iv of intervals) {
            if (!iv) continue;
            const fromStr =
              typeof iv.from === 'string'
                ? iv.from
                : iv.from?.format?.('HH:mm');
            const toStr =
              typeof iv.to === 'string' ? iv.to : iv.to?.format?.('HH:mm');

            const kindRaw =
              iv.shiftKind ?? iv.kind ?? item.shiftKind ?? item.kind;
            const kind = this.safeShiftKind(kindRaw);

            const built = this.buildShift(dateIsoFinal, fromStr, toStr, kind);
            if (built) parsed.push(built);
          }
          continue;
        }

        const fromStr =
          typeof item.from === 'string'
            ? item.from
            : item.from?.format?.('HH:mm');
        const toStr =
          typeof item.to === 'string' ? item.to : item.to?.format?.('HH:mm');
        const kindRaw = item.shiftKind ?? item.kind;
        const kind = this.safeShiftKind(kindRaw);

        if (dateIsoFinal && (fromStr || kind === ShiftKind.DAY_OFF)) {
          const built = this.buildShift(dateIsoFinal, fromStr, toStr, kind);
          if (built) parsed.push(built);
        }
      }
    }

    return parsed;
  }

  private safeShiftKind(kindRaw: unknown): ShiftKind {
    const k = String(kindRaw ?? '').toUpperCase();
    if (k === 'DEFAULT') return ShiftKind.DEFAULT;
    if (k === 'OFFICE') return ShiftKind.OFFICE;
    if (k === 'REMOTE') return ShiftKind.REMOTE;
    if (k === 'DAY_OFF') return ShiftKind.DAY_OFF;
    return ShiftKind.DEFAULT;
  }

  private buildShift(
    dateIso: string,
    fromStr: string | undefined,
    toStr: string | undefined,
    kind: ShiftKind,
  ): ParsedRequestedShift | null {
    const date = this.parseDateOnly(dateIso);

    // DAY_OFF — считаем как "весь день"
    if (kind === ShiftKind.DAY_OFF) {
      const startsAt = this.buildUtcFromLocalDateAndTime(dateIso, '00:00');
      const endsAt = this.buildUtcFromLocalDateAndTime(dateIso, '23:59');
      return { date, startsAt, endsAt, kind };
    }

    if (!fromStr || !toStr) return null;

    const startsAt = this.buildUtcFromLocalDateAndTime(dateIso, fromStr);
    const endsAt = this.buildUtcFromLocalDateAndTime(dateIso, toStr);

    // защита от перевёрнутых интервалов
    if (endsAt <= startsAt) return null;

    return { date, startsAt, endsAt, kind };
  }

  private async resolveOrgIdForUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { orgId: true },
    });

    if (!user?.orgId) {
      throw new BadRequestException('У пользователя не задана организация');
    }

    return user.orgId;
  }

  /**
   * 📝 Пользователь создаёт запрос на назначение (из MyPlace).
   * orgId можно передать из токена, но если его нет — берём из пользователя.
   */
  async createAssignmentRequest(
    requesterId: string,
    payload: CreateAssignmentRequestPayload,
    orgIdFromToken?: string,
  ) {
    const orgId =
      orgIdFromToken ?? (await this.resolveOrgIdForUser(requesterId));

    const dateFrom =
      payload.dateFrom instanceof Date
        ? payload.dateFrom
        : new Date(payload.dateFrom);
    const dateTo =
      payload.dateTo instanceof Date
        ? payload.dateTo
        : new Date(payload.dateTo);

    if (Number.isNaN(dateFrom.getTime()) || Number.isNaN(dateTo.getTime())) {
      throw new BadRequestException('Некорректные dateFrom/dateTo');
    }

    if (dateTo < dateFrom) {
      throw new BadRequestException('dateTo не может быть меньше dateFrom');
    }

    const workplaceId = payload.workplaceId ?? null;

    if (workplaceId) {
      const wp = await this.prisma.workplace.findUnique({
        where: { id: workplaceId },
        select: { id: true, orgId: true, isActive: true },
      });

      if (!wp) throw new NotFoundException('Workplace not found');
      if (wp.orgId !== orgId) {
        throw new BadRequestException(
          'Workplace не принадлежит организации пользователя',
        );
      }
      if (!wp.isActive) {
        throw new BadRequestException('Workplace не активен');
      }
    }

    return this.prisma.assignmentRequest.create({
      data: {
        orgId,
        requesterId,
        workplaceId,
        dateFrom,
        dateTo,
        // Json обязателен — даже если фронт пока присылает только comment
        slots: (payload.slots ?? []) as Prisma.InputJsonValue,
        comment: payload.comment ?? null,
        status: AssignmentRequestStatus.PENDING,
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true, position: true },
        },
        workplace: { select: { id: true, code: true, name: true } },
        decidedBy: { select: { id: true, fullName: true, email: true } },
        assignment: { select: { id: true, startsAt: true, endsAt: true } },
      },
    });
  }

  /**
   * 📋 Список запросов на назначение (для админа/менеджера).
   */
  async listAssignmentRequests(
    params: ListAssignmentRequestsParams,
    orgIdFromToken?: string,
    currentUserId?: string,
  ) {
    const orgId =
      orgIdFromToken ??
      (currentUserId ? await this.resolveOrgIdForUser(currentUserId) : null);

    if (!orgId) {
      throw new BadRequestException(
        'orgId не найден (нет orgId в токене и нет currentUserId)',
      );
    }

    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.AssignmentRequestWhereInput = {
      orgId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.requesterId ? { requesterId: params.requesterId } : {}),
      ...(params.workplaceId ? { workplaceId: params.workplaceId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.assignmentRequest.findMany({
        where,
        include: {
          requester: {
            select: { id: true, fullName: true, email: true, position: true },
          },
          workplace: { select: { id: true, code: true, name: true } },
          decidedBy: { select: { id: true, fullName: true, email: true } },
          assignment: { select: { id: true, startsAt: true, endsAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.assignmentRequest.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, pageSize },
    };
  }

  /**
   * ✅/❌ Решение по запросу на назначение.
   * Если APPROVED — создаём назначение и привязываем его к запросу.
   */
  async decideAssignmentRequest(
    requestId: string,
    decision: ApproveOrReject,
    payload: AssignmentRequestDecisionPayload,
    decidedById?: string,
  ) {
    const req = await this.prisma.assignmentRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: { select: { id: true, orgId: true, fullName: true } },
      },
    });

    if (!req) throw new NotFoundException('AssignmentRequest not found');

    if (req.status !== AssignmentRequestStatus.PENDING) {
      throw new BadRequestException('Запрос уже обработан');
    }

    if (decision === 'REJECTED') {
      return this.prisma.assignmentRequest.update({
        where: { id: requestId },
        data: {
          status: AssignmentRequestStatus.REJECTED,
          decidedById: decidedById ?? null,
          decidedAt: new Date(),
          decisionComment: payload.decisionComment ?? null,
        },
        include: {
          requester: {
            select: { id: true, fullName: true, email: true, position: true },
          },
          workplace: { select: { id: true, code: true, name: true } },
          decidedBy: { select: { id: true, fullName: true, email: true } },
          assignment: { select: { id: true, startsAt: true, endsAt: true } },
        },
      });
    }

    // APPROVED
    if (!req.workplaceId) {
      throw new BadRequestException(
        'Нельзя одобрить запрос без выбранного workplaceId',
      );
    }

    // 1) пробуем разобрать slots (если фронт прислал structured)
    let requestedShifts = this.parseAssignmentRequestSlots(req.slots);

    // 2) если slots пустые — парсим из comment (как сейчас делает MyPlace)
    if (requestedShifts.length === 0 && req.comment) {
      requestedShifts = this.parseRequestedScheduleFromComment(req.comment);
    }

    if (requestedShifts.length === 0) {
      throw new BadRequestException(
        'Не удалось получить интервалы из запроса (slots/comment пустые)',
      );
    }

    // создаём назначение через существующий create (там уже есть проверки + нотификации)
    const createdAssignment = await this.create({
      userId: req.requesterId,
      workplaceId: req.workplaceId,
      startsAt: req.dateFrom,
      endsAt: req.dateTo,
      shifts: requestedShifts.map((s) => ({
        date: s.date,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        kind: s.kind,
      })),
    } as any);

    if (!createdAssignment) {
      throw new BadRequestException('Не удалось создать назначение по запросу');
    }

    return this.prisma.assignmentRequest.update({
      where: { id: requestId },
      data: {
        status: AssignmentRequestStatus.APPROVED,
        decidedById: decidedById ?? null,
        decidedAt: new Date(),
        decisionComment: payload.decisionComment ?? null,
        assignmentId: createdAssignment.id,
      },
      include: {
        requester: {
          select: { id: true, fullName: true, email: true, position: true },
        },
        workplace: { select: { id: true, code: true, name: true } },
        decidedBy: { select: { id: true, fullName: true, email: true } },
        assignment: { select: { id: true, startsAt: true, endsAt: true } },
      },
    });
  }
}

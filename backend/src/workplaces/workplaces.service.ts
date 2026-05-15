import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateWorkplaceDto } from './dto/create-workplace.dto.js';
import { UpdateWorkplaceDto } from './dto/update-workplace.dto.js';
import { ListWorkplacesDto } from './dto/list-workplaces.dto.js';

@Injectable()
export class WorkplacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private buildWhere(
    { search, isActive }: ListWorkplacesDto,
    orgId?: string,
  ): Prisma.WorkplaceWhereInput {
    const where: Prisma.WorkplaceWhereInput = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return where;
  }

  private handleUniqueError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException({
        code: 'WORKPLACE_CODE_NOT_UNIQUE',
        message: 'Workplace code must be unique within the organization',
      });
    }

    if (error instanceof Prisma.NotFoundError) {
      throw new NotFoundException('Organization not found');
    }

    throw error;
  }

  async create(data: CreateWorkplaceDto, actorId?: string) {
    try {
      await this.prisma.org.findUniqueOrThrow({ where: { id: data.orgId } });
      const workplace = await this.prisma.workplace.create({
        data,
        include: { org: { select: { id: true, name: true, slug: true } } },
      });
      if (actorId) {
        void this.audit.log(
          data.orgId,
          actorId,
          'CREATE',
          'Workplace',
          workplace.id,
          { name: workplace.name, code: workplace.code },
        );
      }
      return workplace;
    } catch (error) {
      this.handleUniqueError(error);
    }
  }

  async findAll(params: ListWorkplacesDto, orgId?: string) {
    const { page, pageSize } = params;
    const where = this.buildWhere(params, orgId);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.workplace.findMany({
        where,
        include: { org: { select: { id: true, name: true, slug: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.workplace.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        pageSize,
      },
    };
  }

  async findOne(id: string) {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id },
      include: { org: { select: { id: true, name: true, slug: true } } },
    });

    if (!workplace) {
      throw new NotFoundException('Workplace not found');
    }

    return workplace;
  }

  async update(id: string, data: UpdateWorkplaceDto, actorId?: string) {
    const existing = await this.findOne(id);

    try {
      if (data.orgId) {
        await this.prisma.org.findUniqueOrThrow({ where: { id: data.orgId } });
      }
      const updated = await this.prisma.workplace.update({
        where: { id },
        data,
        include: { org: { select: { id: true, name: true, slug: true } } },
      });
      if (actorId && existing.orgId) {
        void this.audit.log(existing.orgId, actorId, 'UPDATE', 'Workplace', id, {
          name: updated.name,
          code: updated.code,
        });
      }
      return updated;
    } catch (error) {
      this.handleUniqueError(error);
    }
  }

  async remove(id: string, actorId?: string) {
    const workplace = await this.prisma.workplace.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, orgId: true },
    });

    if (!workplace) {
      throw new NotFoundException('Workplace not found');
    }

    // 1) Считаем ТОЛЬКО активные назначения
    const activeAssignments = await this.prisma.assignment.count({
      where: {
        workplaceId: id,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Нельзя удалить рабочее место, пока к нему привязаны активные назначения. ' +
          'Сначала завершите или переназначьте сотрудников.',
      );
    }

    // 2) Удаляем все назначения по рабочему месту и само рабочее место в одной транзакции
    await this.prisma.$transaction(async (tx) => {
      const assignments = await tx.assignment.findMany({
        where: {
          workplaceId: id,
        },
        select: {
          id: true,
        },
      });

      const assignmentIds = assignments.map((a) => a.id);

      if (assignmentIds.length) {
        // сначала удаляем все запросы на корректировку расписания по этим назначениям
        await tx.assignmentAdjustment.deleteMany({
          where: {
            assignmentId: {
              in: assignmentIds,
            },
          },
        });

        // затем удаляем смены, привязанные к этим назначениям
        await tx.assignmentShift.deleteMany({
          where: {
            assignmentId: {
              in: assignmentIds,
            },
          },
        });

        // и только после этого удаляем сами назначения
        await tx.assignment.deleteMany({
          where: {
            id: {
              in: assignmentIds,
            },
          },
        });
      }

      // после очистки зависимостей удаляем рабочее место
      await tx.workplace.delete({
        where: { id },
      });
    });

    if (actorId && workplace.orgId) {
      void this.audit.log(workplace.orgId, actorId, 'DELETE', 'Workplace', id, {
        name: workplace.name,
        code: workplace.code,
      });
    }

    return { success: true };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    orgId: string,
    userId: string,
    action: string,
    entity: string,
    entityId?: string | null,
    details?: Record<string, unknown> | null,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          orgId,
          userId,
          action,
          entity,
          entityId: entityId ?? null,
          details: details ? (details as any) : undefined,
        },
      });
    } catch (e) {
      this.logger.warn(`Audit log failed: ${String(e)}`);
    }
  }

  async findAll(orgId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: { orgId },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where: { orgId } }),
    ]);

    return { items, total, page, pageSize };
  }
}

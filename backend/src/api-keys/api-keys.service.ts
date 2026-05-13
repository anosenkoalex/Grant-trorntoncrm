import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  async create(name: string, orgId: string | null, createdById: string) {
    const key = randomBytes(32).toString('hex');
    const keyHash = this.hash(key);

    const record = await this.prisma.apiKey.create({
      data: { name, keyHash, orgId, createdById },
      include: { org: { select: { id: true, name: true } } },
    });

    // Plaintext key возвращается только один раз при создании
    return { id: record.id, name: record.name, orgId: record.orgId, org: record.org, createdAt: record.createdAt, key };
  }

  async findAll(orgId?: string | null) {
    return this.prisma.apiKey.findMany({
      where: orgId !== undefined ? { orgId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        orgId: true,
        lastUsedAt: true,
        createdAt: true,
        org: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.delete({ where: { id } });
    return { success: true };
  }

  async validateKey(key: string): Promise<{ id: string; orgId: string | null; name: string } | null> {
    const keyHash = this.hash(key);
    const record = await this.prisma.apiKey.findUnique({ where: { keyHash } });
    if (!record) return null;

    // Обновляем время последнего использования в фоне
    void this.prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return { id: record.id, orgId: record.orgId, name: record.name };
  }
}

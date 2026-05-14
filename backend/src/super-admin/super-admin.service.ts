import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrgs() {
    const orgs = await this.prisma.org.findMany({
      include: {
        subscription: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      userCount: org._count.users,
      subscription: org.subscription
        ? {
            plan: org.subscription.plan,
            status: org.subscription.status,
            currentPeriodEnd: org.subscription.currentPeriodEnd,
          }
        : null,
    }));
  }

  async getStats() {
    const [orgCount, userCount, activeCount] = await Promise.all([
      this.prisma.org.count(),
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { orgCount, userCount, activeSubscriptions: activeCount };
  }
}

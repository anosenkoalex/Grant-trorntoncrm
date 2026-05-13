import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ApiKeysService } from './api-keys.service.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { PrismaService } from '../common/prisma/prisma.service.js';

@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Body() body: { name: string }, @Req() req: any) {
    const userId: string | undefined = req.user?.sub ?? req.user?.id;
    const orgId: string | null = req.user?.orgId ?? null;
    if (!userId) throw new UnauthorizedException();
    return this.apiKeysService.create(body.name?.trim() || 'Unnamed key', orgId, userId);
  }

  @Get()
  findAll(@Req() req: any) {
    const isAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    return this.apiKeysService.findAll(isAdmin ? undefined : (req.user?.orgId ?? null));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.apiKeysService.delete(id);
  }
}

// ── Публичный API (Bearer API-key аутентификация) ──────────────────────────

@Controller('public')
@UseGuards(ApiKeyGuard)
export class PublicApiController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('assignments')
  getAssignments(@Req() req: any) {
    const orgId: string | null = req.apiKey?.orgId ?? null;
    return this.prisma.assignment.findMany({
      where: {
        deletedAt: null,
        ...(orgId ? { user: { orgId } } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        workplace: { select: { id: true, code: true, name: true } },
      },
      orderBy: { startsAt: 'desc' },
      take: 200,
    });
  }

  @Get('users')
  getUsers(@Req() req: any) {
    const orgId: string | null = req.apiKey?.orgId ?? null;
    return this.prisma.user.findMany({
      where: orgId ? { orgId } : undefined,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        position: true,
        isSystemUser: true,
        createdAt: true,
      },
      take: 200,
    });
  }
}

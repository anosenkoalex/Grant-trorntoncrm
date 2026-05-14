/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole, VacationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { HrService, CreateVacationDto } from './hr.service.js';

@Controller('hr')
@UseGuards(JwtAuthGuard)
export class HrController {
  constructor(private readonly hrService: HrService) {}

  private userId(req: any): string {
    return req.user?.sub ?? req.user?.id;
  }

  private orgId(req: any): string {
    const id: string | undefined = req.user?.orgId;
    if (!id) throw new ForbiddenException('User must belong to an organization');
    return id;
  }

  // ── Мои заявки ──────────────────────────────────────────────

  @Get('vacations/my')
  findMine(@Req() req: any) {
    return this.hrService.findMine(this.userId(req));
  }

  // ── Список для менеджера / админа ────────────────────────────

  @Get('vacations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(
    @Query('status') status: VacationStatus | undefined,
    @Query('userId') userId: string | undefined,
    @Query('page') page: string | undefined,
    @Query('pageSize') pageSize: string | undefined,
    @Query('dateFrom') dateFrom: string | undefined,
    @Query('dateTo') dateTo: string | undefined,
    @Req() req: any,
  ) {
    return this.hrService.findAll(this.orgId(req), {
      status,
      userId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
      dateFrom,
      dateTo,
    });
  }

  // ── Создать заявку (любой аутентифицированный пользователь) ──

  @Post('vacations')
  create(@Body() dto: CreateVacationDto, @Req() req: any) {
    return this.hrService.create(this.userId(req), this.orgId(req), dto);
  }

  // ── Одобрить ─────────────────────────────────────────────────

  @Patch('vacations/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  approve(@Param('id') id: string, @Req() req: any) {
    return this.hrService.approve(id, this.userId(req));
  }

  // ── Отклонить ────────────────────────────────────────────────

  @Patch('vacations/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { comment?: string },
  ) {
    return this.hrService.reject(id, this.userId(req), body.comment);
  }
}

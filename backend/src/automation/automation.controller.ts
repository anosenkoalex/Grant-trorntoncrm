import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AutomationService, UpdateAutomationSettingsDto } from './automation.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';

@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  private checkManagerAccess(user: JwtPayload) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  /** GET /automation/settings */
  @Get('settings')
  async getSettings(@CurrentUser() user: JwtPayload) {
    this.checkManagerAccess(user);
    if (!user.orgId) return null;
    return this.automationService.getSettings(user.orgId);
  }

  /** PUT /automation/settings */
  @Put('settings')
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAutomationSettingsDto,
  ) {
    this.checkManagerAccess(user);
    if (!user.orgId) return null;
    return this.automationService.updateSettings(user.orgId, dto);
  }

  /** GET /automation/notification-log */
  @Get('notification-log')
  async getNotificationLog(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    this.checkManagerAccess(user);
    if (!user.orgId) return { items: [], total: 0, page: 1, pageSize: 50 };
    return this.automationService.getNotificationLog(user.orgId, {
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 50,
    });
  }
}

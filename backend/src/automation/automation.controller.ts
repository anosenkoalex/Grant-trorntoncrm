import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Put,
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

  /** GET /automation/settings — настройки автоматизации для организации */
  @Get('settings')
  async getSettings(@CurrentUser() user: JwtPayload) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Недостаточно прав');
    }
    if (!user.orgId) return null;
    return this.automationService.getSettings(user.orgId);
  }

  /** PUT /automation/settings — обновить настройки автоматизации */
  @Put('settings')
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAutomationSettingsDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Недостаточно прав');
    }
    if (!user.orgId) return null;
    return this.automationService.updateSettings(user.orgId, dto);
  }
}

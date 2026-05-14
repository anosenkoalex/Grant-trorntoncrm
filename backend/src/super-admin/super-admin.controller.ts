import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SuperAdminService } from './super-admin.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(
    private readonly service: SuperAdminService,
    private readonly config: ConfigService,
  ) {}

  private checkAccess(user: JwtPayload) {
    const platformEmail = this.config.get<string>('PLATFORM_ADMIN_EMAIL');
    if (!platformEmail || user.email !== platformEmail) {
      throw new ForbiddenException('Platform admin only');
    }
  }

  @Get('orgs')
  async getOrgs(@CurrentUser() user: JwtPayload) {
    this.checkAccess(user);
    return this.service.getOrgs();
  }

  @Get('stats')
  async getStats(@CurrentUser() user: JwtPayload) {
    this.checkAccess(user);
    return this.service.getStats();
  }
}

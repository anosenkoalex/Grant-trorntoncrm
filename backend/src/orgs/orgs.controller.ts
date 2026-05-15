import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrgsService } from './orgs.service.js';
import { CreateOrgDto, createOrgSchema } from './dto/create-org.dto.js';
import { UpdateOrgDto, updateOrgSchema } from './dto/update-org.dto.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';
import { UserRole } from '@prisma/client';

@Controller('orgs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) {}

  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getMyOrg(@CurrentUser() user: JwtPayload) {
    if (!user.orgId) throw new ForbiddenException('No org');
    return this.orgsService.getMyOrg(user.orgId);
  }

  @Patch('branding')
  @Roles(UserRole.SUPER_ADMIN)
  updateBranding(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      logoUrl?: string | null;
      primaryColor?: string | null;
      companyDisplayName?: string | null;
    },
  ) {
    if (!user.orgId) throw new ForbiddenException('No org');
    return this.orgsService.updateBranding(user.orgId, body);
  }

  @Patch('onboarding-complete')
  @Roles(UserRole.SUPER_ADMIN)
  completeOnboarding(@CurrentUser() user: JwtPayload) {
    if (!user.orgId) throw new ForbiddenException('No org');
    return this.orgsService.completeOnboarding(user.orgId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body(new ZodValidationPipe(createOrgSchema)) payload: CreateOrgDto) {
    return this.orgsService.create(payload);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll() {
    return this.orgsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.orgsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOrgSchema)) payload: UpdateOrgDto,
  ) {
    return this.orgsService.update(id, payload);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.orgsService.remove(id);
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService, InitiateRegistrationDto } from './billing.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';
import { SubscriptionPlan } from '@prisma/client';

class RegisterDto {
  companyName!: string;
  adminEmail!: string;
  password!: string;
  plan!: SubscriptionPlan;
}

class PortalDto {
  returnUrl!: string;
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.billing.initiateRegistration(dto as InitiateRegistrationDto);
  }

  @Post('webhook')
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) throw new Error('No raw body');
    return this.billing.handleWebhook(rawBody, sig);
  }

  @Get('info')
  @UseGuards(JwtAuthGuard)
  async info(@CurrentUser() user: JwtPayload) {
    if (!user.orgId) return { subscription: null, invoices: [] };
    return this.billing.getBillingInfo(user.orgId);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async portal(@CurrentUser() user: JwtPayload, @Body() dto: PortalDto) {
    if (!user.orgId) throw new Error('No org');
    return this.billing.createPortalSession(user.orgId, dto.returnUrl);
  }
}

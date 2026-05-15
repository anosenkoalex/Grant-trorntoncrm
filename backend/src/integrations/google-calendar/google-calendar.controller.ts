import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { GoogleCalendarService } from './google-calendar.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../../auth/jwt-payload.interface.js';

@Controller('integrations/google')
export class GoogleCalendarController {
  constructor(private readonly service: GoogleCalendarService) {}

  @Get('auth-url')
  @UseGuards(JwtAuthGuard)
  getAuthUrl(@CurrentUser() user: JwtPayload) {
    return { url: this.service.getAuthUrl(user.sub) };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const redirectUrl = await this.service.handleCallback(code, state);
      res.redirect(redirectUrl);
    } catch {
      const appUrl = process.env['APP_URL'] ?? 'http://localhost:5173';
      res.redirect(`${appUrl}/my-place?gc=error`);
    }
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: JwtPayload) {
    return this.service.getStatus(user.sub);
  }

  @Delete('disconnect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@CurrentUser() user: JwtPayload) {
    await this.service.disconnect(user.sub);
    return { success: true };
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  sync(@CurrentUser() user: JwtPayload) {
    return this.service.syncAssignments(user.sub);
  }
}

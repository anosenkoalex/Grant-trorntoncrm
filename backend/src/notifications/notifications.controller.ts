import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/jwt-payload.interface.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** GET /notifications — список уведомлений текущего пользователя */
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
    @Query('onlyUnread') onlyUnread?: string,
  ) {
    return this.notificationsService.findForUser(user.sub, {
      take: take ? Math.min(Number(take) || 20, 50) : 20,
      skip: skip ? Number(skip) || 0 : 0,
      onlyUnread: onlyUnread === 'true',
    });
  }

  /** GET /notifications/me — backwards-compat алиас (возвращает тот же формат) */
  @Get('me')
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query('take') take?: string,
    @Query('limit') legacyLimit?: string,
  ) {
    const raw = take ?? legacyLimit;
    const parsedTake = raw ? Number(raw) : NaN;
    const safeTake =
      Number.isNaN(parsedTake) || parsedTake <= 0
        ? 20
        : Math.min(parsedTake, 50);

    return this.notificationsService.findForUser(user.sub, { take: safeTake });
  }

  /** PATCH /notifications/:id/read — отметить одно уведомление прочитанным */
  @Patch(':id/read')
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  /** POST /notifications/:id/read — alias для совместимости с задачей */
  @Post(':id/read')
  async markAsReadPost(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, user.sub);
  }

  /** PATCH /notifications/read-all — отметить все прочитанными */
  @Patch('read-all')
  async markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  /** POST /notifications/read-all — alias для совместимости с задачей */
  @Post('read-all')
  async markAllReadPost(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}

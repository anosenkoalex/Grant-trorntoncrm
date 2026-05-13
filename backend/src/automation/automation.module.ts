import { Module } from '@nestjs/common';
import { AutomationController } from './automation.controller.js';
import { AutomationService } from './automation.service.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';

@Module({
  imports: [PrismaModule, NotificationsModule, TelegramModule],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}

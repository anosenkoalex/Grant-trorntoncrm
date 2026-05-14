import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { MeController } from './me.controller.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule, // 👈 EmailService и NotificationsService живут тут
  ],
  controllers: [
    UsersController,
    MeController, // ✅ ВОТ ЭТОГО НЕ ХВАТАЛО
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

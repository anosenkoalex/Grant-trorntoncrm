import { Module } from '@nestjs/common';
import { DevController } from './dev.controller.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { SmsModule } from '../sms/sms.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';

@Module({
  imports: [PrismaModule, SmsModule, TelegramModule],
  controllers: [DevController],
})
export class DevModule {}

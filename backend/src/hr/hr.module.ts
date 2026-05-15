import { Module } from '@nestjs/common';
import { HrController } from './hr.controller.js';
import { HrService } from './hr.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [HrController],
  providers: [HrService],
})
export class HrModule {}

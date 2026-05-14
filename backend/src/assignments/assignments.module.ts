import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service.js';
import { AssignmentsController } from './assignments.controller.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { EmailService } from '../notifications/email.service.js';
import { SmsService } from '../sms/sms.service.js';
import { AutomationModule } from '../automation/automation.module.js';
import { FilesModule } from '../files/files.module.js';

@Module({
  imports: [AutomationModule, FilesModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, PrismaService, EmailService, SmsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

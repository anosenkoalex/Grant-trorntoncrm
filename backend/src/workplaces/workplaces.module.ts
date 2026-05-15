import { Module } from '@nestjs/common';
import { WorkplacesService } from './workplaces.service.js';
import { WorkplacesController } from './workplaces.controller.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [WorkplacesController],
  providers: [WorkplacesService],
  exports: [WorkplacesService],
})
export class WorkplacesModule {}

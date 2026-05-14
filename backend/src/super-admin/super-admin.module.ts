import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service.js';
import { SuperAdminController } from './super-admin.controller.js';

@Module({
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './common/prisma/prisma.module.js';

import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { OrgsModule } from './orgs/orgs.module.js';
import { WorkplacesModule } from './workplaces/workplaces.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { PlansModule } from './plans/plans.module.js';
import { PlannerModule } from './planner/planner.module.js';
import { SmsModule } from './sms/sms.module.js';
import { DevModule } from './dev/dev.module.js';
import { StatisticsModule } from './statistics/statistics.module.js';
import { ReportModule } from './report/report.module.js';
import { AutomationModule } from './automation/automation.module.js';
import { FilesModule } from './files/files.module.js';
import { TelegramModule } from './telegram/telegram.module.js';
import { ApiKeysModule } from './api-keys/api-keys.module.js';
import { HrModule } from './hr/hr.module.js';
import { BillingModule } from './billing/billing.module.js';
import { SuperAdminModule } from './super-admin/super-admin.module.js';
import { GoogleCalendarModule } from './integrations/google-calendar/google-calendar.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    PrismaModule,

    // core
    AuthModule,
    UsersModule,
    OrgsModule,
    WorkplacesModule,
    AssignmentsModule,
    NotificationsModule,
    PlansModule,
    PlannerModule,

    // services
    SmsModule,

    // misc
    DevModule,
    StatisticsModule,
    ReportModule,
    AutomationModule,
    FilesModule,
    TelegramModule,
    ApiKeysModule,
    HrModule,
    BillingModule,
    SuperAdminModule,
    GoogleCalendarModule,
  ],
})
export class AppModule {}

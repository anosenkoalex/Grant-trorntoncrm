import {
  AssignmentStatus,
  NotificationType,
  PrismaClient,
  UserRole,
  VacationStatus,
  VacationType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Очистка старых данных...');

  await prisma.notificationLog.deleteMany().catch(() => null);
  await prisma.auditLog.deleteMany().catch(() => null);
  await prisma.notification.deleteMany();
  await prisma.assignmentFile.deleteMany().catch(() => null);
  await prisma.file.deleteMany().catch(() => null);
  await prisma.workReport.deleteMany().catch(() => null);
  await prisma.assignmentAdjustment.deleteMany().catch(() => null);
  await prisma.assignmentRequest.deleteMany().catch(() => null);
  await prisma.assignmentShift.deleteMany().catch(() => null);
  await prisma.slot.deleteMany().catch(() => null);
  await prisma.plan.deleteMany().catch(() => null);
  await prisma.assignment.deleteMany();
  await prisma.vacationRequest.deleteMany();
  await prisma.apiKey.deleteMany().catch(() => null);
  await prisma.automationSettings.deleteMany().catch(() => null);
  await prisma.constraint.deleteMany().catch(() => null);
  await prisma.subscription.deleteMany().catch(() => null);
  await prisma.pendingRegistration.deleteMany().catch(() => null);
  await prisma.workplace.deleteMany();
  await prisma.user.deleteMany();
  await prisma.org.deleteMany();
  await prisma.smsSettings.deleteMany().catch(() => null);
  await prisma.telegramSettings.deleteMany().catch(() => null);

  console.log('⚙️ Создание организации...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const org = await prisma.org.create({
    data: {
      name: 'Grant Thornton Demo',
      slug: 'grant-thornton-demo',
      onboardingCompleted: true,
    },
  });

  console.log('👤 Создание базовых пользователей...');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@grantthornton.local',
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      fullName: 'System Administrator',
      orgId: org.id,
      phone: '+996700000001',
      isSystemUser: false,
    },
  });

  await prisma.user.create({
    data: {
      email: 'dev@grantthornton.local',
      password: passwordHash,
      role: UserRole.SUPER_ADMIN,
      fullName: 'Developer Account',
      orgId: org.id,
      phone: '+996700000002',
      isSystemUser: true,
    },
  });

  console.log('🏢 Создание рабочих мест (6 штук)...');

  const wp1 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'HQ-001',
      name: 'Headquarters',
      location: 'Москва, ул. Арбат, 15',
      isActive: true,
      color: '#1677ff',
    },
  });

  const wp2 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'HQ-002',
      name: 'Conference Room A',
      location: 'Москва, ул. Арбат, 15 (2 этаж)',
      isActive: true,
      color: '#722ed1',
    },
  });

  const wp3 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'FLD-001',
      name: 'Field Office Moscow',
      location: 'Москва, ул. Тверская, 8',
      isActive: true,
      color: '#fa8c16',
    },
  });

  const wp4 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'FLD-002',
      name: 'Field Office SPb',
      location: 'Санкт-Петербург, Невский пр., 45',
      isActive: true,
      color: '#eb2f96',
    },
  });

  const wp5 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'RMT-001',
      name: 'Remote Workspace',
      location: 'Удалённо',
      isActive: true,
      color: '#52c41a',
    },
  });

  const wp6 = await prisma.workplace.create({
    data: {
      orgId: org.id,
      code: 'RMT-002',
      name: 'Remote Workspace 2',
      location: 'Удалённо',
      isActive: true,
      color: '#13c2c2',
    },
  });

  console.log('👥 Создание сотрудников (8 человек)...');

  const u1 = await prisma.user.create({
    data: {
      email: 'ivan.ivanov@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Иванов Иван',
      orgId: org.id,
      phone: '+79001001001',
    },
  });

  const u2 = await prisma.user.create({
    data: {
      email: 'maria.petrova@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Петрова Мария',
      orgId: org.id,
      phone: '+79001001002',
    },
  });

  const u3 = await prisma.user.create({
    data: {
      email: 'alexey.sidorov@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Сидоров Алексей',
      orgId: org.id,
      phone: '+79001001003',
    },
  });

  const u4 = await prisma.user.create({
    data: {
      email: 'anna.kozlova@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Козлова Анна',
      orgId: org.id,
      phone: '+79001001004',
    },
  });

  const u5 = await prisma.user.create({
    data: {
      email: 'dmitry.novikov@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Новиков Дмитрий',
      orgId: org.id,
      phone: '+79001001005',
    },
  });

  const u6 = await prisma.user.create({
    data: {
      email: 'elena.morozova@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Морозова Елена',
      orgId: org.id,
      phone: '+79001001006',
    },
  });

  const u7 = await prisma.user.create({
    data: {
      email: 'sergey.volkov@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Волков Сергей',
      orgId: org.id,
      phone: '+79001001007',
    },
  });

  const u8 = await prisma.user.create({
    data: {
      email: 'olga.zaitseva@grantthornton.local',
      password: passwordHash,
      role: UserRole.USER,
      fullName: 'Зайцева Ольга',
      orgId: org.id,
      phone: '+79001001008',
    },
  });

  console.log('🗓️ Создание назначений (20 штук)...');

  const d = (y: number, m: number, day: number) =>
    new Date(Date.UTC(y, m - 1, day));

  // 8 active assignments (May–June 2026)
  await prisma.assignment.create({
    data: {
      userId: u1.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 5, 1),
      endsAt: d(2026, 6, 30),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u2.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 5, 5),
      endsAt: d(2026, 6, 30),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u3.id,
      workplaceId: wp2.id,
      startsAt: d(2026, 5, 1),
      endsAt: d(2026, 5, 31),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u4.id,
      workplaceId: wp3.id,
      startsAt: d(2026, 5, 10),
      endsAt: d(2026, 6, 10),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u5.id,
      workplaceId: wp4.id,
      startsAt: d(2026, 5, 15),
      endsAt: d(2026, 7, 15),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u6.id,
      workplaceId: wp5.id,
      startsAt: d(2026, 5, 1),
      endsAt: null,
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u7.id,
      workplaceId: wp6.id,
      startsAt: d(2026, 5, 20),
      endsAt: d(2026, 6, 20),
      status: AssignmentStatus.ACTIVE,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u8.id,
      workplaceId: wp2.id,
      startsAt: d(2026, 5, 12),
      endsAt: d(2026, 6, 12),
      status: AssignmentStatus.ACTIVE,
    },
  });

  // Admin assignment
  await prisma.assignment.create({
    data: {
      userId: admin.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 1, 1),
      endsAt: null,
      status: AssignmentStatus.ACTIVE,
    },
  });

  // 11 archived/completed assignments (April–May 2026)
  await prisma.assignment.create({
    data: {
      userId: u1.id,
      workplaceId: wp3.id,
      startsAt: d(2026, 4, 1),
      endsAt: d(2026, 4, 30),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u2.id,
      workplaceId: wp5.id,
      startsAt: d(2026, 4, 1),
      endsAt: d(2026, 4, 30),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u3.id,
      workplaceId: wp4.id,
      startsAt: d(2026, 3, 15),
      endsAt: d(2026, 4, 15),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u4.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 3, 1),
      endsAt: d(2026, 3, 31),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u5.id,
      workplaceId: wp2.id,
      startsAt: d(2026, 4, 10),
      endsAt: d(2026, 5, 10),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u6.id,
      workplaceId: wp3.id,
      startsAt: d(2026, 4, 1),
      endsAt: d(2026, 4, 30),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u7.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 2, 1),
      endsAt: d(2026, 3, 31),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u8.id,
      workplaceId: wp5.id,
      startsAt: d(2026, 3, 1),
      endsAt: d(2026, 4, 30),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u1.id,
      workplaceId: wp6.id,
      startsAt: d(2026, 2, 15),
      endsAt: d(2026, 3, 15),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u2.id,
      workplaceId: wp4.id,
      startsAt: d(2026, 1, 10),
      endsAt: d(2026, 2, 28),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  await prisma.assignment.create({
    data: {
      userId: u3.id,
      workplaceId: wp1.id,
      startsAt: d(2026, 1, 1),
      endsAt: d(2026, 2, 14),
      status: AssignmentStatus.ARCHIVED,
    },
  });

  console.log('🏖️ Создание HR заявок (6 штук)...');

  await prisma.vacationRequest.create({
    data: {
      userId: u1.id,
      orgId: org.id,
      dateFrom: d(2026, 6, 2),
      dateTo: d(2026, 6, 15),
      type: VacationType.VACATION,
      status: VacationStatus.APPROVED,
      decidedById: admin.id,
      decidedAt: d(2026, 5, 10),
    },
  });

  await prisma.vacationRequest.create({
    data: {
      userId: u2.id,
      orgId: org.id,
      dateFrom: d(2026, 5, 20),
      dateTo: d(2026, 5, 23),
      type: VacationType.SICK_LEAVE,
      status: VacationStatus.APPROVED,
      decidedById: admin.id,
      decidedAt: d(2026, 5, 19),
    },
  });

  await prisma.vacationRequest.create({
    data: {
      userId: u3.id,
      orgId: org.id,
      dateFrom: d(2026, 6, 20),
      dateTo: d(2026, 7, 4),
      type: VacationType.VACATION,
      status: VacationStatus.PENDING,
    },
  });

  await prisma.vacationRequest.create({
    data: {
      userId: u4.id,
      orgId: org.id,
      dateFrom: d(2026, 5, 9),
      dateTo: d(2026, 5, 9),
      type: VacationType.DAY_OFF,
      status: VacationStatus.REJECTED,
      comment: 'Высокая загрузка в этот период',
      decidedById: admin.id,
      decidedAt: d(2026, 5, 7),
    },
  });

  await prisma.vacationRequest.create({
    data: {
      userId: u5.id,
      orgId: org.id,
      dateFrom: d(2026, 7, 7),
      dateTo: d(2026, 7, 20),
      type: VacationType.VACATION,
      status: VacationStatus.PENDING,
    },
  });

  await prisma.vacationRequest.create({
    data: {
      userId: u6.id,
      orgId: org.id,
      dateFrom: d(2026, 5, 28),
      dateTo: d(2026, 5, 30),
      type: VacationType.SICK_LEAVE,
      status: VacationStatus.APPROVED,
      decidedById: admin.id,
      decidedAt: d(2026, 5, 27),
    },
  });

  console.log('🔔 Создание уведомлений (5 штук)...');

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.ASSIGNMENT_CREATED,
      payload: {
        message: 'Иванов Иван назначен на HQ-001 Headquarters',
        employeeName: 'Иванов Иван',
        workplace: 'HQ-001 Headquarters',
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.ASSIGNMENT_UPDATED,
      payload: {
        message: 'Назначение Петровой Марии обновлено',
        employeeName: 'Петрова Мария',
        workplace: 'HQ-001 Headquarters',
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.SYSTEM,
      payload: {
        message: 'Заявка на отпуск Сидорова Алексея ожидает рассмотрения',
        employeeName: 'Сидоров Алексей',
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.REMINDER,
      payload: {
        message: 'Напоминание: назначение Новикова Дмитрия истекает через 3 дня',
        employeeName: 'Новиков Дмитрий',
        workplace: 'FLD-002 Field Office SPb',
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: NotificationType.ASSIGNMENT_CANCELLED,
      payload: {
        message: 'Назначение Козловой Анны отменено',
        employeeName: 'Козлова Анна',
        workplace: 'FLD-001 Field Office Moscow',
      },
      readAt: new Date(),
    },
  });

  console.log('📡 Создание SMS-настроек...');

  await prisma.smsSettings.create({
    data: {
      enabled: false,
      apiUrl: 'https://api.example.com/sms/send',
      apiKey: 'DEMO_KEY',
      sender: 'GRANTHORN',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('➡️  Accounts:');
  console.log('   admin@grantthornton.local / admin123  (SUPER_ADMIN)');
  console.log('   dev@grantthornton.local   / admin123  (SUPER_ADMIN, system)');
  console.log('');
  console.log('➡️  Employees (8):');
  console.log('   ivan.ivanov@grantthornton.local       / admin123');
  console.log('   maria.petrova@grantthornton.local     / admin123');
  console.log('   alexey.sidorov@grantthornton.local    / admin123');
  console.log('   anna.kozlova@grantthornton.local      / admin123');
  console.log('   dmitry.novikov@grantthornton.local    / admin123');
  console.log('   elena.morozova@grantthornton.local    / admin123');
  console.log('   sergey.volkov@grantthornton.local     / admin123');
  console.log('   olga.zaitseva@grantthornton.local     / admin123');
}

main()
  .catch((error) => {
    console.error('❌ Ошибка при инициализации базы:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

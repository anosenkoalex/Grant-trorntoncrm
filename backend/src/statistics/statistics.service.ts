import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { GetStatisticsDto } from './dto/get-statistics.dto.js';
import dayjs from 'dayjs';

export type KpiResponse = {
  kpi: {
    totalEmployees: number;
    totalPlannedHours: number;
    totalReportedHours: number;
    completionRate: number;
    missingReports: number;
    totalShifts: number;
  };
  byWorkplace: {
    workplaceId: string;
    workplaceName: string | null;
    plannedHours: number;
    reportedHours: number;
    completionRate: number;
    employeeCount: number;
    shiftCount: number;
  }[];
  dynamics: {
    date: string;
    plannedHours: number;
    reportedHours: number;
    shiftCount: number;
  }[];
};

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(dto: GetStatisticsDto, orgId?: string) {
    const from = dayjs(dto.from).startOf('day').toDate();
    const to = dayjs(dto.to).endOf('day').toDate();

    // 1. Собираем все смены в периоде (основная логика как была)
    const shifts = await this.prisma.assignmentShift.findMany({
      where: {
        date: { gte: from, lte: to },
        kind: dto.kinds?.length ? { in: dto.kinds } : undefined,
        assignment: {
          userId: dto.userId,
          workplaceId: dto.workplaceId,
          status: dto.assignmentStatuses?.length
            ? { in: dto.assignmentStatuses }
            : undefined,
          ...(orgId ? { user: { orgId } } : {}),
        },
      },
      include: {
        assignment: {
          include: {
            user: true,
            workplace: true,
          },
        },
      },
    });

    const rows = shifts.map((s) => {
      const start = dayjs(s.startsAt);
      const end = s.endsAt ? dayjs(s.endsAt) : null;
      const hours = end ? end.diff(start, 'minute') / 60 : 0;

      return {
        shiftId: s.id,
        date: dayjs(s.date).format('YYYY-MM-DD'),

        userId: s.assignment.userId,
        userName:
          s.assignment.user?.fullName ?? s.assignment.user?.email ?? null,

        workplaceId: s.assignment.workplaceId,
        workplaceName: s.assignment.workplace?.name ?? null,

        assignmentStatus: s.assignment.status,
        shiftKind: s.kind,

        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt?.toISOString() ?? null,

        hours,
      };
    });

    const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);

    // 2. Отчётные часы из WorkReport — считаем отдельно и не ломаем статистику,
    //    если тут что-то упадёт.
    let reportedHourByUser: Record<string, number> = {};
    let totalReportedHours = 0;

    try {
      const userIdsFromShifts = Array.from(new Set(rows.map((r) => r.userId)));

      const workReports = await this.prisma.workReport.findMany({
        where: {
          date: { gte: from, lte: to },
          userId: dto.userId
            ? dto.userId
            : userIdsFromShifts.length
              ? { in: userIdsFromShifts }
              : undefined,
        },
      });

      for (const r of workReports) {
        reportedHourByUser[r.userId] =
          (reportedHourByUser[r.userId] ?? 0) + r.hours;
      }

      totalReportedHours = Object.values(reportedHourByUser).reduce(
        (sum, h) => sum + h,
        0,
      );
    } catch (err) {
      // Логируем, но не роняем статистику
      // eslint-disable-next-line no-console
      console.error('Failed to aggregate work reports for statistics', err);
      reportedHourByUser = {};
      totalReportedHours = 0;
    }

    // 3. Агрегация по пользователю
    const byUserMap: Record<
      string,
      {
        userId: string;
        userName: string | null;
        totalHours: number;
        byKind: Record<string, number>;
        /** Суммарные отчётные часы (из WorkReport) */
        reportedHour?: number | null;
      }
    > = {};

    for (const row of rows) {
      if (!byUserMap[row.userId]) {
        byUserMap[row.userId] = {
          userId: row.userId,
          userName: row.userName,
          totalHours: 0,
          byKind: {},
          reportedHour: null,
        };
      }
      byUserMap[row.userId].totalHours += row.hours;
      byUserMap[row.userId].byKind[row.shiftKind] =
        (byUserMap[row.userId].byKind[row.shiftKind] ?? 0) + row.hours;
    }

    // Примешиваем суммарные отчётные часы
    for (const [userId, hours] of Object.entries(reportedHourByUser)) {
      if (!byUserMap[userId]) {
        byUserMap[userId] = {
          userId,
          userName: null,
          totalHours: 0,
          byKind: {},
          reportedHour: null,
        };
      }
      byUserMap[userId].reportedHour = hours;
    }

    const byUser = Object.values(byUserMap);

    // 4. Агрегация по рабочему месту
    const byWorkplaceMap: Record<
      string,
      {
        workplaceId: string;
        workplaceName: string | null;
        totalHours: number;
      }
    > = {};

    for (const row of rows) {
      if (!byWorkplaceMap[row.workplaceId]) {
        byWorkplaceMap[row.workplaceId] = {
          workplaceId: row.workplaceId,
          workplaceName: row.workplaceName,
          totalHours: 0,
        };
      }
      byWorkplaceMap[row.workplaceId].totalHours += row.hours;
    }

    const byWorkplace = Object.values(byWorkplaceMap);

    // 5. Результат
    return {
      totalShifts: rows.length,
      totalHours,
      totalReportedHours,
      byUser,
      byWorkplace,
      rows,
    };
  }

  async getKpi(dto: GetStatisticsDto, orgId?: string): Promise<KpiResponse> {
    const from = dayjs(dto.from).startOf('day').toDate();
    const to = dayjs(dto.to).endOf('day').toDate();

    const shifts = await this.prisma.assignmentShift.findMany({
      where: {
        date: { gte: from, lte: to },
        kind: dto.kinds?.length ? { in: dto.kinds } : undefined,
        assignment: {
          userId: dto.userId,
          workplaceId: dto.workplaceId,
          status: dto.assignmentStatuses?.length
            ? { in: dto.assignmentStatuses }
            : undefined,
          ...(orgId ? { user: { orgId } } : {}),
        },
      },
      include: {
        assignment: {
          include: { user: true, workplace: true },
        },
      },
    });

    const uniqueUserIds = new Set(shifts.map((s) => s.assignment.userId));

    const workReports = await this.prisma.workReport.findMany({
      where: {
        date: { gte: from, lte: to },
        userId: dto.userId
          ? dto.userId
          : uniqueUserIds.size
            ? { in: Array.from(uniqueUserIds) }
            : undefined,
      },
    });

    // ── KPI summary ──────────────────────────────────────────────────────────
    const totalPlannedHours = shifts.reduce((sum, s) => {
      const h = s.endsAt
        ? dayjs(s.endsAt).diff(dayjs(s.startsAt), 'minute') / 60
        : 0;
      return sum + h;
    }, 0);

    const totalReportedHours = workReports.reduce((s, r) => s + r.hours, 0);
    const completionRate =
      totalPlannedHours > 0
        ? (totalReportedHours / totalPlannedHours) * 100
        : 0;

    const reportingUserIds = new Set(workReports.map((r) => r.userId));
    const missingReports =
      uniqueUserIds.size -
      Array.from(uniqueUserIds).filter((id) => reportingUserIds.has(id)).length;

    // ── By workplace ─────────────────────────────────────────────────────────
    const wpMap: Record<
      string,
      {
        workplaceId: string;
        workplaceName: string | null;
        plannedHours: number;
        reportedHours: number;
        userIds: Set<string>;
        shiftCount: number;
      }
    > = {};

    for (const shift of shifts) {
      const wid = shift.assignment.workplaceId;
      const h = shift.endsAt
        ? dayjs(shift.endsAt).diff(dayjs(shift.startsAt), 'minute') / 60
        : 0;

      if (!wpMap[wid]) {
        wpMap[wid] = {
          workplaceId: wid,
          workplaceName: shift.assignment.workplace?.name ?? null,
          plannedHours: 0,
          reportedHours: 0,
          userIds: new Set(),
          shiftCount: 0,
        };
      }

      wpMap[wid].plannedHours += h;
      wpMap[wid].userIds.add(shift.assignment.userId);
      wpMap[wid].shiftCount++;
    }

    for (const report of workReports) {
      const wid = report.workplaceId;
      if (wid && wpMap[wid]) {
        wpMap[wid].reportedHours += report.hours;
      }
    }

    const byWorkplace = Object.values(wpMap).map((w) => ({
      workplaceId: w.workplaceId,
      workplaceName: w.workplaceName,
      plannedHours: w.plannedHours,
      reportedHours: w.reportedHours,
      completionRate:
        w.plannedHours > 0 ? (w.reportedHours / w.plannedHours) * 100 : 0,
      employeeCount: w.userIds.size,
      shiftCount: w.shiftCount,
    }));

    // ── Daily dynamics ───────────────────────────────────────────────────────
    const dynMap: Record<
      string,
      {
        date: string;
        plannedHours: number;
        reportedHours: number;
        shiftCount: number;
      }
    > = {};

    for (const shift of shifts) {
      const key = dayjs(shift.date).format('YYYY-MM-DD');
      const h = shift.endsAt
        ? dayjs(shift.endsAt).diff(dayjs(shift.startsAt), 'minute') / 60
        : 0;

      if (!dynMap[key]) {
        dynMap[key] = {
          date: key,
          plannedHours: 0,
          reportedHours: 0,
          shiftCount: 0,
        };
      }
      dynMap[key].plannedHours += h;
      dynMap[key].shiftCount++;
    }

    for (const report of workReports) {
      const key =
        report.date instanceof Date
          ? dayjs(report.date).format('YYYY-MM-DD')
          : report.date;
      if (!dynMap[key]) {
        dynMap[key] = {
          date: key,
          plannedHours: 0,
          reportedHours: 0,
          shiftCount: 0,
        };
      }
      dynMap[key].reportedHours += report.hours;
    }

    const dynamics = Object.values(dynMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      kpi: {
        totalEmployees: uniqueUserIds.size,
        totalPlannedHours,
        totalReportedHours,
        completionRate,
        missingReports,
        totalShifts: shifts.length,
      },
      byWorkplace,
      dynamics,
    };
  }
}

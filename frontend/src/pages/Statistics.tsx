import {
  Card,
  Col,
  DatePicker,
  Form,
  Modal,
  Progress,
  Result,
  Row,
  Select,
  Statistic,
  Table,
  Tag,
  Typography,
  Calendar,
  Spin,
  Button,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchUsers,
  fetchStatistics,
  fetchKpi,
  fetchWorkReports,
  fetchWorkplaces,
} from '../api/client.js';
import type {
  AssignmentStatus,
  User,
  ShiftKind,
  StatisticsRow,
  StatisticsResponse,
  WorkReport,
  KpiResponse,
  KpiByWorkplace,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { MobileFilters } from '../components/MobileFilters.js';

const { RangePicker } = DatePicker;

type FiltersState = {
  userId?: string;
  workplaceId?: string;
  status?: AssignmentStatus;
  range?: [Dayjs, Dayjs] | null;
  kinds?: ShiftKind[];
};

const statusOptions: AssignmentStatus[] = ['ACTIVE', 'ARCHIVED'];

const shiftKindLabels: Record<ShiftKind, string> = {
  DEFAULT: 'Обычная смена',
  OFFICE: 'Офис',
  REMOTE: 'Удалёнка',
  DAY_OFF: 'Выходной / Day off',
};

const shiftKindSelectOptions = (Object.keys(shiftKindLabels) as ShiftKind[]).map(
  (k) => ({ value: k, label: shiftKindLabels[k] }),
);

type EmployeeRow = {
  userId: string;
  name: string;
  assignmentsSummary: string;
  workingDays: number;
  totalHours: number;
  reportedHours?: number | null;
};

type DayWorkSummaryRow = {
  workplaceId: string;
  workplaceName: string;
  plannedHours: number;
  reportedHours: number;
};

/* ─────────────────── KPI Cards ─────────────────── */

function KpiCards({ data, loading }: { data: KpiResponse | undefined; loading: boolean }) {
  const kpi = data?.kpi;

  const completionColor =
    !kpi || kpi.completionRate === 0
      ? '#d9d9d9'
      : kpi.completionRate >= 90
      ? '#52c41a'
      : kpi.completionRate >= 60
      ? '#faad14'
      : '#ff4d4f';

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Сотрудников в периоде"
            value={kpi?.totalEmployees ?? 0}
            suffix="чел."
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Плановые часы"
            value={kpi ? kpi.totalPlannedHours.toFixed(1) : '—'}
            suffix="ч"
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Отчётные часы"
            value={kpi ? kpi.totalReportedHours.toFixed(1) : '—'}
            suffix="ч"
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <div style={{ marginBottom: 4 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Процент выполнения
            </Typography.Text>
          </div>
          <Progress
            type="circle"
            size={72}
            percent={kpi ? Math.round(kpi.completionRate) : 0}
            strokeColor={completionColor}
            format={(p) => `${p}%`}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Смен запланировано"
            value={kpi?.totalShifts ?? 0}
            suffix="шт."
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card
          size="small"
          loading={loading}
          style={
            kpi && kpi.missingReports > 0
              ? { borderColor: '#ff7875', background: '#fff2f0' }
              : undefined
          }
        >
          <Statistic
            title="Без отчёта (сотрудников)"
            value={kpi?.missingReports ?? 0}
            valueStyle={kpi && kpi.missingReports > 0 ? { color: '#cf1322' } : undefined}
            suffix="чел."
          />
        </Card>
      </Col>
    </Row>
  );
}

/* ─────────────────── Dynamics Chart ─────────────────── */

function DynamicsChart({ data, loading }: { data: KpiResponse | undefined; loading: boolean }) {
  if (loading) return <Spin style={{ display: 'block', margin: '32px auto' }} />;
  if (!data?.dynamics?.length) {
    return (
      <Typography.Text type="secondary">
        Нет данных для графика за выбранный период.
      </Typography.Text>
    );
  }

  const chartData = data.dynamics.map((d) => ({
    date: dayjs(d.date).format('DD.MM'),
    'Плановые ч.': Number(d.plannedHours.toFixed(2)),
    'Отчётные ч.': Number(d.reportedHours.toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" ч" width={52} />
        <Tooltip formatter={(v) => [`${v} ч`]} />
        <Legend />
        <Line
          type="monotone"
          dataKey="Плановые ч."
          stroke="#1677ff"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="Отчётные ч."
          stroke="#52c41a"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─────────────────── Workplace Summary Table ─────────────────── */

const workplaceColumns: ColumnsType<KpiByWorkplace> = [
  {
    title: 'Рабочее место',
    dataIndex: 'workplaceName',
    key: 'workplaceName',
    render: (v: string | null, r) => v ?? r.workplaceId,
    sorter: (a, b) => (a.workplaceName ?? '').localeCompare(b.workplaceName ?? ''),
  },
  {
    title: 'Сотрудников',
    dataIndex: 'employeeCount',
    key: 'employeeCount',
    align: 'right',
    sorter: (a, b) => a.employeeCount - b.employeeCount,
  },
  {
    title: 'Смен',
    dataIndex: 'shiftCount',
    key: 'shiftCount',
    align: 'right',
    sorter: (a, b) => a.shiftCount - b.shiftCount,
  },
  {
    title: 'Плановые ч.',
    dataIndex: 'plannedHours',
    key: 'plannedHours',
    align: 'right',
    render: (v: number) => v.toFixed(1),
    sorter: (a, b) => a.plannedHours - b.plannedHours,
  },
  {
    title: 'Отчётные ч.',
    dataIndex: 'reportedHours',
    key: 'reportedHours',
    align: 'right',
    render: (v: number) => v.toFixed(1),
    sorter: (a, b) => a.reportedHours - b.reportedHours,
  },
  {
    title: 'Выполнение',
    dataIndex: 'completionRate',
    key: 'completionRate',
    align: 'right',
    sorter: (a, b) => a.completionRate - b.completionRate,
    render: (v: number) => {
      const pct = Math.round(v);
      const color = pct >= 90 ? 'success' : pct >= 60 ? 'warning' : 'error';
      return <Tag color={color}>{pct}%</Tag>;
    },
  },
];

/* ─────────────────── Main Page ─────────────────── */

const StatisticsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const canViewStatistics =
    user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  const defaultRange: [Dayjs, Dayjs] = [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ];

  const [filters, setFilters] = useState<FiltersState>({ range: defaultRange });
  const [detailsUserId, setDetailsUserId] = useState<string | null>(null);
  const [detailsUserName, setDetailsUserName] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [reportUserName, setReportUserName] = useState<string>('');
  const [selectedReportDate, setSelectedReportDate] = useState<Dayjs | null>(null);

  if (!canViewStatistics) {
    return <Result status="403" title={t('admin.accessDenied')} />;
  }

  const effectiveFrom = filters.range?.[0] ?? defaultRange[0];
  const effectiveTo = filters.range?.[1] ?? defaultRange[1];

  /* ── справочники ── */

  const usersQuery = useQuery<User[]>({
    queryKey: ['users', 'all-for-statistics'],
    queryFn: async () => {
      const res = await fetchUsers({ page: 1, pageSize: 100 });
      return res.data;
    },
    enabled: canViewStatistics,
  });

  const workplacesQuery = useQuery({
    queryKey: ['workplaces', 'all-for-statistics'],
    queryFn: async () => {
      const res = await fetchWorkplaces({ page: 1, pageSize: 1000, isActive: true });
      return (res as any).data?.items ?? (res as any).items ?? res.data ?? [];
    },
    enabled: canViewStatistics,
  });

  /* ── KPI ── */

  const kpiQuery = useQuery<KpiResponse>({
    queryKey: [
      'statistics-kpi',
      {
        userId: filters.userId,
        workplaceId: filters.workplaceId,
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      fetchKpi({
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
        userId: filters.userId,
        workplaceId: filters.workplaceId,
      }),
    enabled: canViewStatistics,
  });

  /* ── основная статистика ── */

  const statisticsQuery = useQuery<StatisticsResponse>({
    queryKey: [
      'statistics',
      {
        userId: filters.userId,
        workplaceId: filters.workplaceId,
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
      },
    ],
    queryFn: () =>
      fetchStatistics({
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
        userId: filters.userId,
        workplaceId: filters.workplaceId,
      }),
    enabled: canViewStatistics,
  });

  const statistics = statisticsQuery.data;
  const allRows: StatisticsRow[] = statistics?.rows ?? [];

  const reportedHoursByUser = useMemo(() => {
    const map: Record<string, number | null> = {};
    if (!statistics?.byUser) return map;
    for (const u of statistics.byUser) {
      map[u.userId] = u.reportedHour ?? null;
    }
    return map;
  }, [statistics]);

  const workplaceOptions = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of allRows) {
      if (!row.workplaceId) continue;
      if (!map[row.workplaceId]) map[row.workplaceId] = row.workplaceName ?? row.workplaceId;
    }
    return Object.entries(map).map(([id, name]) => ({ value: id, label: name }));
  }, [allRows]);

  const workplaceNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of allRows) {
      if (!row.workplaceId) continue;
      if (!map[row.workplaceId]) map[row.workplaceId] = row.workplaceName ?? row.workplaceId;
    }
    for (const w of workplacesQuery.data ?? []) {
      if (!map[w.id]) map[w.id] = (w.code || w.name || w.id).toString();
    }
    return map;
  }, [allRows, workplacesQuery.data]);

  const filteredRows: StatisticsRow[] = useMemo(() => {
    return allRows.filter((row) => {
      if (filters.status && row.assignmentStatus !== filters.status) return false;
      if (filters.kinds?.length && !filters.kinds.includes(row.shiftKind as ShiftKind)) return false;
      return true;
    });
  }, [allRows, filters.status, filters.kinds]);

  /* ── агрегат по сотрудникам ── */

  const employeesData: EmployeeRow[] = useMemo(() => {
    const byUser: Record<
      string,
      {
        name: string;
        assignments: Record<string, { workplaceName: string; minDate: string; maxDate: string }>;
        daysSet: Set<string>;
        totalHours: number;
      }
    > = {};

    for (const row of filteredRows) {
      const uid = row.userId;
      if (!uid) continue;
      const displayDate = dayjs(row.startsAt ?? row.date).format('YYYY-MM-DD');

      if (!byUser[uid]) {
        byUser[uid] = { name: row.userName ?? row.userId, assignments: {}, daysSet: new Set(), totalHours: 0 };
      }

      const userAgg = byUser[uid];
      userAgg.daysSet.add(displayDate);
      userAgg.totalHours += row.hours;

      const key = row.workplaceId;
      const workplaceName = row.workplaceName ?? 'Без названия';

      if (!userAgg.assignments[key]) {
        userAgg.assignments[key] = { workplaceName, minDate: displayDate, maxDate: displayDate };
      } else {
        const a = userAgg.assignments[key];
        if (dayjs(displayDate).isBefore(a.minDate)) a.minDate = displayDate;
        if (dayjs(displayDate).isAfter(a.maxDate)) a.maxDate = displayDate;
      }
    }

    return Object.entries(byUser).map(([userId, agg]) => {
      const assignmentsSummary = Object.values(agg.assignments)
        .map((a) => `${a.workplaceName} ${dayjs(a.minDate).format('DD.MM.YYYY')}–${dayjs(a.maxDate).format('DD.MM.YYYY')}`)
        .join('; ');

      return {
        userId,
        name: agg.name,
        assignmentsSummary,
        workingDays: agg.daysSet.size,
        totalHours: Number(agg.totalHours.toFixed(2)),
        reportedHours: reportedHoursByUser[userId] ?? null,
      };
    });
  }, [filteredRows, reportedHoursByUser]);

  /* ── детализация по сотруднику ── */

  const detailsRows = useMemo(() => {
    if (!detailsUserId) return [];
    const rows = filteredRows.filter((r) => r.userId === detailsUserId);
    const statusOrder = (s: AssignmentStatus) => (s === 'ACTIVE' ? 0 : 1);
    return rows.slice().sort((a, b) => {
      const so = statusOrder(a.assignmentStatus) - statusOrder(b.assignmentStatus);
      if (so !== 0) return so;
      const da = dayjs(a.startsAt ?? a.date);
      const db = dayjs(b.startsAt ?? b.date);
      if (da.isBefore(db)) return -1;
      if (da.isAfter(db)) return 1;
      return dayjs(a.startsAt).diff(dayjs(b.startsAt));
    });
  }, [filteredRows, detailsUserId]);

  const plannedHoursByDateForReportUser = useMemo(() => {
    const map: Record<string, number> = {};
    if (!reportUserId) return map;
    for (const row of filteredRows) {
      if (row.userId !== reportUserId) continue;
      const key = dayjs(row.startsAt ?? row.date).format('YYYY-MM-DD');
      map[key] = (map[key] ?? 0) + row.hours;
    }
    return map;
  }, [filteredRows, reportUserId]);

  const workReportsQuery = useQuery<WorkReport[]>({
    queryKey: [
      'workReports',
      { userId: reportUserId, from: effectiveFrom.format('YYYY-MM-DD'), to: effectiveTo.format('YYYY-MM-DD') },
    ],
    queryFn: () =>
      fetchWorkReports({
        userId: reportUserId!,
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
      }),
    enabled: !!reportUserId,
  });

  /* ── экспорт ── */

  const handleExport = async () => {
    if (!statistics) { message.error('Нет данных для экспорта'); return; }

    const start = effectiveFrom.startOf('day');
    const end = effectiveTo.startOf('day');
    const days: Dayjs[] = [];
    let cursor = start.clone();
    while (cursor.isSame(end, 'day') || cursor.isBefore(end, 'day')) {
      days.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    if (!days.length) { message.error('Неверный период для экспорта'); return; }

    setIsExporting(true);
    try {
      const workReports = await fetchWorkReports({
        from: effectiveFrom.format('YYYY-MM-DD'),
        to: effectiveTo.format('YYYY-MM-DD'),
        userId: filters.userId,
        workplaceId: filters.workplaceId,
      });

      const userNameById: Record<string, string> = {};
      (usersQuery.data ?? []).forEach((u) => {
        userNameById[u.id] = (u.fullName ?? '').trim() || u.email || u.id;
      });
      allRows.forEach((row) => { if (!userNameById[row.userId]) userNameById[row.userId] = row.userName ?? row.userId; });
      workReports.forEach((wr) => {
        if (!userNameById[wr.userId] && wr.user) {
          userNameById[wr.user.id] = (wr.user.fullName ?? '').trim() || wr.user.email || wr.user.id;
        }
      });

      const workplaceNameByIdExport: Record<string, string> = {};
      allRows.forEach((row) => { if (row.workplaceId) workplaceNameByIdExport[row.workplaceId] = row.workplaceName ?? row.workplaceId; });
      workReports.forEach((wr) => { if (wr.workplaceId) workplaceNameByIdExport[wr.workplaceId] = wr.workplace?.name ?? wr.workplace?.code ?? wr.workplaceId; });

      const userIds = new Set<string>();
      filteredRows.forEach((row) => userIds.add(row.userId));

      if (filters.workplaceId) {
        const hasWork: Record<string, boolean> = {};
        workReports.forEach((wr) => { if (wr.hours && wr.workplaceId === filters.workplaceId) hasWork[wr.userId] = true; });
        Array.from(userIds).forEach((uid) => { if (!hasWork[uid]) userIds.delete(uid); });
      }

      if (!userIds.size) { message.warning('Нет данных по сотрудникам за выбранный период'); return; }

      const planMap: Record<string, Record<string, Record<string, number>>> = {};
      filteredRows.forEach((row) => {
        const uid = row.userId;
        const dateKey = dayjs(row.startsAt ?? row.date).format('YYYY-MM-DD');
        const wid = row.workplaceId;
        if (!planMap[uid]) planMap[uid] = {};
        if (!planMap[uid][dateKey]) planMap[uid][dateKey] = {};
        planMap[uid][dateKey][wid] = (planMap[uid][dateKey][wid] ?? 0) + row.hours;
      });

      const reportMap: Record<string, Record<string, Record<string, number>>> = {};
      workReports.forEach((wr) => {
        const uid = wr.userId;
        const dateKey = wr.date;
        let intervals: { workplaceId: string | null; hours: number | null }[] | null = null;
        const rawComment = (wr.comment ?? '').trim();
        if (rawComment.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawComment) as any;
            if (parsed && Array.isArray(parsed.intervals)) {
              intervals = parsed.intervals.map((it: any) => ({
                workplaceId: typeof it.workplaceId === 'string' ? it.workplaceId : wr.workplaceId ?? null,
                hours: typeof it.hours === 'number' ? it.hours : Number.isFinite(Number(it.hours)) ? Number(it.hours) : null,
              }));
            }
          } catch { /* skip */ }
        }
        if (!intervals) intervals = [{ workplaceId: wr.workplaceId ?? null, hours: wr.hours }];
        intervals.forEach((interval) => {
          if (interval.hours == null) return;
          const wid = interval.workplaceId ?? 'unknown';
          if (!reportMap[uid]) reportMap[uid] = {};
          if (!reportMap[uid][dateKey]) reportMap[uid][dateKey] = {};
          reportMap[uid][dateKey][wid] = (reportMap[uid][dateKey][wid] ?? 0) + interval.hours;
        });
      });

      const totalByUserWorkplace: Record<string, Record<string, { planned: number; reported: number }>> = {};
      const ensureTotalEntry = (uid: string, wid: string) => {
        if (!totalByUserWorkplace[uid]) totalByUserWorkplace[uid] = {};
        if (!totalByUserWorkplace[uid][wid]) totalByUserWorkplace[uid][wid] = { planned: 0, reported: 0 };
      };
      Object.entries(planMap).forEach(([uid, byDate]) => {
        Object.values(byDate).forEach((byWorkplace) => {
          Object.entries(byWorkplace).forEach(([wid, hours]) => { ensureTotalEntry(uid, wid); totalByUserWorkplace[uid][wid].planned += hours; });
        });
      });
      Object.entries(reportMap).forEach(([uid, byDate]) => {
        Object.values(byDate).forEach((byWorkplace) => {
          Object.entries(byWorkplace).forEach(([wid, hours]) => { ensureTotalEntry(uid, wid); totalByUserWorkplace[uid][wid].reported += hours; });
        });
      });

      const fmtH = (v: number) => (!v ? '0' : Number.isInteger(v) ? String(v) : v.toFixed(2));
      const esc = (v: string | number | null | undefined) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[";,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };

      const lines: string[] = [];
      lines.push(['Сотрудник', ...days.map((d) => d.format('DD.MM'))].map(esc).join(';'));

      Array.from(userIds).forEach((uid) => {
        const rowCells: (string | number)[] = [userNameById[uid] ?? uid];
        days.forEach((d) => {
          const dateKey = d.format('YYYY-MM-DD');
          const plannedByWorkplace = planMap[uid]?.[dateKey] ?? {};
          const reportedByWorkplace = reportMap[uid]?.[dateKey] ?? {};
          const wids = new Set<string>([...Object.keys(plannedByWorkplace), ...Object.keys(reportedByWorkplace)]);
          const parts: string[] = [];
          wids.forEach((wid) => {
            const planned = plannedByWorkplace[wid] ?? 0;
            const reported = reportedByWorkplace[wid] ?? 0;
            if (!planned && !reported) return;
            const wname = workplaceNameByIdExport[wid] ?? (wid === 'unknown' ? 'Без рабочего места' : wid);
            parts.push(`${wname}: план ${fmtH(planned)}, отчёт ${fmtH(reported)}`);
          });
          rowCells.push(parts.join(' | '));
        });
        lines.push(rowCells.map(esc).join(';'));
      });

      const allWidsSet = new Set<string>();
      Object.values(totalByUserWorkplace).forEach((bw) => Object.keys(bw).forEach((wid) => allWidsSet.add(wid)));
      const allWids = Array.from(allWidsSet).filter((w) => w !== 'unknown');

      if (allWids.length) {
        lines.push('');
        lines.push(esc('Итого по рабочим местам'));
        lines.push(['Сотрудник', ...allWids.map((wid) => workplaceNameByIdExport[wid] ?? wid)].map(esc).join(';'));
        Array.from(userIds).forEach((uid) => {
          const totals = totalByUserWorkplace[uid];
          const rowCells = [userNameById[uid] ?? uid, ...allWids.map((wid) => {
            const val = totals?.[wid];
            if (!val || (!val.planned && !val.reported)) return '';
            return `План ${fmtH(val.planned)}, отчёт ${fmtH(val.reported)}`;
          })];
          lines.push(rowCells.map(esc).join(';'));
        });
      }

      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statistics_${effectiveFrom.format('YYYY-MM-DD')}_${effectiveTo.format('YYYY-MM-DD')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      message.error('Ошибка при формировании файла для экспорта');
    } finally {
      setIsExporting(false);
    }
  };

  const workReportsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    if (!workReportsQuery.data) return map;
    for (const wr of workReportsQuery.data) {
      map[wr.date] = (map[wr.date] ?? 0) + wr.hours;
    }
    return map;
  }, [workReportsQuery.data]);

  const daySummaryRows: DayWorkSummaryRow[] = useMemo(() => {
    if (!reportUserId || !selectedReportDate) return [];

    const targetDate = selectedReportDate.format('YYYY-MM-DD');
    const plannedByWorkplace: Record<string, { workplaceName: string; hours: number }> = {};

    filteredRows.forEach((row) => {
      if (row.userId !== reportUserId) return;
      if (dayjs(row.startsAt ?? row.date).format('YYYY-MM-DD') !== targetDate) return;
      const wid = row.workplaceId ?? 'unknown';
      const name = row.workplaceName ?? row.workplaceId ?? '—';
      if (!plannedByWorkplace[wid]) plannedByWorkplace[wid] = { workplaceName: name, hours: 0 };
      plannedByWorkplace[wid].hours += row.hours;
    });

    const plannedKeys = Object.keys(plannedByWorkplace);
    const reportedByWorkplace: Record<string, number> = {};

    const addReported = (rawWid: string | null | undefined, rawHours: number | null | undefined, wr: WorkReport) => {
      if (rawHours == null) return;
      const hours = Number(rawHours);
      if (!Number.isFinite(hours) || hours <= 0) return;
      let wid = rawWid ?? null;
      if (!wid && plannedKeys.length === 1) wid = plannedKeys[0];
      const key = wid ?? 'unknown';
      reportedByWorkplace[key] = (reportedByWorkplace[key] ?? 0) + hours;
      if (!plannedByWorkplace[key]) {
        plannedByWorkplace[key] = {
          workplaceName: wr.workplace?.name ?? workplaceNameById[key] ?? (key === 'unknown' ? 'Без рабочего места' : key),
          hours: 0,
        };
      }
    };

    (workReportsQuery.data ?? []).forEach((wr) => {
      if (!wr || wr.userId !== reportUserId || wr.date !== targetDate) return;
      const rawComment = (wr.comment ?? '').trim();
      let usedIntervals = false;
      if (rawComment.startsWith('{')) {
        try {
          const parsed: any = JSON.parse(rawComment);
          if (parsed && Array.isArray(parsed.intervals)) {
            parsed.intervals.forEach((it: any) => {
              const wid = typeof it?.workplaceId === 'string' ? it.workplaceId : wr.workplaceId ?? null;
              const hrs = typeof it?.hours === 'number' ? it.hours : Number.isFinite(Number(it?.hours)) ? Number(it.hours) : null;
              if (hrs != null) { usedIntervals = true; addReported(wid, hrs, wr); }
            });
          }
        } catch { /* skip */ }
      }
      if (!usedIntervals) addReported(wr.workplaceId, wr.hours, wr);
    });

    const allIds = new Set<string>([...Object.keys(plannedByWorkplace), ...Object.keys(reportedByWorkplace)]);
    const rows: DayWorkSummaryRow[] = [];
    allIds.forEach((wid) => {
      const planned = plannedByWorkplace[wid];
      const plannedHours = planned?.hours ?? 0;
      const reportedHours = reportedByWorkplace[wid] ?? 0;
      if (!plannedHours && !reportedHours) return;
      rows.push({
        workplaceId: wid,
        workplaceName: planned?.workplaceName ?? workplaceNameById[wid] ?? (wid === 'unknown' ? 'Без рабочего места' : wid),
        plannedHours,
        reportedHours,
      });
    });
    return rows;
  }, [reportUserId, selectedReportDate, filteredRows, workReportsQuery.data, workplaceNameById]);

  const isLoading = statisticsQuery.isLoading || usersQuery.isLoading;
  const isKpiLoading = kpiQuery.isLoading;

  /* ── колонки ── */

  const employeesColumns: ColumnsType<EmployeeRow> = [
    {
      title: 'Сотрудник',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record) => (
        <a onClick={() => { setDetailsUserId(record.userId); setDetailsUserName(record.name); }}>
          {value}
        </a>
      ),
    },
    {
      title: 'Назначения',
      dataIndex: 'assignmentsSummary',
      key: 'assignmentsSummary',
      ellipsis: true,
    },
    { title: 'Рабочих дней', dataIndex: 'workingDays', key: 'workingDays' },
    {
      title: 'Количество часов',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: 'Количество отчётных часов',
      dataIndex: 'reportedHours',
      key: 'reportedHours',
      render: (value: number | null | undefined, record) =>
        value != null ? (
          <a onClick={() => { setReportUserId(record.userId); setReportUserName(record.name); setSelectedReportDate(effectiveFrom); }}>
            {value.toFixed(2)}
          </a>
        ) : '—',
    },
  ];

  const detailColumns: ColumnsType<StatisticsRow> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (_v, record) => dayjs(record.startsAt ?? record.date).format('DD.MM.YYYY'),
    },
    {
      title: 'Рабочее место',
      dataIndex: 'workplaceName',
      key: 'workplaceName',
      render: (v: string | null) => v ?? '',
    },
    {
      title: 'Тип смены',
      dataIndex: 'shiftKind',
      key: 'shiftKind',
      render: (kind: ShiftKind) => shiftKindLabels[kind] ?? kind,
    },
    {
      title: 'Время',
      key: 'time',
      render: (_v, record) =>
        `${dayjs(record.startsAt).format('HH:mm')} → ${dayjs(record.endsAt ?? record.startsAt).format('HH:mm')}`,
    },
    {
      title: 'Статус назначения',
      dataIndex: 'assignmentStatus',
      key: 'assignmentStatus',
      render: (v: AssignmentStatus) => (v === 'ACTIVE' ? 'Активно' : 'В архиве'),
    },
    {
      title: 'Часы',
      dataIndex: 'hours',
      key: 'hours',
      render: (v: number) => v.toFixed(2),
    },
  ];

  const daySummaryColumns: ColumnsType<DayWorkSummaryRow> = [
    { title: 'Рабочее место', dataIndex: 'workplaceName', key: 'workplaceName' },
    { title: 'Назначено часов', dataIndex: 'plannedHours', key: 'plannedHours', render: (v: number) => v.toFixed(2) },
    { title: 'Отработано по отчёту', dataIndex: 'reportedHours', key: 'reportedHours', render: (v: number) => v.toFixed(2) },
  ];

  /* ── render ── */

  return (
    <Card title="Статистика назначений">
      {/* Фильтры */}
      <MobileFilters style={{ marginBottom: 16 }}>
        <Form
          layout="vertical"
          className="mb-4"
          initialValues={{ range: defaultRange }}
          onValuesChange={(_changed, allValues) => {
            setFilters({
              userId: allValues.userId,
              workplaceId: allValues.workplaceId,
              status: allValues.status,
              range: allValues.range,
              kinds: allValues.kinds,
            });
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}
        >
          <Form.Item name="userId" label="Сотрудник" style={{ margin: 0, minWidth: 200 }}>
            <Select
              allowClear
              showSearch
              options={usersQuery.data?.map((u) => ({ value: u.id, label: `${u.fullName ?? u.email}` })) ?? []}
              placeholder="Сотрудник"
              optionFilterProp="label"
              style={{ width: '100%', minWidth: 200 }}
            />
          </Form.Item>

          <Form.Item name="workplaceId" label="Рабочее место" style={{ margin: 0, minWidth: 200 }}>
            <Select
              allowClear
              showSearch
              options={workplaceOptions}
              placeholder="Рабочее место"
              optionFilterProp="label"
              style={{ width: '100%', minWidth: 200 }}
            />
          </Form.Item>

          <Form.Item name="status" label="Статус" style={{ margin: 0, minWidth: 160 }}>
            <Select
              allowClear
              style={{ width: '100%', minWidth: 160 }}
              options={statusOptions.map((value) => ({ value, label: value === 'ACTIVE' ? 'Активно' : 'В архиве' }))}
              placeholder="Любой"
            />
          </Form.Item>

          <Form.Item name="range" label="Период" style={{ margin: 0 }}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="kinds" label="Тип смены" style={{ margin: 0, minWidth: 200 }}>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%', minWidth: 200 }}
              options={shiftKindSelectOptions}
              placeholder="Тип смены"
            />
          </Form.Item>
        </Form>
      </MobileFilters>

      {/* KPI-карточки */}
      <KpiCards data={kpiQuery.data} loading={isKpiLoading} />

      {/* График динамики */}
      <Card
        title="Динамика за период"
        size="small"
        style={{ marginBottom: 24 }}
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Плановые vs отчётные часы по дням
          </Typography.Text>
        }
      >
        <DynamicsChart data={kpiQuery.data} loading={isKpiLoading} />
      </Card>

      {/* Сводная таблица по рабочим местам */}
      <Card title="Сводка по рабочим местам" size="small" style={{ marginBottom: 24 }}>
        <Table<KpiByWorkplace>
          rowKey="workplaceId"
          dataSource={kpiQuery.data?.byWorkplace ?? []}
          columns={workplaceColumns}
          size="small"
          loading={isKpiLoading}
          pagination={false}
          scroll={{ x: 700 }}
          locale={{ emptyText: 'Нет данных за выбранный период' }}
        />
      </Card>

      <Button
        type="primary"
        onClick={handleExport}
        loading={isExporting}
        style={{ marginBottom: 16 }}
      >
        Скачать Excel
      </Button>

      {/* Список сотрудников */}
      <Table<EmployeeRow>
        rowKey="userId"
        dataSource={employeesData}
        columns={employeesColumns}
        size="small"
        scroll={{ x: 800 }}
        loading={isLoading}
        locale={{ emptyText: 'Нет данных за выбранный период' }}
      />

      {/* Календарь отчётных часов */}
      <Modal
        open={!!reportUserId}
        title={reportUserName ? `Отчётные часы: ${reportUserName}` : 'Отчётные часы'}
        footer={null}
        width={800}
        onCancel={() => { setReportUserId(null); setReportUserName(''); setSelectedReportDate(null); }}
      >
        {!reportUserId ? null : workReportsQuery.isLoading ? (
          <Spin />
        ) : (
          <>
            <Calendar
              fullscreen={false}
              value={selectedReportDate ?? effectiveFrom}
              onSelect={(value) => setSelectedReportDate(value)}
              dateFullCellRender={(value) => {
                const key = value.format('YYYY-MM-DD');
                const planned = plannedHoursByDateForReportUser[key];
                const reported = workReportsByDate[key];
                const outOfRange = value.isBefore(effectiveFrom, 'day') || value.isAfter(effectiveTo, 'day');
                const hasData = (planned != null && planned > 0) || (reported != null && reported > 0);
                const isSelected = !!selectedReportDate && value.isSame(selectedReportDate, 'day');

                return (
                  <div
                    style={{
                      textAlign: 'center',
                      borderRadius: 4,
                      padding: 2,
                      border: isSelected ? '1px solid #1677ff' : hasData ? '1px solid #52c41a' : '1px solid transparent',
                      backgroundColor: isSelected ? '#e6f4ff' : undefined,
                      opacity: outOfRange ? 0.2 : hasData ? 1 : 0.4,
                    }}
                  >
                    <div>{value.date()}</div>
                    {hasData && (
                      <div style={{ fontSize: 10 }}>
                        {planned != null && planned > 0 && <div>{planned.toFixed(1)} ч план</div>}
                        {reported != null && reported > 0 && <div>{reported.toFixed(1)} ч отчёт</div>}
                      </div>
                    )}
                  </div>
                );
              }}
              defaultValue={effectiveFrom}
            />

            <div style={{ marginTop: 16 }}>
              {selectedReportDate ? (
                daySummaryRows.length > 0 ? (
                  <Table<DayWorkSummaryRow>
                    rowKey="workplaceId"
                    size="small"
                    dataSource={daySummaryRows}
                    columns={daySummaryColumns}
                    pagination={false}
                    scroll={{ x: 600 }}
                  />
                ) : (
                  <Typography.Text type="secondary">
                    На выбранную дату нет данных по сменам или отчётам.
                  </Typography.Text>
                )
              ) : (
                <Typography.Text type="secondary">
                  Выберите дату в календаре, чтобы увидеть детали по рабочим местам.
                </Typography.Text>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Детализация по сотруднику */}
      <Modal
        open={!!detailsUserId}
        title={detailsUserName ? `Детализация по сотруднику: ${detailsUserName}` : 'Детализация'}
        footer={null}
        width={1000}
        onCancel={() => { setDetailsUserId(null); setDetailsUserName(''); }}
      >
        {detailsRows.length === 0 ? (
          <Typography.Text type="secondary">
            Нет данных по выбранному сотруднику за этот период.
          </Typography.Text>
        ) : (
          <Table<StatisticsRow>
            rowKey="shiftId"
            size="small"
            dataSource={detailsRows}
            columns={detailColumns}
            pagination={false}
            scroll={{ x: 800 }}
          />
        )}
      </Modal>
    </Card>
  );
};

export default StatisticsPage;

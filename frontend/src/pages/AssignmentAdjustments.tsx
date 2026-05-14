import {
  Button,
  Card,
  Result,
  Space,
  Table,
  Tag,
  Typography,
  Select,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';

import {
  ScheduleAdjustment,
  ScheduleAdjustmentStatus,
  fetchScheduleAdjustments,
  approveScheduleAdjustment,
  rejectScheduleAdjustment,
} from '../api/client.js';

import { useAuth } from '../context/AuthContext.js';

const statusColor: Record<ScheduleAdjustmentStatus, string> = {
  PENDING: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

const AssignmentAdjustmentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const canManage = isAdmin || isManager;

  const [statusFilter, setStatusFilter] = useState<
    ScheduleAdjustmentStatus | 'ALL'
  >('PENDING');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const adjustmentsQuery = useQuery({
    queryKey: ['schedule-adjustments', { statusFilter, page, pageSize }],
    queryFn: () =>
      fetchScheduleAdjustments({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        pageSize,
      }),
    enabled: canManage,
    keepPreviousData: true,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveScheduleAdjustment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['schedule-adjustments'],
      });
      message.success(t('assignmentAdjustments.approved'));
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(axiosError?.response?.data?.message || t('assignmentAdjustments.error'));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectScheduleAdjustment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['schedule-adjustments'],
      });
      message.success(t('assignmentAdjustments.rejected'));
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      message.error(axiosError?.response?.data?.message || t('assignmentAdjustments.error'));
    },
  });

  const items = adjustmentsQuery.data?.items ?? [];
  const total = adjustmentsQuery.data?.total ?? 0;

  const columns: ColumnsType<ScheduleAdjustment> = useMemo(
    () => [
      {
        title: t('assignmentAdjustments.createdAt'),
        dataIndex: 'createdAt',
        responsive: ['md'],
        render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm'),
      },
      {
        title: t('assignmentAdjustments.user'),
        render: (_, record) =>
          record.user?.fullName ?? record.user?.email ?? '—',
      },
      {
        title: t('assignmentAdjustments.workplace'),
        responsive: ['md'],
        render: (_, record) => {
          const wp = record.assignment?.workplace;
          if (!wp) return '—';
          return wp.code ? `${wp.code} — ${wp.name}` : wp.name;
        },
      },
      {
        title: t('assignmentAdjustments.date'),
        dataIndex: 'date',
        render: (value) => dayjs(value).format('DD.MM.YYYY'),
      },
      {
        title: t('assignmentAdjustments.timeType'),
        responsive: ['md'],
        render: (_, record) => {
          const start = record.startsAt
            ? dayjs(record.startsAt).format('HH:mm')
            : null;
          const end = record.endsAt
            ? dayjs(record.endsAt).format('HH:mm')
            : null;

          const time = start && end ? `${start} → ${end}` : t('assignmentAdjustments.noTime');

          const type =
            record.kind === 'DAY_OFF'
              ? t('assignmentAdjustments.kindDayOff')
              : record.kind === 'OFFICE'
                ? t('assignmentAdjustments.kindOffice')
                : record.kind === 'REMOTE'
                  ? t('assignmentAdjustments.kindRemote')
                  : t('assignmentAdjustments.kindDefault');

          return `${time} (${type})`;
        },
      },
      {
        title: t('assignmentAdjustments.comment'),
        dataIndex: 'comment',
        responsive: ['lg'],
        render: (v) => v || '—',
      },
      {
        title: t('assignmentAdjustments.status'),
        dataIndex: 'status',
        render: (v: ScheduleAdjustmentStatus) => (
          <Tag color={statusColor[v]}>
            {v === 'PENDING'
              ? t('assignmentAdjustments.statusPending')
              : v === 'APPROVED'
                ? t('assignmentAdjustments.statusApproved')
                : t('assignmentAdjustments.statusRejected')}
          </Tag>
        ),
      },
      {
        title: t('assignmentAdjustments.actions'),
        render: (_, record) => {
          const pending = record.status === 'PENDING';

          return (
            <Space wrap>
              <Button
                type="link"
                disabled={!pending}
                onClick={() => approveMutation.mutate(record.id)}
              >
                {t('assignmentAdjustments.approve')}
              </Button>
              <Button
                type="link"
                danger
                disabled={!pending}
                onClick={() => rejectMutation.mutate(record.id)}
              >
                {t('assignmentAdjustments.reject')}
              </Button>
            </Space>
          );
        },
      },
    ],
    [approveMutation.isPending, rejectMutation.isPending, t],
  );

  if (!canManage) {
    return <Result status="403" title={t('assignmentAdjustments.noAccess')} />;
  }

  return (
    <Card
      title={t('assignmentAdjustments.title')}
      bodyStyle={{ padding: 12 }}
      extra={
        <Space wrap>
          <Typography.Text>{t('assignmentAdjustments.filterStatus')}:</Typography.Text>
          <Select
            value={statusFilter}
            style={{ minWidth: 160 }}
            onChange={(v) => {
              setStatusFilter(v as ScheduleAdjustmentStatus | 'ALL');
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: t('assignmentAdjustments.filterAll') },
              { value: 'PENDING', label: t('assignmentAdjustments.statusPending') },
              { value: 'APPROVED', label: t('assignmentAdjustments.statusApproved') },
              { value: 'REJECTED', label: t('assignmentAdjustments.statusRejected') },
            ]}
          />
        </Space>
      }
    >
      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        loading={adjustmentsQuery.isLoading}
        size="small"
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p);
            setPageSize(s);
          },
        }}
      />
    </Card>
  );
};

export default AssignmentAdjustmentsPage;

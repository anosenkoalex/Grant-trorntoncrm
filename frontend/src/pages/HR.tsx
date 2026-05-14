import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  approveVacation,
  createVacationRequest,
  fetchMyVacations,
  fetchVacations,
  rejectVacation,
  type VacationRequest,
  type VacationStatus,
  type VacationType,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const STATUS_COLORS: Record<VacationStatus, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

const TYPE_COLORS: Record<VacationType, string> = {
  VACATION: '#1677ff',
  SICK_LEAVE: '#ff7a45',
  DAY_OFF: '#52c41a',
};

/* ── Таб «Мои заявки» ──────────────────────────────────────────── */

function MyVacationsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['my-vacations'],
    queryFn: fetchMyVacations,
  });

  const createMutation = useMutation({
    mutationFn: createVacationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-vacations'] });
      setCreateOpen(false);
      form.resetFields();
    },
  });

  const typeLabels: Record<VacationType, string> = {
    VACATION: t('hr.typeVacation'),
    SICK_LEAVE: t('hr.typeSickLeave'),
    DAY_OFF: t('hr.typeDayOff'),
  };

  const statusLabels: Record<VacationStatus, string> = {
    PENDING: t('hr.statusPending'),
    APPROVED: t('hr.statusApproved'),
    REJECTED: t('hr.statusRejected'),
  };

  const columns = [
    {
      title: t('hr.colType'),
      dataIndex: 'type',
      render: (v: VacationType) => (
        <Tag color={TYPE_COLORS[v]}>{typeLabels[v] ?? v}</Tag>
      ),
    },
    {
      title: t('hr.colPeriod'),
      render: (_: unknown, r: VacationRequest) =>
        `${dayjs(r.dateFrom).format('DD.MM.YYYY')} — ${dayjs(r.dateTo).format('DD.MM.YYYY')}`,
    },
    {
      title: t('hr.colStatus'),
      dataIndex: 'status',
      render: (v: VacationStatus) => (
        <Tag color={STATUS_COLORS[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: t('hr.colComment'),
      dataIndex: 'comment',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('hr.colCreatedAt'),
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = (values: any) => {
    const [dateFrom, dateTo] = values.dates;
    createMutation.mutate({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      type: values.type,
      comment: values.comment?.trim() || undefined,
    });
  };

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <Button type="primary" onClick={() => setCreateOpen(true)}>
          {t('hr.newRequest')}
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        loading={isLoading}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        size="small"
      />

      <Modal
        title={t('hr.formTitle')}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="type"
            label={t('hr.typeLabel')}
            rules={[{ required: true }]}
          >
            <Select
              options={Object.entries(typeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder={t('hr.typePlaceholder')}
            />
          </Form.Item>

          <Form.Item
            name="dates"
            label={t('hr.periodLabel')}
            rules={[{ required: true }]}
          >
            <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item name="comment" label={t('hr.commentLabel')}>
            <TextArea rows={3} placeholder={t('hr.commentPlaceholder')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setCreateOpen(false);
                  form.resetFields();
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending}
              >
                {t('hr.submit')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

/* ── Таб «Команда» (менеджер / админ) ─────────────────────────── */

function TeamVacationsTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<VacationStatus | undefined>(
    undefined,
  );
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vacations', { page, status: statusFilter }],
    queryFn: () => fetchVacations({ page, pageSize: 20, status: statusFilter }),
  });

  const approveMutation = useMutation({
    mutationFn: approveVacation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vacations'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectVacation(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vacations'] });
      setRejectId(null);
      setRejectComment('');
    },
  });

  const typeLabels: Record<VacationType, string> = {
    VACATION: t('hr.typeVacation'),
    SICK_LEAVE: t('hr.typeSickLeave'),
    DAY_OFF: t('hr.typeDayOff'),
  };

  const statusLabels: Record<VacationStatus, string> = {
    PENDING: t('hr.statusPending'),
    APPROVED: t('hr.statusApproved'),
    REJECTED: t('hr.statusRejected'),
  };

  const columns = [
    {
      title: t('hr.colEmployee'),
      render: (_: unknown, r: VacationRequest) =>
        r.user?.fullName ?? r.user?.email ?? r.userId,
    },
    {
      title: t('hr.colType'),
      dataIndex: 'type',
      render: (v: VacationType) => (
        <Tag color={TYPE_COLORS[v]}>{typeLabels[v] ?? v}</Tag>
      ),
    },
    {
      title: t('hr.colPeriod'),
      render: (_: unknown, r: VacationRequest) =>
        `${dayjs(r.dateFrom).format('DD.MM.YYYY')} — ${dayjs(r.dateTo).format('DD.MM.YYYY')}`,
    },
    {
      title: t('hr.colStatus'),
      dataIndex: 'status',
      render: (v: VacationStatus) => (
        <Tag color={STATUS_COLORS[v]}>{statusLabels[v]}</Tag>
      ),
    },
    {
      title: t('hr.colComment'),
      dataIndex: 'comment',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: t('hr.colCreatedAt'),
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: t('hr.colActions'),
      render: (_: unknown, r: VacationRequest) =>
        r.status === 'PENDING' ? (
          <Space size="small">
            <Popconfirm
              title={t('hr.approveConfirm')}
              onConfirm={() => approveMutation.mutate(r.id)}
              okText={t('common.yes')}
              cancelText={t('common.cancel')}
            >
              <Button
                type="link"
                size="small"
                loading={approveMutation.isPending}
              >
                {t('hr.approve')}
              </Button>
            </Popconfirm>
            <Button
              type="link"
              size="small"
              danger
              onClick={() => setRejectId(r.id)}
            >
              {t('hr.reject')}
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder={t('hr.filterStatus')}
          style={{ width: 220 }}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: 'PENDING', label: t('hr.statusPending') },
            { value: 'APPROVED', label: t('hr.statusApproved') },
            { value: 'REJECTED', label: t('hr.statusRejected') },
          ]}
        />
      </div>

      <Table
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: (p) => setPage(p),
          hideOnSinglePage: true,
        }}
      />

      <Modal
        title={t('hr.rejectTitle')}
        open={!!rejectId}
        onCancel={() => {
          setRejectId(null);
          setRejectComment('');
        }}
        onOk={() => {
          if (rejectId)
            rejectMutation.mutate({
              id: rejectId,
              comment: rejectComment || undefined,
            });
        }}
        okText={t('hr.reject')}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <TextArea
          rows={3}
          placeholder={t('hr.rejectPlaceholder')}
          value={rejectComment}
          onChange={(e) => setRejectComment(e.target.value)}
        />
      </Modal>
    </>
  );
}

/* ── Таб «Календарь» ───────────────────────────────────────────── */

function VacationCalendarTab({
  isManagerOrAdmin,
}: {
  isManagerOrAdmin: boolean;
}) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() =>
    dayjs().startOf('month'),
  );

  const dateFrom = currentMonth.toISOString();
  const dateTo = currentMonth.endOf('month').toISOString();

  const managerQuery = useQuery({
    queryKey: ['vacations-calendar', currentMonth.format('YYYY-MM')],
    queryFn: () =>
      fetchVacations({
        status: 'APPROVED',
        page: 1,
        pageSize: 200,
        dateFrom,
        dateTo,
      }),
    enabled: isManagerOrAdmin,
  });

  const myQuery = useQuery({
    queryKey: ['my-vacations-calendar', currentMonth.format('YYYY-MM')],
    queryFn: fetchMyVacations,
    enabled: !isManagerOrAdmin,
  });

  const isLoading = isManagerOrAdmin
    ? managerQuery.isLoading
    : myQuery.isLoading;

  const rawVacations: VacationRequest[] = isManagerOrAdmin
    ? (managerQuery.data?.items ?? [])
    : (myQuery.data ?? []).filter((v) => {
        const from = dayjs(v.dateFrom);
        const to = dayjs(v.dateTo);
        return (
          from.isBefore(currentMonth.endOf('month')) &&
          to.isAfter(currentMonth.startOf('month').subtract(1, 'day'))
        );
      });

  const daysInMonth = currentMonth.daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) =>
    currentMonth.add(i, 'day'),
  );

  // Group vacations by employee
  const employeeMap = new Map<
    string,
    { name: string; vacations: VacationRequest[] }
  >();
  rawVacations.forEach((v) => {
    if (!employeeMap.has(v.userId)) {
      employeeMap.set(v.userId, {
        name: v.user?.fullName ?? v.user?.email ?? v.userId,
        vacations: [],
      });
    }
    employeeMap.get(v.userId)!.vacations.push(v);
  });

  const employees = Array.from(employeeMap.entries());

  const typeLabels: Record<VacationType, string> = {
    VACATION: t('hr.typeVacation'),
    SICK_LEAVE: t('hr.typeSickLeave'),
    DAY_OFF: t('hr.typeDayOff'),
  };

  const getVacationOnDay = (vacations: VacationRequest[], day: dayjs.Dayjs) =>
    vacations.find((v) => {
      const from = dayjs(v.dateFrom).startOf('day');
      const to = dayjs(v.dateTo).endOf('day');
      return !day.isBefore(from) && !day.isAfter(to);
    });

  return (
    <div>
      {/* Month navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Button
          icon={<LeftOutlined />}
          size="small"
          onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))}
        />
        <Typography.Text strong style={{ minWidth: 140, textAlign: 'center' }}>
          {currentMonth.locale('ru').format('MMMM YYYY')}
        </Typography.Text>
        <Button
          icon={<RightOutlined />}
          size="small"
          onClick={() => setCurrentMonth((m) => m.add(1, 'month'))}
        />
      </div>

      {/* Legend */}
      <Space style={{ marginBottom: 16 }} wrap>
        {(Object.keys(TYPE_COLORS) as VacationType[]).map((type) => (
          <Tag key={type} color={TYPE_COLORS[type]}>
            {typeLabels[type]}
          </Tag>
        ))}
        {isManagerOrAdmin && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {t('hr.calendarApprovedOnly', '— только одобренные')}
          </Typography.Text>
        )}
      </Space>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : employees.length === 0 ? (
        <Typography.Text type="secondary">
          {t('hr.calendarEmpty', 'Нет одобренных заявок за выбранный месяц.')}
        </Typography.Text>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              tableLayout: 'fixed',
              minWidth: daysInMonth * 30 + 180,
            }}
          >
            <colgroup>
              <col style={{ width: 180 }} />
              {days.map((d) => (
                <col key={d.format('YYYY-MM-DD')} style={{ width: 30 }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #f0f0f0',
                    textAlign: 'left',
                    background: '#fafafa',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {t('hr.colEmployee')}
                </th>
                {days.map((day) => {
                  const isWeekend = day.day() === 0 || day.day() === 6;
                  const isToday = day.isSame(dayjs(), 'day');
                  return (
                    <th
                      key={day.format('YYYY-MM-DD')}
                      style={{
                        padding: '2px 1px',
                        border: '1px solid #f0f0f0',
                        textAlign: 'center',
                        background: isToday
                          ? '#e6f7ff'
                          : isWeekend
                            ? '#fafafa'
                            : undefined,
                        fontSize: 10,
                        lineHeight: '14px',
                      }}
                    >
                      <div style={{ fontWeight: isToday ? 700 : 400 }}>
                        {day.format('D')}
                      </div>
                      <div style={{ color: '#999', fontSize: 9 }}>
                        {day.format('dd')}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map(([userId, { name, vacations: empVacations }]) => (
                <tr key={userId}>
                  <td
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #f0f0f0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: 12,
                      maxWidth: 180,
                    }}
                    title={name}
                  >
                    {name}
                  </td>
                  {days.map((day) => {
                    const vac = getVacationOnDay(empVacations, day);
                    const color = vac ? TYPE_COLORS[vac.type] : undefined;
                    return (
                      <td
                        key={day.format('YYYY-MM-DD')}
                        title={
                          vac
                            ? `${typeLabels[vac.type]}: ${dayjs(vac.dateFrom).format('DD.MM')} – ${dayjs(vac.dateTo).format('DD.MM')}`
                            : undefined
                        }
                        style={{
                          padding: 0,
                          border: '1px solid #f0f0f0',
                          background: color ? color + '30' : undefined,
                        }}
                      >
                        {vac && (
                          <div
                            style={{
                              height: 20,
                              background: color,
                              opacity: 0.85,
                              margin: 1,
                              borderRadius: 2,
                            }}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Страница HR ────────────────────────────────────────────────── */

const HRPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManagerOrAdmin =
    user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const tabItems = [
    {
      key: 'my',
      label: t('hr.myTab'),
      children: <MyVacationsTab />,
    },
    ...(isManagerOrAdmin
      ? [
          {
            key: 'team',
            label: t('hr.teamTab'),
            children: <TeamVacationsTab />,
          },
        ]
      : []),
    {
      key: 'calendar',
      label: t('hr.calendarTab', 'Календарь'),
      children: <VacationCalendarTab isManagerOrAdmin={isManagerOrAdmin} />,
    },
  ];

  return (
    <Card
      title={
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('hr.title')}
        </Typography.Title>
      }
    >
      <Tabs items={tabItems} />
    </Card>
  );
};

export default HRPage;

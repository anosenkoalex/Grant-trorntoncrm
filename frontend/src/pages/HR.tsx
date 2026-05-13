import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd';
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
      render: (v: VacationType) => typeLabels[v] ?? v,
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
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
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="type" label={t('hr.typeLabel')} rules={[{ required: true }]}>
            <Select
              options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))}
              placeholder={t('hr.typePlaceholder')}
            />
          </Form.Item>

          <Form.Item name="dates" label={t('hr.periodLabel')} rules={[{ required: true }]}>
            <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item name="comment" label={t('hr.commentLabel')}>
            <TextArea rows={3} placeholder={t('hr.commentPlaceholder')} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setCreateOpen(false); form.resetFields(); }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
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
  const [statusFilter, setStatusFilter] = useState<VacationStatus | undefined>(undefined);
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
      render: (v: VacationType) => typeLabels[v] ?? v,
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
              <Button type="link" size="small" loading={approveMutation.isPending}>
                {t('hr.approve')}
              </Button>
            </Popconfirm>
            <Button type="link" size="small" danger onClick={() => setRejectId(r.id)}>
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
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
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
        onCancel={() => { setRejectId(null); setRejectComment(''); }}
        onOk={() => {
          if (rejectId) rejectMutation.mutate({ id: rejectId, comment: rejectComment || undefined });
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

/* ── Страница HR ────────────────────────────────────────────────── */

const HRPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isManagerOrAdmin = user?.role === 'MANAGER' || user?.role === 'SUPER_ADMIN';

  const tabItems = [
    {
      key: 'my',
      label: t('hr.myTab'),
      children: <MyVacationsTab />,
    },
    ...(isManagerOrAdmin
      ? [{ key: 'team', label: t('hr.teamTab'), children: <TeamVacationsTab /> }]
      : []),
  ];

  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>{t('hr.title')}</Typography.Title>}>
      <Tabs items={tabItems} />
    </Card>
  );
};

export default HRPage;

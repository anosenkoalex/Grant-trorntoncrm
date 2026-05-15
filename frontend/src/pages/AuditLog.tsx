import { useState } from 'react';
import { Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { fetchAuditLog, type AuditLogItem } from '../api/client.js';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  APPROVE: 'cyan',
  REJECT: 'orange',
};

export default function AuditLog() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page],
    queryFn: () => fetchAuditLog({ page, pageSize }),
  });

  const columns: ColumnsType<AuditLogItem> = [
    {
      title: t('auditLog.date', 'Дата'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('auditLog.user', 'Пользователь'),
      key: 'user',
      width: 200,
      render: (_: unknown, row: AuditLogItem) =>
        row.user?.fullName || row.user?.email || row.userId,
    },
    {
      title: t('auditLog.action', 'Действие'),
      dataIndex: 'action',
      key: 'action',
      width: 110,
      render: (v: string) => (
        <Tag color={ACTION_COLORS[v] ?? 'default'}>{v}</Tag>
      ),
    },
    {
      title: t('auditLog.entity', 'Сущность'),
      dataIndex: 'entity',
      key: 'entity',
      width: 140,
    },
    {
      title: t('auditLog.details', 'Детали'),
      dataIndex: 'details',
      key: 'details',
      render: (v: Record<string, unknown> | null) =>
        v ? (
          <Typography.Text
            type="secondary"
            style={{ fontSize: 12 }}
            title={JSON.stringify(v, null, 2)}
          >
            {Object.entries(v)
              .map(([k, val]) => `${k}: ${String(val)}`)
              .join(', ')}
          </Typography.Text>
        ) : null,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {t('auditLog.title', 'Audit Log')}
      </Typography.Title>
      <Table<AuditLogItem>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 800 }}
        pagination={{
          current: page,
          pageSize,
          total: data?.total ?? 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showTotal: (total) => t('auditLog.total', { total }),
        }}
      />
    </Space>
  );
}

import {
  Button,
  Card,
  Divider,
  Form,
  InputNumber,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  fetchAutomationSettings,
  fetchNotificationLog,
  updateAutomationSettings,
  type NotificationLogItem,
  type UpdateAutomationSettingsPayload,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { Title, Text } = Typography;

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  ASSIGNMENT_CREATED: 'Назначение создано',
  ASSIGNMENT_UPDATED: 'Назначение обновлено',
  ASSIGNMENT_CANCELLED: 'Назначение отменено',
  ASSIGNMENT_MOVED: 'Назначение перенесено',
  SYSTEM: 'Системное',
  REMINDER: 'Напоминание',
};

function NotificationLogTable() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notification-log', page],
    queryFn: () => fetchNotificationLog({ page, pageSize: 50 }),
  });

  const columns = [
    {
      title: t('automation.logDate', 'Дата'),
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: t('automation.logType', 'Тип события'),
      dataIndex: 'type',
      render: (v: string) => NOTIFICATION_TYPE_LABELS[v] ?? v,
    },
    {
      title: t('automation.logRecipient', 'Получатель'),
      render: (_: unknown, r: NotificationLogItem) => {
        if (r.channel === 'TELEGRAM') return <Text type="secondary">—</Text>;
        const label = r.user?.fullName ?? r.user?.email ?? r.userLabel ?? r.userId ?? '—';
        return label;
      },
    },
    {
      title: t('automation.logChannel', 'Канал'),
      dataIndex: 'channel',
      width: 120,
      render: (v: string) =>
        v === 'TELEGRAM' ? (
          <Tag color="blue">Telegram</Tag>
        ) : (
          <Tag color="green">{t('automation.logChannelSystem', 'Система')}</Tag>
        ),
    },
  ];

  return (
    <Card
      title={t('automation.logTitle', 'Лог уведомлений')}
      style={{ marginTop: 24 }}
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('automation.logDesc', 'История отправленных уведомлений')}
        </Text>
      }
    >
      <Table
        rowKey="id"
        dataSource={data?.items ?? []}
        columns={columns}
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.total ?? 0,
          onChange: (p) => setPage(p),
          hideOnSinglePage: true,
          showTotal: (total) => `${t('automation.logTotal', 'Всего')}: ${total}`,
        }}
        locale={{ emptyText: t('automation.logEmpty', 'Уведомлений ещё не отправлялось') }}
      />
    </Card>
  );
}

export default function AutomationSettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<UpdateAutomationSettingsPayload>();
  const reminderEnabled = Form.useWatch('reminderEnabled', form);

  const settingsQuery = useQuery({
    queryKey: ['automation-settings'],
    queryFn: fetchAutomationSettings,
  });

  const updateMutation = useMutation({
    mutationFn: updateAutomationSettings,
    onSuccess: () => {
      void message.success(t('automation.savedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['automation-settings'] });
    },
    onError: () => {
      void message.error(t('automation.saveError'));
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.setFieldsValue(settingsQuery.data);
    }
  }, [settingsQuery.data, form]);

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER')) {
    return (
      <div style={{ padding: 24 }}>
        <Text type="danger">{t('admin.accessDenied')}</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        {t('automation.title')}
      </Title>

      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate(values)}
          initialValues={{
            triggerOnCreate: true,
            triggerOnUpdate: true,
            triggerOnCancel: true,
            reminderEnabled: true,
            reminderHoursBefore: 24,
          }}
        >
          <Card title={t('automation.triggerCard')} style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('automation.triggerCardDesc')}
            </Text>

            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space>
                <Form.Item name="triggerOnCreate" valuePropName="checked" noStyle>
                  <Switch checkedChildren={t('automation.on')} unCheckedChildren={t('automation.off')} />
                </Form.Item>
                <Text>{t('automation.onCreate')}</Text>
              </Space>

              <Space>
                <Form.Item name="triggerOnUpdate" valuePropName="checked" noStyle>
                  <Switch checkedChildren={t('automation.on')} unCheckedChildren={t('automation.off')} />
                </Form.Item>
                <Text>{t('automation.onUpdate')}</Text>
              </Space>

              <Space>
                <Form.Item name="triggerOnCancel" valuePropName="checked" noStyle>
                  <Switch checkedChildren={t('automation.on')} unCheckedChildren={t('automation.off')} />
                </Form.Item>
                <Text>{t('automation.onCancel')}</Text>
              </Space>
            </Space>
          </Card>

          <Card title={t('automation.slaCard')}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('automation.slaCardDesc')}
            </Text>

            <Space style={{ marginBottom: 16 }}>
              <Form.Item name="reminderEnabled" valuePropName="checked" noStyle>
                <Switch checkedChildren={t('automation.on')} unCheckedChildren={t('automation.off')} />
              </Form.Item>
              <Text>{t('automation.slaEnabled')}</Text>
            </Space>

            <Divider style={{ margin: '12px 0' }} />

            <Form.Item
              label={t('automation.slaHoursLabel')}
              name="reminderHoursBefore"
              rules={[
                { required: true, message: t('automation.slaRequired') },
                { type: 'number', min: 1, max: 168, message: t('automation.slaRange') },
              ]}
            >
              <InputNumber
                min={1}
                max={168}
                addonAfter={t('automation.hoursUnit')}
                disabled={!reminderEnabled}
                style={{ width: 160 }}
              />
            </Form.Item>

            {!reminderEnabled && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('automation.slaHoursDisabled')}
              </Text>
            )}
          </Card>

          <div style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
              size="large"
            >
              {t('automation.save')}
            </Button>
          </div>
        </Form>
      )}

      <NotificationLogTable />
    </div>
  );
}

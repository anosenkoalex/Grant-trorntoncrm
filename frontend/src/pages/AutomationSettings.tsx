import {
  Button,
  Card,
  Divider,
  Form,
  InputNumber,
  Skeleton,
  Space,
  Switch,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchAutomationSettings,
  updateAutomationSettings,
  type UpdateAutomationSettingsPayload,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { Title, Text } = Typography;

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
    </div>
  );
}

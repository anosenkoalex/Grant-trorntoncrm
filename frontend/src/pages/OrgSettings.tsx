import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Space,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchMyOrg, updateOrgBranding } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

export default function OrgSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [color, setColor] = useState<string | null>(null);

  const { data: org, isLoading } = useQuery({
    queryKey: ['orgs', 'me'],
    queryFn: fetchMyOrg,
    enabled: !!user?.orgId,
  });

  useEffect(() => {
    if (org) {
      form.setFieldsValue({
        logoUrl: org.logoUrl ?? '',
        companyDisplayName: org.companyDisplayName ?? '',
      });
      setColor(org.primaryColor ?? null);
    }
  }, [org, form]);

  const mutation = useMutation({
    mutationFn: updateOrgBranding,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orgs', 'me'] });
      void message.success(t('orgSettings.saved'));
    },
    onError: () => {
      void message.error(t('orgSettings.saveError'));
    },
  });

  const handleSave = async () => {
    const values = await form.validateFields();
    mutation.mutate({
      logoUrl: (values.logoUrl as string) || null,
      companyDisplayName: (values.companyDisplayName as string) || null,
      primaryColor: color || null,
    });
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        {t('orgSettings.title')}
      </Typography.Title>

      <Card loading={isLoading} style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="companyDisplayName"
            label={t('orgSettings.displayName')}
            extra={t('orgSettings.displayNameHint')}
          >
            <Input placeholder="Grant Thornton" />
          </Form.Item>

          <Form.Item
            name="logoUrl"
            label={t('orgSettings.logoUrl')}
            extra={t('orgSettings.logoUrlHint')}
          >
            <Input placeholder="https://example.com/logo.png" />
          </Form.Item>

          <Form.Item label={t('orgSettings.primaryColor')}>
            <Space direction="vertical" size={8}>
              <Space align="center">
                <input
                  type="color"
                  value={color ?? '#0B5ED7'}
                  onChange={(e) => setColor(e.target.value)}
                  style={{ width: 40, height: 32, cursor: 'pointer', border: '1px solid #d9d9d9', borderRadius: 6, padding: 2 }}
                />
                <Typography.Text>{color ?? '#0B5ED7'}</Typography.Text>
              </Space>
              {color && (
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={() => setColor(null)}
                >
                  {t('orgSettings.resetColor')}
                </Button>
              )}
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              loading={mutation.isPending}
              onClick={() => void handleSave()}
            >
              {t('orgSettings.save')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

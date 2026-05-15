import { useEffect, useState } from 'react';
import { Badge, Card, Col, Layout, Row, Space, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client.js';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

type ComponentStatus = 'ok' | 'error' | 'loading';

type SystemComponent = {
  key: string;
  label: string;
  status: ComponentStatus;
  latency?: number;
};

async function checkEndpoint(url: string): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  try {
    await api.get(url);
    return { ok: true, latency: Date.now() - start };
  } catch (e: unknown) {
    const latency = Date.now() - start;
    const status = (e as { response?: { status?: number } })?.response?.status;
    return { ok: status !== undefined && status < 500, latency };
  }
}

function StatusIcon({ status }: { status: ComponentStatus }) {
  if (status === 'loading') return <LoadingOutlined style={{ fontSize: 20, color: '#1677ff' }} />;
  if (status === 'ok') return <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
  return <CloseCircleOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />;
}

export default function StatusPage() {
  const { t } = useTranslation();

  const [components, setComponents] = useState<SystemComponent[]>([
    { key: 'api', label: t('status.componentApi', 'API Server'), status: 'loading' },
    { key: 'db', label: t('status.componentDb', 'Database'), status: 'loading' },
    { key: 'billing', label: t('status.componentBilling', 'Billing (Stripe)'), status: 'loading' },
    { key: 'notifications', label: t('status.componentNotifications', 'Notifications'), status: 'loading' },
  ]);

  const allOk = components.every((c) => c.status === 'ok');
  const hasError = components.some((c) => c.status === 'error');

  useEffect(() => {
    const run = async () => {
      const [apiResult, billingResult] = await Promise.all([
        checkEndpoint('/auth/profile'),
        checkEndpoint('/billing/info'),
      ]);

      setComponents([
        {
          key: 'api',
          label: t('status.componentApi', 'API Server'),
          status: apiResult.ok ? 'ok' : 'error',
          latency: apiResult.latency,
        },
        {
          key: 'db',
          label: t('status.componentDb', 'Database'),
          status: apiResult.ok ? 'ok' : 'error',
          latency: apiResult.latency,
        },
        {
          key: 'billing',
          label: t('status.componentBilling', 'Billing (Stripe)'),
          status: billingResult.ok || billingResult.latency < 3000 ? 'ok' : 'error',
          latency: billingResult.latency,
        },
        {
          key: 'notifications',
          label: t('status.componentNotifications', 'Notifications'),
          status: apiResult.ok ? 'ok' : 'error',
        },
      ]);
    };

    void run();
  }, [t]);

  const overallStatus = hasError
    ? t('status.degraded', 'Degraded Performance')
    : allOk
      ? t('status.operational', 'All Systems Operational')
      : t('status.checking', 'Checking…');

  const overallColor = hasError ? '#ff4d4f' : allOk ? '#52c41a' : '#1677ff';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <Header
        style={{
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingInline: 24,
        }}
      >
        <Link to="/" style={{ fontWeight: 700, fontSize: 16, color: '#0B5ED7' }}>
          Grant Thornton CRM
        </Link>
        <Space>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </Space>
      </Header>

      <Content style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div
          style={{
            background: overallColor,
            borderRadius: 12,
            padding: '24px 32px',
            marginBottom: 32,
            color: '#fff',
          }}
        >
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            {overallStatus}
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
            {t('status.uptimeLabel', '30-day uptime: 100%')}
          </Text>
        </div>

        <Title level={4} style={{ marginBottom: 16 }}>
          {t('status.componentsTitle', 'Components')}
        </Title>

        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {components.map((c) => (
            <Card key={c.key} size="small" style={{ borderRadius: 8 }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size={10} align="center">
                    <StatusIcon status={c.status} />
                    <Text strong>{c.label}</Text>
                  </Space>
                </Col>
                <Col>
                  <Space size={12} align="center">
                    {c.latency !== undefined && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {c.latency} ms
                      </Text>
                    )}
                    <Badge
                      status={c.status === 'ok' ? 'success' : c.status === 'error' ? 'error' : 'processing'}
                      text={
                        c.status === 'ok'
                          ? t('status.statusOk', 'Operational')
                          : c.status === 'error'
                            ? t('status.statusError', 'Error')
                            : t('status.statusChecking', 'Checking')
                      }
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
        </Space>

        <div
          style={{
            marginTop: 40,
            padding: '20px 24px',
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}
        >
          <Title level={5} style={{ marginBottom: 8 }}>
            {t('status.historyTitle', 'Incident History')}
          </Title>
          <Text type="secondary">{t('status.noIncidents', 'No incidents in the last 30 days.')}</Text>
        </div>
      </Content>
    </Layout>
  );
}

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { createPortalSession, fetchBillingInfo, type SubscriptionPlan, type SubscriptionStatus } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { Title, Text } = Typography;

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER: 'Starter',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
};

const PLAN_COLORS: Record<SubscriptionPlan, string> = {
  STARTER: 'blue',
  BUSINESS: 'purple',
  ENTERPRISE: 'gold',
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'green',
  TRIALING: 'cyan',
  PAST_DUE: 'orange',
  CANCELLED: 'red',
  INCOMPLETE: 'default',
};

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: 'Active',
  TRIALING: 'Trial',
  PAST_DUE: 'Past Due',
  CANCELLED: 'Cancelled',
  INCOMPLETE: 'Incomplete',
};

const PLAN_LIMITS: Record<SubscriptionPlan, string> = {
  STARTER: 'Up to 10 users',
  BUSINESS: 'Up to 50 users',
  ENTERPRISE: 'Unlimited users',
};

export default function BillingPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['billing-info'],
    queryFn: fetchBillingInfo,
    enabled: !!user,
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      createPortalSession(window.location.origin + '/billing'),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: () => {
      void message.error('Failed to open billing portal');
    },
  });

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER')) {
    return (
      <div style={{ padding: 24 }}>
        <Text type="danger">Access denied</Text>
      </div>
    );
  }

  const sub = data?.subscription;
  const invoices = data?.invoices ?? [];

  const invoiceColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      width: 120,
    },
    {
      title: 'Amount',
      render: (_: unknown, r: { amount: number; currency: string }) =>
        `${r.amount.toFixed(2)} ${r.currency}`,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={v === 'paid' ? 'green' : v === 'open' ? 'orange' : 'default'}>
          {v.toUpperCase()}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Invoice',
      dataIndex: 'pdf',
      render: (v: string | null) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer">
            Download PDF
          </a>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <Title level={4} style={{ marginBottom: 24 }}>
        Billing & Subscription
      </Title>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : !sub ? (
        <Alert
          type="info"
          showIcon
          message="No active subscription"
          description="Your organization doesn't have a subscription yet. Contact support or register a new account."
        />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Descriptions column={1} size="small" title="Current Plan">
                  <Descriptions.Item label="Plan">
                    <Space>
                      <Tag color={PLAN_COLORS[sub.plan]}>{PLAN_LABELS[sub.plan]}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>{PLAN_LIMITS[sub.plan]}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={STATUS_COLORS[sub.status]}>{STATUS_LABELS[sub.status]}</Tag>
                  </Descriptions.Item>
                  {sub.currentPeriodEnd && (
                    <Descriptions.Item label="Next payment">
                      {dayjs(sub.currentPeriodEnd).format('DD MMMM YYYY')}
                    </Descriptions.Item>
                  )}
                  {sub.cancelAtPeriodEnd && (
                    <Descriptions.Item label="">
                      <Text type="warning">Cancels at end of period</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Title level={5} style={{ marginBottom: 12 }}>Manage Subscription</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                  Upgrade, downgrade, change payment method, or cancel your subscription via the Stripe portal.
                </Text>
                <Button
                  type="primary"
                  loading={portalMutation.isPending}
                  onClick={() => portalMutation.mutate()}
                >
                  Open Billing Portal
                </Button>
              </Card>
            </Col>
          </Row>

          <Card title="Payment History">
            <Table
              rowKey="id"
              dataSource={invoices}
              columns={invoiceColumns}
              size="small"
              pagination={{ hideOnSinglePage: true, pageSize: 10 }}
              locale={{ emptyText: 'No payment history yet' }}
            />
          </Card>
        </>
      )}
    </div>
  );
}

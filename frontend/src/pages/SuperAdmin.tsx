import {
  Card,
  Col,
  Row,
  Skeleton,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  fetchSuperAdminOrgs,
  fetchSuperAdminStats,
  type OrgSummary,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { Title, Text } = Typography;

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

export default function SuperAdminPage() {
  const { user } = useAuth();

  const orgsQuery = useQuery({
    queryKey: ['super-admin-orgs'],
    queryFn: fetchSuperAdminOrgs,
    retry: false,
  });

  const statsQuery = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: fetchSuperAdminStats,
    retry: false,
  });

  if (!user) return null;

  if (orgsQuery.isError) {
    return (
      <div style={{ padding: 24 }}>
        <Text type="danger">
          Access denied. This page is for platform administrators only.
        </Text>
      </div>
    );
  }

  const stats = statsQuery.data;

  const columns = [
    {
      title: 'Company',
      dataIndex: 'name',
      render: (name: string, r: OrgSummary) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.slug}
          </Text>
        </div>
      ),
    },
    {
      title: 'Plan',
      render: (_: unknown, r: OrgSummary) =>
        r.subscription ? (
          <Tag color={PLAN_COLORS[r.subscription.plan]}>
            {r.subscription.plan}
          </Tag>
        ) : (
          <Tag>No subscription</Tag>
        ),
      width: 130,
    },
    {
      title: 'Status',
      render: (_: unknown, r: OrgSummary) =>
        r.subscription ? (
          <Tag color={STATUS_COLORS[r.subscription.status]}>
            {r.subscription.status}
          </Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
      width: 120,
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      width: 80,
      render: (v: number) => v,
    },
    {
      title: 'Next Renewal',
      render: (_: unknown, r: OrgSummary) =>
        r.subscription?.currentPeriodEnd ? (
          dayjs(r.subscription.currentPeriodEnd).format('DD.MM.YYYY')
        ) : (
          <Text type="secondary">—</Text>
        ),
      width: 130,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      width: 120,
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        Platform Administration
      </Title>

      {/* Stats */}
      {statsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} style={{ marginBottom: 24 }} />
      ) : stats ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Total Organizations" value={stats.orgCount} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Total Users" value={stats.userCount} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Active Subscriptions"
                value={stats.activeSubscriptions}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      {/* Orgs table */}
      <Card title="All Organizations">
        <Table
          rowKey="id"
          dataSource={orgsQuery.data ?? []}
          columns={columns}
          loading={orgsQuery.isLoading}
          size="small"
          pagination={{ pageSize: 20, hideOnSinglePage: true }}
          locale={{ emptyText: 'No organizations yet' }}
        />
      </Card>
    </div>
  );
}

import {
  Alert,
  Button,
  Card,
  Form,
  Grid,
  Input,
  Layout,
  Select,
  Space,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { initiateRegistration, type SubscriptionPlan } from '../api/client.js';

const { Header, Content } = Layout;
const { Title, Text, Link } = Typography;

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'tr', label: 'TR' },
  { value: 'ru', label: 'RU' },
];

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  STARTER: 'Starter — $29/mo (up to 10 users)',
  BUSINESS: 'Business — $99/mo (up to 50 users)',
  ENTERPRISE: 'Enterprise — $299/mo (unlimited)',
};

interface FormValues {
  companyName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
  plan: SubscriptionPlan;
}

const { useBreakpoint } = Grid;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const handleLangChange = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPlan =
    (searchParams.get('plan') as SubscriptionPlan) || 'STARTER';

  const handleSubmit = async (values: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const { url } = await initiateRegistration({
        companyName: values.companyName,
        adminEmail: values.adminEmail,
        password: values.password,
        plan: values.plan,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string | string[]; code?: string } };
      };
      const msg = apiErr?.response?.data?.message;
      if (Array.isArray(msg)) setError(msg.join(', '));
      else if (
        msg === 'EMAIL_TAKEN' ||
        apiErr?.response?.data?.code === 'EMAIL_TAKEN'
      ) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(
          (msg as string | undefined) ??
            'Registration failed. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          background: '#fff',
          padding: isMobile ? '0 16px' : '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <Title
          level={4}
          style={{ margin: 0, color: '#1677ff', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Grant Thornton CRM
        </Title>
        <Select
          size="small"
          value={i18n.language.slice(0, 2)}
          onChange={handleLangChange}
          options={LANG_OPTIONS}
          style={{ width: 68 }}
          variant="borderless"
        />
      </Header>
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0, fontWeight: 500 }}>
              Create your company account
            </Title>
          </div>

          <Card style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            {error && (
              <Alert
                type="error"
                message={error}
                showIcon
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setError(null)}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ plan: defaultPlan }}
            >
              <Form.Item
                label="Company Name"
                name="companyName"
                rules={[
                  { required: true, message: 'Please enter your company name' },
                ]}
              >
                <Input placeholder="Acme Corp" size="large" />
              </Form.Item>

              <Form.Item
                label="Admin Email"
                name="adminEmail"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' },
                ]}
              >
                <Input
                  placeholder="admin@company.com"
                  size="large"
                  type="email"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                ]}
              >
                <Input.Password placeholder="Min 8 characters" size="large" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('Passwords do not match'),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Repeat password" size="large" />
              </Form.Item>

              <Form.Item
                label="Plan"
                name="plan"
                rules={[{ required: true, message: 'Please select a plan' }]}
              >
                <Select
                  size="large"
                  options={Object.entries(PLAN_LABELS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Continue to Payment
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                You will be redirected to Stripe to complete payment.
              </Text>
            </div>
          </Card>

          <Space
            style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}
          >
            <Text type="secondary">Already have an account?</Text>
            <Link onClick={() => navigate('/login')}>Sign In</Link>
          </Space>
        </div>
      </Content>
    </Layout>
  );
}

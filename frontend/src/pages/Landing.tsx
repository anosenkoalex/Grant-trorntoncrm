import {
  Button,
  Card,
  Col,
  Layout,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'tr', label: 'TR' },
  { value: 'ru', label: 'RU' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLangChange = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const PLANS = [
    {
      name: t('landing.starterName'),
      price: '$29',
      period: t('landing.perMonth'),
      limit: t('landing.starterLimit'),
      features: [
        t('landing.fShifts'),
        t('landing.fAssignments'),
        t('landing.fBasicStats'),
        t('landing.fEmail'),
        t('landing.fHr'),
      ],
      cta: t('landing.planCta'),
      highlighted: false,
      plan: 'STARTER',
    },
    {
      name: t('landing.businessName'),
      price: '$99',
      period: t('landing.perMonth'),
      limit: t('landing.businessLimit'),
      features: [
        t('landing.fAllStarter'),
        t('landing.fAnalytics'),
        t('landing.fTelegram'),
        t('landing.fAutomation'),
        t('landing.fFiles'),
        t('landing.fApi'),
      ],
      cta: t('landing.planCta'),
      highlighted: true,
      plan: 'BUSINESS',
    },
    {
      name: t('landing.enterpriseName'),
      price: '$299',
      period: t('landing.perMonth'),
      limit: t('landing.enterpriseLimit'),
      features: [
        t('landing.fAllBusiness'),
        t('landing.fUnlimited'),
        t('landing.fSupport'),
        t('landing.fIntegrations'),
        t('landing.fSla'),
      ],
      cta: t('landing.planCta'),
      highlighted: false,
      plan: 'ENTERPRISE',
    },
  ];

  const FEATURES = [
    { title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
    { title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
    { title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header
        style={{
          background: '#fff',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
          Grant Thornton CRM
        </Title>
        <Space size={8}>
          <Select
            size="small"
            value={i18n.language.slice(0, 2)}
            onChange={handleLangChange}
            options={LANG_OPTIONS}
            style={{ width: 68 }}
            variant="borderless"
          />
          <Button type="link" onClick={() => navigate('/login')}>
            {t('landing.signIn')}
          </Button>
          <Button type="primary" onClick={() => navigate('/register')}>
            {t('landing.getStarted')}
          </Button>
        </Space>
      </Header>

      <Content>
        {/* Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
            padding: '80px 40px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <Title
            level={1}
            style={{
              color: '#fff',
              marginBottom: 16,
              fontSize: 'clamp(28px, 5vw, 48px)',
            }}
          >
            {t('landing.heroTitle')}
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 18,
              maxWidth: 600,
              margin: '0 auto 32px',
            }}
          >
            {t('landing.heroSubtitle')}
          </Paragraph>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              size="large"
              type="default"
              style={{
                background: '#fff',
                borderColor: '#fff',
                fontWeight: 600,
              }}
              onClick={() => navigate('/register')}
            >
              {t('landing.startTrial')}
            </Button>
            <Button size="large" ghost onClick={() => navigate('/login')}>
              {t('landing.signIn')}
            </Button>
          </Space>
        </div>

        {/* Features */}
        <div
          style={{
            padding: '64px 40px',
            background: '#f9fafb',
            maxWidth: 1100,
            margin: '0 auto',
          }}
        >
          <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
            {t('landing.featuresTitle')}
          </Title>
          <Row gutter={[24, 24]}>
            {FEATURES.map((f) => (
              <Col key={f.title} xs={24} sm={12} md={8}>
                <Card
                  bordered={false}
                  style={{
                    height: '100%',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <Title level={5} style={{ marginBottom: 8 }}>
                    {f.title}
                  </Title>
                  <Text type="secondary">{f.desc}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Pricing */}
        <div
          style={{ padding: '64px 40px', maxWidth: 1100, margin: '0 auto' }}
          id="pricing"
        >
          <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
            {t('landing.pricingTitle')}
          </Title>
          <Paragraph
            style={{ textAlign: 'center', color: '#888', marginBottom: 40 }}
          >
            {t('landing.pricingSubtitle')}
          </Paragraph>
          <Row gutter={[24, 24]} justify="center">
            {PLANS.map((plan) => (
              <Col key={plan.name} xs={24} sm={12} md={8}>
                <Card
                  bordered={plan.highlighted}
                  style={{
                    height: '100%',
                    borderColor: plan.highlighted ? '#1677ff' : undefined,
                    boxShadow: plan.highlighted
                      ? '0 4px 24px rgba(22,119,255,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {plan.highlighted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: -28,
                        background: '#1677ff',
                        color: '#fff',
                        fontSize: 11,
                        padding: '2px 36px',
                        transform: 'rotate(45deg)',
                        fontWeight: 600,
                      }}
                    >
                      {t('landing.popular')}
                    </div>
                  )}
                  <Title level={4} style={{ marginBottom: 4 }}>
                    {plan.name}
                  </Title>
                  <div style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#1677ff',
                      }}
                    >
                      {plan.price}
                    </span>
                    <span style={{ color: '#888', marginLeft: 4 }}>
                      {plan.period}
                    </span>
                  </div>
                  <Text
                    type="secondary"
                    style={{ display: 'block', marginBottom: 20, fontSize: 13 }}
                  >
                    {plan.limit}
                  </Text>
                  <ul
                    style={{
                      padding: 0,
                      listStyle: 'none',
                      margin: '0 0 24px',
                    }}
                  >
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <CheckOutlined
                          style={{ color: '#52c41a', fontSize: 14 }}
                        />
                        <Text style={{ fontSize: 14 }}>{f}</Text>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type={plan.highlighted ? 'primary' : 'default'}
                    block
                    size="large"
                    onClick={() => navigate(`/register?plan=${plan.plan}`)}
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      <Footer
        style={{ textAlign: 'center', background: '#f0f2f5', color: '#888' }}
      >
        © {new Date().getFullYear()} Grant Thornton CRM. {t('landing.footerRights')}
      </Footer>
    </Layout>
  );
}

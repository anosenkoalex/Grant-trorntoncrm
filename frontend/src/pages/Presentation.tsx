import { useState, useEffect, ReactNode } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  BarChartOutlined,
  BellOutlined,
  FileOutlined,
  GlobalOutlined,
  LockOutlined,
  RocketOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  ApiOutlined,
  AuditOutlined,
  SettingOutlined,
  DollarOutlined,
  MobileOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18next from 'i18next';

const { Title, Text, Paragraph } = Typography;

const GT_RED = '#E8231A';
const GT_BLACK = '#1A1A1A';
const GT_LIGHT = '#F7F8FA';

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'tr', label: 'TR' },
  { value: 'ru', label: 'RU' },
];

const NAV_SECTIONS = [
  'overview',
  'problem',
  'assignments',
  'planner',
  'hr',
  'analytics',
  'automation',
  'notifications',
  'documents',
  'integrations',
  'profile',
  'multilingual',
  'audit',
  'orgsettings',
  'saas',
  'security',
  'tech',
  'roadmap',
  'cta',
];

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function SectionWrap({
  id,
  light = false,
  children,
}: {
  id: string;
  light?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      style={{
        background: light ? GT_LIGHT : '#fff',
        padding: '72px 0',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {children}
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  subtitle,
  accent = false,
}: {
  title: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 48 }}>
      <Title
        level={2}
        style={{
          color: accent ? GT_RED : GT_BLACK,
          marginBottom: subtitle ? 12 : 0,
        }}
      >
        {title}
      </Title>
      {subtitle && (
        <Paragraph
          style={{ color: '#666', fontSize: 17, maxWidth: 680, margin: '0 auto' }}
        >
          {subtitle}
        </Paragraph>
      )}
    </div>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item) => (
        <li
          key={item}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <CheckCircleOutlined style={{ color: GT_RED, marginTop: 3 }} />
          <Text style={{ fontSize: 15 }}>{item}</Text>
        </li>
      ))}
    </ul>
  );
}

function IconCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card
      bordered={false}
      style={{
        height: '100%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        borderTop: `3px solid ${GT_RED}`,
      }}
    >
      <div style={{ fontSize: 28, color: GT_RED, marginBottom: 12 }}>{icon}</div>
      <Title level={5} style={{ marginBottom: 6, color: GT_BLACK }}>
        {title}
      </Title>
      <Text type="secondary" style={{ fontSize: 14 }}>
        {desc}
      </Text>
    </Card>
  );
}

export default function PresentationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLang = (val: string) => {
    void i18next.changeLanguage(val);
    localStorage.setItem('lang', val);
  };

  const lang = i18n.language.slice(0, 2);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── STICKY HEADER ── */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#fff',
          borderBottom: scrolled ? '1px solid #eee' : '1px solid transparent',
          boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
        }}
      >
        {/* Logo */}
        <div
          style={{
            background: GT_RED,
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            padding: '4px 10px',
            borderRadius: 6,
            letterSpacing: 0.5,
            cursor: 'pointer',
            flexShrink: 0,
          }}
          onClick={() => scrollTo('overview')}
        >
          GT CRM
        </div>

        {/* Nav */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 4,
            overflow: 'hidden',
            flexWrap: 'nowrap',
          }}
        >
          {NAV_SECTIONS.slice(0, 10).map((s) => (
            <Button
              key={s}
              type="text"
              size="small"
              onClick={() => scrollTo(s)}
              style={{ fontSize: 13, color: '#555', flexShrink: 0 }}
            >
              {t(`presentation.nav${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
            </Button>
          ))}
        </div>

        {/* Lang + CTA */}
        <Space size={8} style={{ flexShrink: 0 }}>
          <Select
            size="small"
            value={lang}
            onChange={handleLang}
            options={LANG_OPTIONS}
            style={{ width: 68 }}
            variant="borderless"
          />
          <Button
            type="primary"
            size="small"
            style={{ background: GT_RED, borderColor: GT_RED }}
            onClick={() => navigate('/login')}
          >
            {t('presentation.tryDemo')}
          </Button>
        </Space>
      </header>

      {/* spacer for fixed header */}
      <div style={{ height: 64 }} />

      {/* ── 1. HERO / OVERVIEW ── */}
      <section
        id="overview"
        style={{
          background: `linear-gradient(135deg, ${GT_BLACK} 0%, #2d2d2d 100%)`,
          padding: '96px 24px 80px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Tag
            style={{
              background: 'rgba(232,35,26,0.2)',
              border: '1px solid rgba(232,35,26,0.5)',
              color: '#ff6b6b',
              marginBottom: 20,
              fontSize: 13,
              padding: '2px 12px',
            }}
          >
            {t('presentation.heroTag')}
          </Tag>
          <Title
            style={{
              color: '#fff',
              fontSize: 'clamp(32px, 5vw, 54px)',
              marginBottom: 20,
              lineHeight: 1.15,
            }}
          >
            {t('presentation.heroTitle')}
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 18,
              maxWidth: 640,
              margin: '0 auto 40px',
            }}
          >
            {t('presentation.heroSubtitle')}
          </Paragraph>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              size="large"
              style={{
                background: GT_RED,
                borderColor: GT_RED,
                color: '#fff',
                fontWeight: 600,
              }}
              onClick={() => navigate('/login')}
            >
              {t('presentation.tryDemo')}
            </Button>
            <Button
              size="large"
              ghost
              onClick={() => scrollTo('problem')}
            >
              {t('presentation.learnMore')}
            </Button>
          </Space>

          {/* Stats row */}
          <Row gutter={[32, 24]} style={{ marginTop: 64, textAlign: 'center' }}>
            {[
              { label: t('presentation.stat1Label'), value: t('presentation.stat1Value') },
              { label: t('presentation.stat2Label'), value: t('presentation.stat2Value') },
              { label: t('presentation.stat3Label'), value: t('presentation.stat3Value') },
              { label: t('presentation.stat4Label'), value: t('presentation.stat4Value') },
            ].map((s) => (
              <Col xs={12} sm={6} key={s.label}>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: GT_RED,
                    lineHeight: 1.1,
                  }}
                >
                  {s.value}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                  {s.label}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* ── 2. PROBLEM ── */}
      <SectionWrap id="problem" light>
        <SectionHeader
          title={t('presentation.problemTitle')}
          subtitle={t('presentation.problemSubtitle')}
          accent
        />
        <Row gutter={[24, 24]}>
          {[
            t('presentation.prob1'),
            t('presentation.prob2'),
            t('presentation.prob3'),
            t('presentation.prob4'),
            t('presentation.prob5'),
            t('presentation.prob6'),
          ].map((p) => (
            <Col xs={24} sm={12} md={8} key={p}>
              <Card
                bordered={false}
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%' }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
                <Text style={{ fontSize: 15 }}>{p}</Text>
              </Card>
            </Col>
          ))}
        </Row>
        <div
          style={{
            marginTop: 40,
            padding: '24px 32px',
            background: '#fff',
            border: `2px solid ${GT_RED}`,
            borderRadius: 12,
            textAlign: 'center',
          }}
        >
          <Text style={{ fontSize: 17, color: GT_BLACK, fontWeight: 600 }}>
            {t('presentation.problemSolution')}
          </Text>
        </div>
      </SectionWrap>

      {/* ── 3. ASSIGNMENTS ── */}
      <SectionWrap id="assignments">
        <Row gutter={[48, 32]} align="middle">
          <Col xs={24} md={12}>
            <SectionHeader
              title={t('presentation.assignTitle')}
              subtitle={t('presentation.assignSubtitle')}
            />
            <FeatureList
              items={[
                t('presentation.assignF1'),
                t('presentation.assignF2'),
                t('presentation.assignF3'),
                t('presentation.assignF4'),
                t('presentation.assignF5'),
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                background: GT_LIGHT,
                borderRadius: 16,
                padding: 8,
              }}
            >
              <div style={{ padding: '16px 0' }}>
                {[
                  { name: 'Иванов И.', place: 'Офис A1', date: '2026-06-01', status: 'active' },
                  { name: 'Петрова М.', place: 'Зал B2', date: '2026-06-02', status: 'active' },
                  { name: 'Сидоров К.', place: 'Офис A3', date: '2026-06-03', status: 'pending' },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      background: '#fff',
                      borderRadius: 8,
                      marginBottom: 8,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    <Space>
                      <UserOutlined style={{ color: GT_RED }} />
                      <Text strong>{row.name}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>{row.place}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{row.date}</Text>
                    <Tag color={row.status === 'active' ? 'green' : 'orange'}>
                      {row.status === 'active' ? t('presentation.active') : t('presentation.pending')}
                    </Tag>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 4. PLANNER ── */}
      <SectionWrap id="planner" light>
        <SectionHeader
          title={t('presentation.plannerTitle')}
          subtitle={t('presentation.plannerSubtitle')}
          accent
        />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={14}>
            {/* Fake matrix preview */}
            <Card
              bordered={false}
              style={{ borderRadius: 12, overflow: 'hidden' }}
            >
              <div
                style={{
                  overflowX: 'auto',
                  fontSize: 13,
                }}
              >
                <table
                  style={{
                    borderCollapse: 'collapse',
                    width: '100%',
                    minWidth: 420,
                  }}
                >
                  <thead>
                    <tr style={{ background: GT_BLACK }}>
                      <th
                        style={{
                          color: '#fff',
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontWeight: 600,
                        }}
                      >
                        {t('presentation.planEmployee')}
                      </th>
                      {['01', '02', '03', '04', '05'].map((d) => (
                        <th
                          key={d}
                          style={{
                            color: '#fff',
                            padding: '8px 10px',
                            textAlign: 'center',
                          }}
                        >
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Иванов И.', shifts: ['A1', '', 'A1', 'B2', ''] },
                      { name: 'Петрова М.', shifts: ['', 'B2', '', 'A3', 'B2'] },
                      { name: 'Сидоров К.', shifts: ['A3', 'A1', '', '', 'A1'] },
                    ].map((emp, i) => (
                      <tr
                        key={i}
                        style={{
                          background: i % 2 === 0 ? '#fff' : GT_LIGHT,
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            fontWeight: 500,
                            color: GT_BLACK,
                          }}
                        >
                          {emp.name}
                        </td>
                        {emp.shifts.map((s, j) => (
                          <td
                            key={j}
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                            }}
                          >
                            {s ? (
                              <span
                                style={{
                                  background: GT_RED,
                                  color: '#fff',
                                  borderRadius: 4,
                                  padding: '2px 6px',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {s}
                              </span>
                            ) : (
                              <span style={{ color: '#ccc' }}>—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <FeatureList
              items={[
                t('presentation.planF1'),
                t('presentation.planF2'),
                t('presentation.planF3'),
                t('presentation.planF4'),
                t('presentation.planF5'),
              ]}
            />
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 5. HR ── */}
      <SectionWrap id="hr">
        <SectionHeader
          title={t('presentation.hrTitle')}
          subtitle={t('presentation.hrSubtitle')}
        />
        <Row gutter={[24, 24]}>
          {[
            {
              icon: <CalendarOutlined />,
              title: t('presentation.hrCard1Title'),
              desc: t('presentation.hrCard1Desc'),
            },
            {
              icon: <CheckCircleOutlined />,
              title: t('presentation.hrCard2Title'),
              desc: t('presentation.hrCard2Desc'),
            },
            {
              icon: <BarChartOutlined />,
              title: t('presentation.hrCard3Title'),
              desc: t('presentation.hrCard3Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
        <div style={{ marginTop: 32 }}>
          <FeatureList
            items={[
              t('presentation.hrF1'),
              t('presentation.hrF2'),
              t('presentation.hrF3'),
              t('presentation.hrF4'),
            ]}
          />
        </div>
      </SectionWrap>

      {/* ── 6. ANALYTICS ── */}
      <SectionWrap id="analytics" light>
        <SectionHeader
          title={t('presentation.analyticsTitle')}
          subtitle={t('presentation.analyticsSubtitle')}
          accent
        />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureList
              items={[
                t('presentation.anlF1'),
                t('presentation.anlF2'),
                t('presentation.anlF3'),
                t('presentation.anlF4'),
                t('presentation.anlF5'),
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            {/* Fake KPI cards */}
            <Row gutter={[12, 12]}>
              {[
                { label: t('presentation.kpi1'), value: '94%', color: '#52c41a' },
                { label: t('presentation.kpi2'), value: '1,248', color: GT_RED },
                { label: t('presentation.kpi3'), value: '3,820', color: '#1677ff' },
                { label: t('presentation.kpi4'), value: '7', color: '#faad14' },
              ].map((kpi) => (
                <Col xs={12} key={kpi.label}>
                  <Card
                    bordered={false}
                    style={{
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: kpi.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {kpi.value}
                    </div>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {kpi.label}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 7. AUTOMATION ── */}
      <SectionWrap id="automation">
        <SectionHeader
          title={t('presentation.autoTitle')}
          subtitle={t('presentation.autoSubtitle')}
        />
        <Row gutter={[24, 24]}>
          {[
            {
              icon: <ThunderboltOutlined />,
              title: t('presentation.autoCard1Title'),
              desc: t('presentation.autoCard1Desc'),
            },
            {
              icon: <ClockCircleOutlined />,
              title: t('presentation.autoCard2Title'),
              desc: t('presentation.autoCard2Desc'),
            },
            {
              icon: <BellOutlined />,
              title: t('presentation.autoCard3Title'),
              desc: t('presentation.autoCard3Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 8. NOTIFICATIONS ── */}
      <SectionWrap id="notifications" light>
        <SectionHeader
          title={t('presentation.notifTitle')}
          subtitle={t('presentation.notifSubtitle')}
          accent
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              icon: <BellOutlined />,
              title: t('presentation.notifCard1Title'),
              desc: t('presentation.notifCard1Desc'),
            },
            {
              icon: <MobileOutlined />,
              title: t('presentation.notifCard2Title'),
              desc: t('presentation.notifCard2Desc'),
            },
            {
              icon: <GlobalOutlined />,
              title: t('presentation.notifCard3Title'),
              desc: t('presentation.notifCard3Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 9. DOCUMENTS ── */}
      <SectionWrap id="documents">
        <Row gutter={[48, 32]} align="middle">
          <Col xs={24} md={12}>
            <SectionHeader
              title={t('presentation.docsTitle')}
              subtitle={t('presentation.docsSubtitle')}
            />
            <FeatureList
              items={[
                t('presentation.docsF1'),
                t('presentation.docsF2'),
                t('presentation.docsF3'),
                t('presentation.docsF4'),
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{ background: GT_LIGHT, borderRadius: 16 }}
            >
              {[
                { name: 'contract_june.pdf', size: '2.4 MB', type: 'PDF' },
                { name: 'schedule_q2.xlsx', size: '840 KB', type: 'Excel' },
                { name: 'photo_id.jpg', size: '1.1 MB', type: 'Image' },
                { name: 'report_may.docx', size: '320 KB', type: 'Word' },
              ].map((f) => (
                <div
                  key={f.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    marginBottom: 8,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Space>
                    <FileOutlined style={{ color: GT_RED }} />
                    <Text style={{ fontSize: 14 }}>{f.name}</Text>
                  </Space>
                  <Space size={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{f.size}</Text>
                    <Tag>{f.type}</Tag>
                  </Space>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 10. INTEGRATIONS ── */}
      <SectionWrap id="integrations" light>
        <SectionHeader
          title={t('presentation.intTitle')}
          subtitle={t('presentation.intSubtitle')}
          accent
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              icon: <ApiOutlined />,
              title: t('presentation.intCard1Title'),
              desc: t('presentation.intCard1Desc'),
            },
            {
              icon: <CalendarOutlined />,
              title: t('presentation.intCard2Title'),
              desc: t('presentation.intCard2Desc'),
            },
            {
              icon: <MobileOutlined />,
              title: t('presentation.intCard3Title'),
              desc: t('presentation.intCard3Desc'),
            },
            {
              icon: <DollarOutlined />,
              title: t('presentation.intCard4Title'),
              desc: t('presentation.intCard4Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={12} md={6} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 11. MY PROFILE ── */}
      <SectionWrap id="profile">
        <SectionHeader
          title={t('presentation.profileTitle')}
          subtitle={t('presentation.profileSubtitle')}
        />
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <FeatureList
              items={[
                t('presentation.profileF1'),
                t('presentation.profileF2'),
                t('presentation.profileF3'),
                t('presentation.profileF4'),
                t('presentation.profileF5'),
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <Card
              bordered={false}
              style={{
                background: GT_LIGHT,
                borderRadius: 16,
                padding: '8px 0',
              }}
            >
              {[
                { label: t('presentation.profileFieldName'), value: 'Иванов Иван' },
                { label: t('presentation.profileFieldEmail'), value: 'ivan@company.com' },
                { label: t('presentation.profileFieldRole'), value: t('presentation.profileRoleWorker') },
                { label: t('presentation.profileFieldShifts'), value: '12 / 24' },
                { label: t('presentation.profileFieldHours'), value: '96 ч.' },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 20px',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {row.label}
                  </Text>
                  <Text strong style={{ fontSize: 14 }}>
                    {row.value}
                  </Text>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 12. MULTILINGUAL ── */}
      <SectionWrap id="multilingual" light>
        <SectionHeader
          title={t('presentation.mlTitle')}
          subtitle={t('presentation.mlSubtitle')}
          accent
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              lang: '🇷🇺 Русский',
              example: 'Добро пожаловать в GT CRM',
              tag: 'RU',
            },
            {
              lang: '🇬🇧 English',
              example: 'Welcome to GT CRM',
              tag: 'EN',
            },
            {
              lang: '🇹🇷 Türkçe',
              example: "GT CRM'e Hoş Geldiniz",
              tag: 'TR',
            },
          ].map((l) => (
            <Col xs={24} sm={8} key={l.tag}>
              <Card
                bordered={false}
                style={{
                  textAlign: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  borderTop: `3px solid ${GT_RED}`,
                  height: '100%',
                }}
              >
                <Tag
                  style={{
                    background: GT_RED,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                >
                  {l.tag}
                </Tag>
                <Title level={5} style={{ marginBottom: 8 }}>
                  {l.lang}
                </Title>
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  {l.example}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
        <Paragraph
          style={{
            textAlign: 'center',
            marginTop: 32,
            color: '#666',
            fontSize: 15,
          }}
        >
          {t('presentation.mlNote')}
        </Paragraph>
      </SectionWrap>

      {/* ── 13. AUDIT LOG ── */}
      <SectionWrap id="audit">
        <SectionHeader
          title={t('presentation.auditTitle')}
          subtitle={t('presentation.auditSubtitle')}
        />
        <Row gutter={[48, 32]} align="middle">
          <Col xs={24} md={14}>
            <Card bordered={false} style={{ borderRadius: 12, overflow: 'hidden' }}>
              {[
                {
                  date: '15.05.2026 10:31',
                  user: 'admin@grantthornton.local',
                  action: 'CREATE',
                  entity: t('presentation.auditEntityAssign'),
                  color: 'green',
                },
                {
                  date: '15.05.2026 10:28',
                  user: 'admin@grantthornton.local',
                  action: 'UPDATE',
                  entity: t('presentation.auditEntityUser'),
                  color: 'blue',
                },
                {
                  date: '15.05.2026 10:15',
                  user: 'manager@company.com',
                  action: 'APPROVE',
                  entity: t('presentation.auditEntityVacation'),
                  color: 'cyan',
                },
                {
                  date: '15.05.2026 09:55',
                  user: 'admin@grantthornton.local',
                  action: 'DELETE',
                  entity: t('presentation.auditEntityWorkplace'),
                  color: 'red',
                },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12, minWidth: 130 }}>
                    {row.date}
                  </Text>
                  <Text style={{ fontSize: 13, flex: 1 }}>{row.user}</Text>
                  <Tag color={row.color}>{row.action}</Tag>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {row.entity}
                  </Text>
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} md={10}>
            <FeatureList
              items={[
                t('presentation.auditF1'),
                t('presentation.auditF2'),
                t('presentation.auditF3'),
                t('presentation.auditF4'),
              ]}
            />
          </Col>
        </Row>
      </SectionWrap>

      {/* ── 14. ORG SETTINGS ── */}
      <SectionWrap id="orgsettings" light>
        <SectionHeader
          title={t('presentation.orgTitle')}
          subtitle={t('presentation.orgSubtitle')}
          accent
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              icon: <SettingOutlined />,
              title: t('presentation.orgCard1Title'),
              desc: t('presentation.orgCard1Desc'),
            },
            {
              icon: <TeamOutlined />,
              title: t('presentation.orgCard2Title'),
              desc: t('presentation.orgCard2Desc'),
            },
            {
              icon: <SafetyOutlined />,
              title: t('presentation.orgCard3Title'),
              desc: t('presentation.orgCard3Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={8} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 15. SaaS / PRICING ── */}
      <SectionWrap id="saas">
        <SectionHeader
          title={t('presentation.saasTitle')}
          subtitle={t('presentation.saasSubtitle')}
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              name: t('presentation.saasPlan1'),
              price: '$29',
              features: [
                t('presentation.saasPlan1F1'),
                t('presentation.saasPlan1F2'),
                t('presentation.saasPlan1F3'),
              ],
              highlight: false,
            },
            {
              name: t('presentation.saasPlan2'),
              price: '$99',
              features: [
                t('presentation.saasPlan2F1'),
                t('presentation.saasPlan2F2'),
                t('presentation.saasPlan2F3'),
              ],
              highlight: true,
            },
            {
              name: t('presentation.saasPlan3'),
              price: '$299',
              features: [
                t('presentation.saasPlan3F1'),
                t('presentation.saasPlan3F2'),
                t('presentation.saasPlan3F3'),
              ],
              highlight: false,
            },
          ].map((plan) => (
            <Col xs={24} sm={8} key={plan.name}>
              <Card
                bordered={plan.highlight}
                style={{
                  textAlign: 'center',
                  borderColor: plan.highlight ? GT_RED : undefined,
                  boxShadow: plan.highlight
                    ? `0 4px 24px rgba(232,35,26,0.15)`
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
              >
                <Text
                  strong
                  style={{
                    fontSize: 17,
                    color: plan.highlight ? GT_RED : GT_BLACK,
                  }}
                >
                  {plan.name}
                </Text>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: GT_RED,
                    margin: '8px 0 4px',
                  }}
                >
                  {plan.price}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {t('presentation.perMonth')}
                </Text>
                <div style={{ marginTop: 16 }}>
                  <FeatureList items={plan.features} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 16. SECURITY ── */}
      <SectionWrap id="security" light>
        <SectionHeader
          title={t('presentation.secTitle')}
          subtitle={t('presentation.secSubtitle')}
          accent
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            {
              icon: <LockOutlined />,
              title: t('presentation.secCard1Title'),
              desc: t('presentation.secCard1Desc'),
            },
            {
              icon: <SafetyOutlined />,
              title: t('presentation.secCard2Title'),
              desc: t('presentation.secCard2Desc'),
            },
            {
              icon: <AuditOutlined />,
              title: t('presentation.secCard3Title'),
              desc: t('presentation.secCard3Desc'),
            },
            {
              icon: <GlobalOutlined />,
              title: t('presentation.secCard4Title'),
              desc: t('presentation.secCard4Desc'),
            },
          ].map((c) => (
            <Col xs={24} sm={12} md={6} key={c.title}>
              <IconCard icon={c.icon} title={c.title} desc={c.desc} />
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 17. TECHNOLOGIES ── */}
      <SectionWrap id="tech">
        <SectionHeader
          title={t('presentation.techTitle')}
          subtitle={t('presentation.techSubtitle')}
        />
        <Row gutter={[24, 24]} justify="center">
          {[
            { name: 'React 18', desc: t('presentation.techReact') },
            { name: 'NestJS', desc: t('presentation.techNest') },
            { name: 'PostgreSQL', desc: t('presentation.techPg') },
            { name: 'Prisma ORM', desc: t('presentation.techPrisma') },
            { name: 'Ant Design', desc: t('presentation.techAntd') },
            { name: 'TypeScript', desc: t('presentation.techTs') },
          ].map((tech) => (
            <Col xs={12} sm={8} md={4} key={tech.name}>
              <Card
                bordered={false}
                style={{
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  height: '100%',
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 15,
                    color: GT_BLACK,
                    marginBottom: 6,
                  }}
                >
                  {tech.name}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {tech.desc}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 18. ROADMAP ── */}
      <SectionWrap id="roadmap" light>
        <SectionHeader
          title={t('presentation.roadTitle')}
          subtitle={t('presentation.roadSubtitle')}
          accent
        />
        <Row gutter={[24, 24]}>
          {[
            {
              quarter: 'Q2 2026',
              items: [
                t('presentation.road1I1'),
                t('presentation.road1I2'),
                t('presentation.road1I3'),
              ],
              done: true,
            },
            {
              quarter: 'Q3 2026',
              items: [
                t('presentation.road2I1'),
                t('presentation.road2I2'),
                t('presentation.road2I3'),
              ],
              done: false,
            },
            {
              quarter: 'Q4 2026',
              items: [
                t('presentation.road3I1'),
                t('presentation.road3I2'),
                t('presentation.road3I3'),
              ],
              done: false,
            },
          ].map((phase) => (
            <Col xs={24} sm={8} key={phase.quarter}>
              <Card
                bordered={false}
                style={{
                  height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  borderTop: `3px solid ${phase.done ? '#52c41a' : GT_RED}`,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16, color: GT_BLACK }}>
                    {phase.quarter}
                  </Text>
                  {phase.done && (
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      {t('presentation.roadDone')}
                    </Tag>
                  )}
                </div>
                <FeatureList items={phase.items} />
              </Card>
            </Col>
          ))}
        </Row>
      </SectionWrap>

      {/* ── 19. CTA ── */}
      <section
        id="cta"
        style={{
          background: `linear-gradient(135deg, ${GT_RED} 0%, #c41a12 100%)`,
          padding: '80px 24px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <RocketOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 24 }} />
          <Title
            style={{
              color: '#fff',
              fontSize: 'clamp(26px, 4vw, 42px)',
              marginBottom: 16,
            }}
          >
            {t('presentation.ctaTitle')}
          </Title>
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: 17,
              marginBottom: 36,
            }}
          >
            {t('presentation.ctaSubtitle')}
          </Paragraph>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              size="large"
              style={{
                background: '#fff',
                color: GT_RED,
                borderColor: '#fff',
                fontWeight: 700,
              }}
              onClick={() => navigate('/login')}
            >
              {t('presentation.ctaTryBtn')}
            </Button>
            <Button
              size="large"
              ghost
              style={{ borderColor: 'rgba(255,255,255,0.7)', color: '#fff' }}
              onClick={() => navigate('/register')}
            >
              {t('presentation.ctaRegBtn')}
            </Button>
          </Space>
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 13,
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            {t('presentation.ctaNote')}
          </Paragraph>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: GT_BLACK,
          color: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          padding: '20px 24px',
          fontSize: 13,
        }}
      >
        © {new Date().getFullYear()} Grant Thornton CRM.{' '}
        {t('presentation.footerRights')}
      </footer>
    </div>
  );
}

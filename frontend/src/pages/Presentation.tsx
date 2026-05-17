import {
  Alert,
  Anchor,
  Button,
  Card,
  Col,
  Collapse,
  ConfigProvider,
  Descriptions,
  Grid,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  BellOutlined,
  CalendarOutlined,
  LockOutlined,
  SafetyOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  AuditOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import i18next from 'i18next';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const GT_RED = '#E8231A';

const LANG_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'tr', label: 'TR' },
  { value: 'ru', label: 'RU' },
];

const NAV_SECTIONS = [
  { id: 'overview', navKey: 'navOverview' },
  { id: 'assignments', navKey: 'navAssignments' },
  { id: 'planner', navKey: 'navPlanner' },
  { id: 'hr', navKey: 'navHr' },
  { id: 'analytics', navKey: 'navAnalytics' },
  { id: 'automation', navKey: 'navAutomation' },
  { id: 'integrations', navKey: 'navIntegrations' },
  { id: 'saas', navKey: 'navSaas' },
  { id: 'security', navKey: 'navSecurity' },
  { id: 'roadmap', navKey: 'navRoadmap' },
];

const SECTION: React.CSSProperties = { marginBottom: 24, scrollMarginTop: 80 };

const check = <CheckOutlined style={{ color: '#52c41a' }} />;
const dash = <Text type="secondary">—</Text>;

export default function PresentationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language.slice(0, 2);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const handleLang = (val: string) => {
    void i18next.changeLanguage(val);
    localStorage.setItem('lang', val);
  };

  // ── PRICING TABLE ──────────────────────────────────────────
  const pricingColumns = [
    {
      title: '',
      dataIndex: 'feature',
      key: 'feature',
      width: 220,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: () => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{t('presentation.saasPlan1')}</div>
          <div style={{ color: GT_RED, fontWeight: 800, fontSize: 20 }}>
            $29<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
          </div>
        </div>
      ),
      dataIndex: 'starter',
      key: 'starter',
      align: 'center' as const,
    },
    {
      title: () => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{t('presentation.saasPlan2')}</div>
          <div style={{ color: GT_RED, fontWeight: 800, fontSize: 20 }}>
            $99<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
          </div>
          <Tag color="error" style={{ fontSize: 11 }}>
            Popular
          </Tag>
        </div>
      ),
      dataIndex: 'business',
      key: 'business',
      align: 'center' as const,
    },
    {
      title: () => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>{t('presentation.saasPlan3')}</div>
          <div style={{ color: GT_RED, fontWeight: 800, fontSize: 20 }}>
            $299<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span>
          </div>
        </div>
      ),
      dataIndex: 'enterprise',
      key: 'enterprise',
      align: 'center' as const,
    },
  ];

  const pricingData = [
    {
      key: '1',
      feature: t('presentation.saasPlan1F1'),
      starter: 'до 25',
      business: 'до 200',
      enterprise: '∞',
    },
    {
      key: '2',
      feature: t('presentation.saasPlan1F2'),
      starter: check,
      business: check,
      enterprise: check,
    },
    {
      key: '3',
      feature: t('presentation.saasPlan1F3'),
      starter: check,
      business: check,
      enterprise: check,
    },
    {
      key: '4',
      feature: t('presentation.saasPlan2F1'),
      starter: dash,
      business: check,
      enterprise: check,
    },
    {
      key: '5',
      feature: t('presentation.saasPlan2F2'),
      starter: dash,
      business: check,
      enterprise: check,
    },
    {
      key: '6',
      feature: t('presentation.saasPlan2F3'),
      starter: dash,
      business: check,
      enterprise: check,
    },
    {
      key: '7',
      feature: t('presentation.saasPlan3F1'),
      starter: dash,
      business: dash,
      enterprise: check,
    },
    {
      key: '8',
      feature: t('presentation.saasPlan3F2'),
      starter: dash,
      business: dash,
      enterprise: check,
    },
    {
      key: '9',
      feature: t('presentation.saasPlan3F3'),
      starter: dash,
      business: dash,
      enterprise: check,
    },
  ];

  // ── AUDIT LOG TABLE ────────────────────────────────────────
  const auditCols = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (v: string) => <Text type="secondary">{v}</Text>,
    },
    { title: 'Пользователь', dataIndex: 'user', key: 'user' },
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => {
        const m: Record<string, string> = {
          CREATE: 'success',
          UPDATE: 'processing',
          DELETE: 'error',
          APPROVE: 'cyan',
          REJECT: 'orange',
        };
        return <Tag color={m[v] ?? 'default'}>{v}</Tag>;
      },
    },
    {
      title: 'Сущность',
      dataIndex: 'entity',
      key: 'entity',
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: 'Детали',
      dataIndex: 'details',
      key: 'details',
      render: (v: string) => <Text type="secondary">{v}</Text>,
    },
  ];

  const auditRows = [
    {
      key: '1',
      date: '16.05.2026 10:31',
      user: 'admin@grantthornton.local',
      action: 'CREATE',
      entity: t('presentation.auditEntityAssign'),
      details: 'Иванов И. → Офис A1, 01.06–30.06',
    },
    {
      key: '2',
      date: '16.05.2026 10:15',
      user: 'manager@company.com',
      action: 'APPROVE',
      entity: t('presentation.auditEntityVacation'),
      details: 'Петрова М., отпуск 10.06–24.06',
    },
    {
      key: '3',
      date: '16.05.2026 09:55',
      user: 'admin@grantthornton.local',
      action: 'UPDATE',
      entity: t('presentation.auditEntityUser'),
      details: 'Сидоров К.: должность обновлена',
    },
    {
      key: '4',
      date: '16.05.2026 09:40',
      user: 'admin@grantthornton.local',
      action: 'DELETE',
      entity: t('presentation.auditEntityWorkplace'),
      details: 'Зал C5 — удалено',
    },
    {
      key: '5',
      date: '15.05.2026 18:00',
      user: 'manager@company.com',
      action: 'REJECT',
      entity: t('presentation.auditEntityVacation'),
      details: 'Иванов И., комментарий: занятость',
    },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: GT_RED } }}>
      {/* ── FIXED HEADER ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {/* Top row: logo + controls */}
        <div
          style={{
            padding: isMobile ? '0 12px' : '0 32px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 8 : 24,
          }}
        >
          <Title
            level={5}
            style={{
              color: GT_RED,
              margin: 0,
              flexShrink: 0,
              cursor: 'pointer',
              fontSize: isMobile ? 13 : undefined,
              whiteSpace: 'nowrap',
            }}
            onClick={() =>
              document
                .getElementById('overview')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            {isMobile ? 'GT CRM' : 'Grant Thornton CRM'}
          </Title>

          {!isMobile && (
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <Anchor
                direction="horizontal"
                targetOffset={48}
                items={NAV_SECTIONS.map((s) => ({
                  key: s.id,
                  href: `#${s.id}`,
                  title: t(`presentation.${s.navKey}`),
                }))}
                style={{ fontSize: 13 }}
              />
            </div>
          )}

          <Space size={8} style={{ flexShrink: 0, marginLeft: 'auto' }}>
            <Select
              size="small"
              value={lang}
              onChange={handleLang}
              options={LANG_OPTIONS}
              style={{ width: 68 }}
              variant="borderless"
            />
            <Button type="primary" size="small" onClick={() => navigate('/')}>
              {t('presentation.tryDemo')}
            </Button>
          </Space>
        </div>

        {/* Mobile nav row: horizontally scrollable */}
        {isMobile && (
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderTop: '1px solid #f5f5f5',
            }}
          >
            <Anchor
              direction="horizontal"
              targetOffset={96}
              items={NAV_SECTIONS.map((s) => ({
                key: s.id,
                href: `#${s.id}`,
                title: t(`presentation.${s.navKey}`),
              }))}
              style={{ fontSize: 12, whiteSpace: 'nowrap', padding: '0 4px' }}
            />
          </div>
        )}
      </div>

      {/* ── PAGE CONTENT ── */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: isMobile ? '96px 12px 48px' : '80px 24px 64px',
        }}
      >
        {/* ═══════════════════════════════════════════════════
            1. OVERVIEW
        ═══════════════════════════════════════════════════ */}
        <div id="overview" style={SECTION}>
          <Card
            title={
              <Title level={3} style={{ color: GT_RED, margin: 0 }}>
                {t('presentation.heroTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.heroSubtitle')}
              showIcon
              style={{ marginBottom: 20 }}
            />
            <Descriptions
              bordered
              size="small"
              column={{ xs: 2, sm: 2, md: 4 }}
            >
              <Descriptions.Item label={t('presentation.stat1Label')}>
                <Text strong style={{ color: GT_RED, fontSize: 18 }}>
                  {t('presentation.stat1Value')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('presentation.stat2Label')}>
                <Text strong style={{ color: GT_RED, fontSize: 18 }}>
                  {t('presentation.stat2Value')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('presentation.stat3Label')}>
                <Text strong style={{ color: GT_RED, fontSize: 18 }}>
                  {t('presentation.stat3Value')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('presentation.stat4Label')}>
                <Text strong style={{ color: GT_RED, fontSize: 18 }}>
                  {t('presentation.stat4Value')}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Alert
              type="success"
              message={t('presentation.heroTag')}
              showIcon
              icon={<RocketOutlined />}
              style={{ marginTop: 16 }}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            2. PROBLEM
        ═══════════════════════════════════════════════════ */}
        <div id="problem" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.problemTitle')}
              </Title>
            }
          >
            <Alert
              type="warning"
              message={t('presentation.problemSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                t('presentation.prob1'),
                t('presentation.prob2'),
                t('presentation.prob3'),
                t('presentation.prob4'),
                t('presentation.prob5'),
                t('presentation.prob6'),
              ].map((prob, i) => ({
                key: String(i + 1),
                label: prob,
                children: (
                  <Paragraph type="secondary" style={{ margin: 0 }}>
                    {prob}
                  </Paragraph>
                ),
              }))}
            />
            <Alert
              type="success"
              message={t('presentation.problemSolution')}
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 16 }}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            3. ASSIGNMENTS
        ═══════════════════════════════════════════════════ */}
        <div id="assignments" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.assignTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.assignSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              defaultActiveKey={['fields']}
              items={[
                {
                  key: 'fields',
                  label: 'Поля назначения',
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Сотрудник">
                        Выбор из списка пользователей организации
                      </Descriptions.Item>
                      <Descriptions.Item label="Рабочее место">
                        Активное место с кодом и цветом
                      </Descriptions.Item>
                      <Descriptions.Item label="Период">
                        Дата начала и окончания назначения
                      </Descriptions.Item>
                      <Descriptions.Item label="Тип смены">
                        <Space wrap>
                          <Tag color="blue">OFFICE</Tag>
                          <Tag color="green">REMOTE</Tag>
                          <Tag color="orange">FIELD</Tag>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Статус" span={2}>
                        <Space wrap>
                          <Tag color="success">Активное</Tag>
                          <Tag color="default">Завершено</Tag>
                          <Tag color="error">Удалено (корзина)</Tag>
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'features',
                  label: 'Дополнительные функции',
                  children: (
                    <Row gutter={[16, 8]}>
                      {[
                        t('presentation.assignF1'),
                        t('presentation.assignF2'),
                        t('presentation.assignF3'),
                        t('presentation.assignF4'),
                        t('presentation.assignF5'),
                      ].map((f) => (
                        <Col xs={24} sm={12} key={f}>
                          <Space>
                            <CheckCircleOutlined style={{ color: GT_RED }} />
                            <Text>{f}</Text>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  ),
                },
                {
                  key: 'views',
                  label: 'Режимы и фильтры',
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Переключатель вида">
                        <Tag>Активные</Tag>
                        <Tag>Корзина</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Фильтры">
                        По сотруднику, рабочему месту, дате, типу смены
                      </Descriptions.Item>
                      <Descriptions.Item label="Экспорт">
                        Таблица с пагинацией, 20 записей на страницу
                      </Descriptions.Item>
                      <Descriptions.Item label="Запросы корректировок">
                        Сотрудник подаёт запрос, менеджер одобряет/отклоняет
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            4. PLANNER
        ═══════════════════════════════════════════════════ */}
        <div id="planner" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.plannerTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.plannerSubtitle')}
              style={{ marginBottom: 20 }}
            />
            <Row gutter={[24, 16]}>
              <Col xs={24} md={14}>
                <Collapse
                  items={[
                    {
                      key: 'matrix',
                      label: 'Матрица планировщика',
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="Ось Y">
                            Сотрудники или рабочие места (переключение)
                          </Descriptions.Item>
                          <Descriptions.Item label="Ось X">
                            Дни месяца
                          </Descriptions.Item>
                          <Descriptions.Item label="Ячейки">
                            Назначения: код места, тип смены, цвет
                          </Descriptions.Item>
                          <Descriptions.Item label="Счётчик сотрудников">
                            Показывает N первых + «ещё X»
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                    {
                      key: 'filters',
                      label: 'Навигация и фильтрация',
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="Период">
                            Выбор месяца и года через DatePicker
                          </Descriptions.Item>
                          <Descriptions.Item label="Поиск">
                            По имени сотрудника или коду места
                          </Descriptions.Item>
                          <Descriptions.Item label="Изоляция">
                            Данные строго по своей организации (orgId)
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                    {
                      key: 'export',
                      label: 'Экспорт Excel',
                      children: (
                        <Space direction="vertical">
                          <Text>{t('presentation.planF4')}</Text>
                          <Alert
                            type="success"
                            message="Матрица выгружается в .xlsx с сохранением цветов и форматирования"
                            showIcon
                          />
                        </Space>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col xs={24} md={10}>
                <Card
                  size="small"
                  title="Рабочий процесс планировщика"
                  style={{ borderTop: `3px solid ${GT_RED}` }}
                >
                  <Steps
                    direction="vertical"
                    size="small"
                    current={-1}
                    items={[
                      {
                        title: t('presentation.planF1'),
                        description: 'Матрица по сотрудникам или местам',
                      },
                      {
                        title: t('presentation.planF2'),
                        description: 'Навигация по месяцам',
                      },
                      {
                        title: t('presentation.planF3'),
                        description: 'Анализ загрузки',
                      },
                      {
                        title: t('presentation.planF5'),
                        description: 'Экспорт в Excel',
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            5. HR
        ═══════════════════════════════════════════════════ */}
        <div id="hr" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.hrTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.hrSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              defaultActiveKey={['types']}
              items={[
                {
                  key: 'types',
                  label: 'Типы заявок',
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item
                        label={<Tag color="blue">VACATION</Tag>}
                      >
                        Ежегодный оплачиваемый отпуск с диапазоном дат
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={<Tag color="orange">SICK_LEAVE</Tag>}
                      >
                        Больничный лист — открытая или фиксированная дата
                      </Descriptions.Item>
                      <Descriptions.Item
                        label={<Tag color="green">DAY_OFF</Tag>}
                      >
                        Отгул — отдельный день
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'statuses',
                  label: 'Статусы согласования',
                  children: (
                    <Space wrap>
                      <Tag color="warning">PENDING — на рассмотрении</Tag>
                      <Tag color="success">APPROVED — одобрено</Tag>
                      <Tag color="error">
                        REJECTED — отклонено (с комментарием)
                      </Tag>
                    </Space>
                  ),
                },
                {
                  key: 'workflow',
                  label: 'Процесс согласования',
                  children: (
                    <Steps
                      size="small"
                      current={-1}
                      items={[
                        {
                          title: 'Сотрудник',
                          description: 'Создаёт заявку: тип, даты, комментарий',
                        },
                        {
                          title: 'Уведомление',
                          description: 'Система уведомляет менеджера',
                        },
                        {
                          title: 'Менеджер',
                          description: 'Одобряет или отклоняет с комментарием',
                        },
                        {
                          title: 'Ответ',
                          description:
                            'Сотрудник получает уведомление о решении',
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: 'calendar',
                  label: 'Календарь команды',
                  children: (
                    <Row gutter={[16, 8]}>
                      {[
                        t('presentation.hrF1'),
                        t('presentation.hrF2'),
                        t('presentation.hrF3'),
                        t('presentation.hrF4'),
                      ].map((f) => (
                        <Col xs={24} sm={12} key={f}>
                          <Space>
                            <CalendarOutlined style={{ color: GT_RED }} />
                            <Text>{f}</Text>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            6. ANALYTICS
        ═══════════════════════════════════════════════════ */}
        <div id="analytics" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.analyticsTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.analyticsSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[24, 16]}>
              <Col xs={24} md={14}>
                <Collapse
                  defaultActiveKey={['kpi']}
                  items={[
                    {
                      key: 'kpi',
                      label: 'KPI дашборд',
                      children: (
                        <Descriptions bordered size="small" column={2}>
                          <Descriptions.Item label={t('presentation.kpi1')}>
                            <Text strong style={{ color: '#52c41a' }}>
                              94%
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('presentation.kpi2')}>
                            <Text strong style={{ color: GT_RED }}>
                              1 248 ч.
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('presentation.kpi3')}>
                            <Text strong style={{ color: '#1677ff' }}>
                              3 820 ч.
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('presentation.kpi4')}>
                            <Text strong style={{ color: '#faad14' }}>
                              7
                            </Text>
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                    {
                      key: 'features',
                      label: 'Функциональность',
                      children: (
                        <Row gutter={[16, 8]}>
                          {[
                            t('presentation.anlF1'),
                            t('presentation.anlF2'),
                            t('presentation.anlF3'),
                            t('presentation.anlF4'),
                            t('presentation.anlF5'),
                          ].map((f) => (
                            <Col xs={24} sm={12} key={f}>
                              <Space>
                                <BarChartOutlined style={{ color: GT_RED }} />
                                <Text>{f}</Text>
                              </Space>
                            </Col>
                          ))}
                        </Row>
                      ),
                    },
                    {
                      key: 'filters',
                      label: 'Фильтрация и экспорт',
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="Период">
                            Произвольный диапазон дат (DatePicker)
                          </Descriptions.Item>
                          <Descriptions.Item label="Фильтр">
                            По сотрудникам, рабочим местам, типу смены
                          </Descriptions.Item>
                          <Descriptions.Item label="CSV экспорт">
                            Выгрузка всей сводки в CSV одной кнопкой
                          </Descriptions.Item>
                          <Descriptions.Item label="Сводка по местам">
                            Плановые ч. / отчётные ч. / % выполнения / смены
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                  ]}
                />
              </Col>
              <Col xs={24} md={10}>
                <Alert
                  type="success"
                  showIcon
                  icon={<BarChartOutlined />}
                  message="График динамики"
                  description="Линейный график плановых vs отчётных часов по дням периода (recharts)"
                  style={{ marginBottom: 12 }}
                />
                <Alert
                  type="info"
                  showIcon
                  message="Рабочие отчёты"
                  description="Каждый сотрудник заполняет фактические часы — видно расхождение план/факт"
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            7. AUTOMATION
        ═══════════════════════════════════════════════════ */}
        <div id="automation" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.autoTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.autoSubtitle')}
              style={{ marginBottom: 20 }}
            />
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Card
                  size="small"
                  title="Поток уведомления"
                  style={{ borderTop: `3px solid ${GT_RED}` }}
                >
                  <Timeline
                    items={[
                      {
                        color: GT_RED,
                        dot: <ThunderboltOutlined />,
                        children: (
                          <div>
                            <Text strong>Триггер события</Text>
                            <br />
                            <Text type="secondary">
                              Назначение создано / обновлено / отменено
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        children: (
                          <div>
                            <Text strong>Проверка настроек</Text>
                            <br />
                            <Text type="secondary">
                              Включён ли данный тип уведомления для орг.
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        dot: <BellOutlined />,
                        children: (
                          <div>
                            <Text strong>Отправка уведомления</Text>
                            <br />
                            <Text type="secondary">
                              Системное + Telegram (если настроен)
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <Text strong>Запись в лог</Text>
                            <br />
                            <Text type="secondary">
                              NotificationLog: канал, тип, получатель
                            </Text>
                          </div>
                        ),
                      },
                      {
                        color: 'gray',
                        dot: <ClockCircleOutlined />,
                        children: (
                          <div>
                            <Text strong>SLA Cron (каждый час)</Text>
                            <br />
                            <Text type="secondary">
                              Напоминание за N часов до начала смены
                            </Text>
                          </div>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Collapse
                  items={[
                    {
                      key: 'triggers',
                      label: t('presentation.autoCard1Title'),
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="При создании">
                            Уведомление сотруднику о новом назначении
                          </Descriptions.Item>
                          <Descriptions.Item label="При обновлении">
                            Уведомление об изменении расписания
                          </Descriptions.Item>
                          <Descriptions.Item label="При отмене">
                            Уведомление об отмене назначения
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                    {
                      key: 'sla',
                      label: t('presentation.autoCard2Title'),
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="Cron расписание">
                            Каждый час: <Tag>0 * * * *</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Настройка">
                            Порог в часах до начала (например, 24 ч.)
                          </Descriptions.Item>
                          <Descriptions.Item label="Трекинг">
                            Поле <Tag>reminderSentAt</Tag> — не повторяет
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                    {
                      key: 'log',
                      label: 'Лог уведомлений',
                      children: (
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="Таблица">
                            NotificationLog: дата, тип, канал, получатель
                          </Descriptions.Item>
                          <Descriptions.Item label="Каналы">
                            <Tag>SYSTEM</Tag> <Tag>TELEGRAM</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Доступ">
                            SUPER_ADMIN и MANAGER в разделе Automation
                          </Descriptions.Item>
                        </Descriptions>
                      ),
                    },
                  ]}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            8. NOTIFICATIONS
        ═══════════════════════════════════════════════════ */}
        <div id="notifications" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.notifTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.notifSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                {
                  key: 'system',
                  label: (
                    <Space>
                      <BellOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.notifCard1Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Отображение">
                        Badge с счётчиком непрочитанных в шапке
                      </Descriptions.Item>
                      <Descriptions.Item label="Дропдаун">
                        Список последних уведомлений, клик = прочитано
                      </Descriptions.Item>
                      <Descriptions.Item label="Типы">
                        <Tag>ASSIGNMENT</Tag> <Tag>REMINDER</Tag>{' '}
                        <Tag>SYSTEM</Tag> <Tag>VACATION</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Обновление">
                        Автополинг каждые 30 секунд
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'telegram',
                  label: (
                    <Space>
                      <GlobalOutlined style={{ color: '#0088cc' }} />
                      <span>{t('presentation.notifCard2Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Настройка">
                        Bot Token + Chat ID в Developer Console
                      </Descriptions.Item>
                      <Descriptions.Item label="Формат">
                        HTML-разметка: жирный, курсив, ссылки
                      </Descriptions.Item>
                      <Descriptions.Item label="Тест">
                        Кнопка «Отправить тест» прямо из настроек
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'email',
                  label: (
                    <Space>
                      <GlobalOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.notifCard3Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Welcome Email">
                        Отправляется после оплаты и создания аккаунта
                      </Descriptions.Item>
                      <Descriptions.Item label="SMTP">
                        Настраивается через переменные окружения
                      </Descriptions.Item>
                      <Descriptions.Item label="Содержание">
                        Логин, ссылка на систему, название плана
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            9. DOCUMENTS
        ═══════════════════════════════════════════════════ */}
        <div id="documents" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.docsTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.docsSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                {
                  key: 'upload',
                  label: 'Загрузка файлов',
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Интерфейс">
                        Drag & Drop зона или клик для выбора файла
                      </Descriptions.Item>
                      <Descriptions.Item label="Ограничение">
                        Максимум 20 МБ на файл
                      </Descriptions.Item>
                      <Descriptions.Item label="Привязка">
                        К конкретному назначению (AssignmentFile)
                      </Descriptions.Item>
                      <Descriptions.Item label="Иконки">
                        Автоматически по MIME-типу (PDF / изображение / Excel /
                        Word)
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'formats',
                  label: 'Поддерживаемые форматы',
                  children: (
                    <Space wrap>
                      {[
                        'PDF',
                        'XLSX / XLS',
                        'DOCX / DOC',
                        'JPG / PNG',
                        'GIF',
                        'TXT',
                        'ZIP',
                        'CSV',
                        'любой файл',
                      ].map((f) => (
                        <Tag key={f} icon={<FileTextOutlined />}>
                          {f}
                        </Tag>
                      ))}
                    </Space>
                  ),
                },
                {
                  key: 'manage',
                  label: 'Управление файлами',
                  children: (
                    <Row gutter={[16, 8]}>
                      {[
                        t('presentation.docsF1'),
                        t('presentation.docsF2'),
                        t('presentation.docsF3'),
                        t('presentation.docsF4'),
                      ].map((f) => (
                        <Col xs={24} sm={12} key={f}>
                          <Space>
                            <CheckCircleOutlined style={{ color: GT_RED }} />
                            <Text>{f}</Text>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  ),
                },
              ]}
            />
            <Alert
              type="success"
              showIcon
              message="Скачивание файлов — авторизованный стриминг через GET /files/:id"
              style={{ marginTop: 12 }}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            10. INTEGRATIONS
        ═══════════════════════════════════════════════════ */}
        <div id="integrations" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.intTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.intSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                {
                  key: 'api',
                  label: (
                    <Space>
                      <ApiOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.intCard1Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Аутентификация">
                        API-ключи (SHA-256 hash), Bearer token
                      </Descriptions.Item>
                      <Descriptions.Item label="Эндпоинты">
                        <Tag>GET /public/assignments</Tag>{' '}
                        <Tag>GET /public/users</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Управление">
                        Создание / просмотр / удаление ключей в Developer
                        Console
                      </Descriptions.Item>
                      <Descriptions.Item label="Изоляция">
                        Данные строго в рамках своей организации
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'gcal',
                  label: (
                    <Space>
                      <CalendarOutlined style={{ color: '#4285f4' }} />
                      <span>{t('presentation.intCard2Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="OAuth2 flow">
                        Авторизация через Google, токены в БД
                      </Descriptions.Item>
                      <Descriptions.Item label="Синхронизация">
                        Каждое назначение → событие в Google Calendar
                      </Descriptions.Item>
                      <Descriptions.Item label="Интерфейс">
                        Статус Connect/Disconnect + кнопка Sync в My Place
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'sms',
                  label: (
                    <Space>
                      <GlobalOutlined />
                      <span>{t('presentation.intCard3Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Провайдер">
                        Настраивается через API URL + Key в Dev Console
                      </Descriptions.Item>
                      <Descriptions.Item label="Sender ID">
                        GRANTHORN (до 11 символов)
                      </Descriptions.Item>
                      <Descriptions.Item label="Тест">
                        Отправка тестового SMS прямо из настроек
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'stripe',
                  label: (
                    <Space>
                      <GlobalOutlined style={{ color: '#635bff' }} />
                      <span>{t('presentation.intCard4Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Checkout">
                        Stripe Checkout Session при регистрации
                      </Descriptions.Item>
                      <Descriptions.Item label="Webhooks">
                        checkout.session.completed, subscription.updated
                      </Descriptions.Item>
                      <Descriptions.Item label="Portal">
                        Stripe Customer Portal для управления подпиской
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            11. MY PROFILE
        ═══════════════════════════════════════════════════ */}
        <div id="profile" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.profileTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.profileSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={[24, 16]}>
              <Col xs={24} md={14}>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label={t('presentation.profileFieldName')}>
                    Иванов Иван Иванович
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('presentation.profileFieldEmail')}
                  >
                    ivan@company.com
                  </Descriptions.Item>
                  <Descriptions.Item label={t('presentation.profileFieldRole')}>
                    <Tag>{t('presentation.profileRoleWorker')}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('presentation.profileFieldShifts')}
                  >
                    12 / 24
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('presentation.profileFieldHours')}
                  >
                    96 ч.
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} md={10}>
                <Collapse
                  size="small"
                  items={[
                    {
                      key: '1',
                      label: 'Моя статистика',
                      children: (
                        <Text type="secondary">
                          Блок «Моя статистика»: плановые и отчётные часы,
                          назначения за период
                        </Text>
                      ),
                    },
                    {
                      key: '2',
                      label: 'Моё расписание',
                      children: (
                        <Text type="secondary">
                          Список активных назначений с датами и рабочим местом
                        </Text>
                      ),
                    },
                    {
                      key: '3',
                      label: 'Запрос на смену места',
                      children: (
                        <Text type="secondary">
                          Сотрудник может запросить изменение рабочего места
                        </Text>
                      ),
                    },
                    {
                      key: '4',
                      label: 'Google Calendar',
                      children: (
                        <Text type="secondary">
                          Connect / Sync / Disconnect прямо в профиле
                        </Text>
                      ),
                    },
                  ]}
                />
              </Col>
            </Row>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            12. MULTILINGUAL
        ═══════════════════════════════════════════════════ */}
        <div id="multilingual" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.mlTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.mlSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={{ xs: 1, sm: 3 }}>
              <Descriptions.Item label={<Tag color="blue">RU</Tag>}>
                <Text>Русский — основной язык интерфейса</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="green">EN</Tag>}>
                <Text>English — full UI translation</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="red">TR</Tag>}>
                <Text>Türkçe — tam arayüz çevirisi</Text>
              </Descriptions.Item>
            </Descriptions>
            <Alert
              type="success"
              message={t('presentation.mlNote')}
              showIcon
              style={{ marginTop: 12 }}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            13. AUDIT LOG
        ═══════════════════════════════════════════════════ */}
        <div id="audit" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.auditTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.auditSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={auditCols}
              dataSource={auditRows}
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              size="small"
              items={[
                {
                  key: 'entities',
                  label: 'Что логируется',
                  children: (
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Назначения">
                        <Tag color="success">CREATE</Tag>{' '}
                        <Tag color="processing">UPDATE</Tag>{' '}
                        <Tag color="error">DELETE</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Пользователи">
                        <Tag color="success">CREATE</Tag>{' '}
                        <Tag color="processing">UPDATE</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Рабочие места">
                        <Tag color="success">CREATE</Tag>{' '}
                        <Tag color="processing">UPDATE</Tag>{' '}
                        <Tag color="error">DELETE</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="HR заявки">
                        <Tag color="cyan">APPROVE</Tag>{' '}
                        <Tag color="orange">REJECT</Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'details',
                  label: 'Читаемые детали',
                  children: (
                    <Row gutter={[16, 8]}>
                      {[
                        t('presentation.auditF1'),
                        t('presentation.auditF2'),
                        t('presentation.auditF3'),
                        t('presentation.auditF4'),
                      ].map((f) => (
                        <Col xs={24} sm={12} key={f}>
                          <Space>
                            <AuditOutlined style={{ color: GT_RED }} />
                            <Text>{f}</Text>
                          </Space>
                        </Col>
                      ))}
                    </Row>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            14. ORG SETTINGS
        ═══════════════════════════════════════════════════ */}
        <div id="orgsettings" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.orgTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.orgSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                {
                  key: 'branding',
                  label: t('presentation.orgCard1Title'),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Название">
                        companyDisplayName — отображается вместо имени орг.
                      </Descriptions.Item>
                      <Descriptions.Item label="Логотип">
                        URL изображения — показывается в сайдбаре
                      </Descriptions.Item>
                      <Descriptions.Item label="Цвет">
                        primaryColor — меняет акцентный цвет Ant Design
                        глобально
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'teams',
                  label: t('presentation.orgCard2Title'),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Роли">
                        <Tag>SUPER_ADMIN</Tag> <Tag>MANAGER</Tag>{' '}
                        <Tag>USER</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Изоляция">
                        Полная мультитенантность: orgId на всех запросах
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'whitelabel',
                  label: t('presentation.orgCard3Title'),
                  children: (
                    <Alert
                      type="success"
                      showIcon
                      message="White Label"
                      description="Enterprise-план позволяет полностью скрыть брендинг GT CRM и использовать собственный"
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            15. SaaS / PRICING
        ═══════════════════════════════════════════════════ */}
        <div id="saas" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.saasTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.saasSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={pricingColumns}
              dataSource={pricingData}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
              rowClassName={(_, index) =>
                index % 2 === 0 ? '' : 'ant-table-row-light'
              }
            />
            <Alert
              type="success"
              showIcon
              icon={<RocketOutlined />}
              message="14 дней бесплатного пробного периода на любом плане"
              style={{ marginTop: 12 }}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            16. SECURITY
        ═══════════════════════════════════════════════════ */}
        <div id="security" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.secTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.secSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Collapse
              items={[
                {
                  key: 'jwt',
                  label: (
                    <Space>
                      <LockOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.secCard1Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="Алгоритм">
                        HS256 / RS256, срок действия настраивается
                      </Descriptions.Item>
                      <Descriptions.Item label="Хранение">
                        localStorage (gt_crm_token), очистка при unauthorized
                      </Descriptions.Item>
                      <Descriptions.Item label="Refresh">
                        Автоматический редирект на / при истечении токена
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'rbac',
                  label: (
                    <Space>
                      <SafetyOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.secCard2Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Descriptions bordered size="small" column={1}>
                      <Descriptions.Item label="SUPER_ADMIN">
                        Полный доступ: все разделы, настройки, биллинг, аудит
                      </Descriptions.Item>
                      <Descriptions.Item label="MANAGER">
                        Назначения, HR, автоматизация, статистика своей орг.
                      </Descriptions.Item>
                      <Descriptions.Item label="USER">
                        Только My Place: своё расписание, отчёты, отпуска
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'tls',
                  label: (
                    <Space>
                      <LockOutlined style={{ color: '#52c41a' }} />
                      <span>{t('presentation.secCard3Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Text type="secondary">
                      {t('presentation.secCard3Desc')}
                    </Text>
                  ),
                },
                {
                  key: 'gdpr',
                  label: (
                    <Space>
                      <GlobalOutlined style={{ color: GT_RED }} />
                      <span>{t('presentation.secCard4Title')}</span>
                    </Space>
                  ),
                  children: (
                    <Text type="secondary">
                      {t('presentation.secCard4Desc')}
                    </Text>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            17. TECHNOLOGIES
        ═══════════════════════════════════════════════════ */}
        <div id="tech" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.techTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.techSubtitle')}
              style={{ marginBottom: 16 }}
            />
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
            >
              <Descriptions.Item label={<Tag color="blue">React 18</Tag>}>
                {t('presentation.techReact')}
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="red">NestJS</Tag>}>
                {t('presentation.techNest')}
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="green">PostgreSQL</Tag>}>
                {t('presentation.techPg')}
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="purple">Prisma ORM</Tag>}>
                {t('presentation.techPrisma')}
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="cyan">Ant Design 5</Tag>}>
                {t('presentation.techAntd')}
              </Descriptions.Item>
              <Descriptions.Item label={<Tag color="geekblue">TypeScript</Tag>}>
                {t('presentation.techTs')}
              </Descriptions.Item>
            </Descriptions>
            <Space wrap style={{ marginTop: 16 }}>
              {[
                'React Query',
                'i18next',
                'axios',
                'recharts',
                'multer',
                'stripe',
                'googleapis',
                '@nestjs/schedule',
                'Docker',
                'Nginx',
                'pnpm',
                'Vite',
              ].map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
            </Space>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            18. ROADMAP
        ═══════════════════════════════════════════════════ */}
        <div id="roadmap" style={SECTION}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                {t('presentation.roadTitle')}
              </Title>
            }
          >
            <Alert
              type="info"
              message={t('presentation.roadSubtitle')}
              style={{ marginBottom: 24 }}
            />
            <Timeline
              items={[
                {
                  color: 'green',
                  dot: <CheckCircleOutlined style={{ fontSize: 16 }} />,
                  children: (
                    <div>
                      <Space style={{ marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>
                          Q2 2026
                        </Text>
                        <Tag color="success">{t('presentation.roadDone')}</Tag>
                      </Space>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 20,
                          listStyleType: 'disc',
                        }}
                      >
                        {[
                          t('presentation.road1I1'),
                          t('presentation.road1I2'),
                          t('presentation.road1I3'),
                        ].map((item) => (
                          <li key={item}>
                            <Text>{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
                {
                  color: GT_RED,
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        Q3 2026
                      </Text>
                      <ul
                        style={{
                          margin: '8px 0 0',
                          paddingLeft: 20,
                          listStyleType: 'disc',
                        }}
                      >
                        {[
                          t('presentation.road2I1'),
                          t('presentation.road2I2'),
                          t('presentation.road2I3'),
                        ].map((item) => (
                          <li key={item}>
                            <Text>{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
                {
                  color: 'gray',
                  children: (
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        Q4 2026
                      </Text>
                      <ul
                        style={{
                          margin: '8px 0 0',
                          paddingLeft: 20,
                          listStyleType: 'disc',
                        }}
                      >
                        {[
                          t('presentation.road3I1'),
                          t('presentation.road3I2'),
                          t('presentation.road3I3'),
                        ].map((item) => (
                          <li key={item}>
                            <Text type="secondary">{item}</Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════
            19. CTA
        ═══════════════════════════════════════════════════ */}
        <div id="cta" style={SECTION}>
          <Card>
            <Alert
              type="success"
              showIcon
              icon={<RocketOutlined />}
              message={
                <Title level={4} style={{ margin: 0 }}>
                  {t('presentation.ctaTitle')}
                </Title>
              }
              description={
                <div>
                  <Paragraph style={{ marginBottom: 16 }}>
                    {t('presentation.ctaSubtitle')}
                  </Paragraph>
                  <Space wrap>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate('/')}
                    >
                      {t('presentation.ctaTryBtn')}
                    </Button>
                    <Button size="large" onClick={() => navigate('/register')}>
                      {t('presentation.ctaRegBtn')}
                    </Button>
                  </Space>
                  <Paragraph
                    type="secondary"
                    style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}
                  >
                    {t('presentation.ctaNote')}
                  </Paragraph>
                </div>
              }
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}

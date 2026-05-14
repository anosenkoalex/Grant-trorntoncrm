// frontend/src/components/Layout.tsx
import {
  BellOutlined,
  CheckOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Select,
  Skeleton,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type NotificationType,
} from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';

const { Header, Sider, Content } = Layout;

/* ── helpers ─────────────────────────────────────────────────── */

const TYPE_LABELS: Record<NotificationType, string> = {
  ASSIGNMENT_CREATED: 'Новое назначение',
  ASSIGNMENT_UPDATED: 'Назначение обновлено',
  ASSIGNMENT_MOVED: 'Назначение изменено',
  ASSIGNMENT_CANCELLED: 'Назначение отменено',
  SYSTEM: 'Системное',
  REMINDER: 'Напоминание',
};

const TYPE_COLORS: Partial<Record<NotificationType, string>> = {
  ASSIGNMENT_CREATED: 'blue',
  ASSIGNMENT_CANCELLED: 'red',
  SYSTEM: 'purple',
  REMINDER: 'orange',
};

function buildNotificationText(item: Notification) {
  const payload: Record<string, unknown> =
    (item.payload as Record<string, unknown>) ?? {};

  const title =
    TYPE_LABELS[item.type] ??
    (payload.title as string | undefined) ??
    'Уведомление';

  const adjustmentType = payload.adjustmentType as string | undefined;
  let resolvedTitle = title;
  if (item.type === 'ASSIGNMENT_UPDATED' && adjustmentType) {
    if (adjustmentType === 'REQUESTED')
      resolvedTitle = 'Запрос на корректировку графика';
    else if (adjustmentType === 'APPROVED')
      resolvedTitle = 'Корректировка одобрена';
    else if (adjustmentType === 'REJECTED')
      resolvedTitle = 'Корректировка отклонена';
  }

  // SYSTEM/REMINDER могут нести title/body
  if ((item.type === 'SYSTEM' || item.type === 'REMINDER') && payload.title) {
    resolvedTitle = payload.title as string;
  }

  const employeeName =
    (payload.userFullName as string | undefined) ??
    (payload.userEmail as string | undefined) ??
    '';

  const workplaceCode = (payload.workplaceCode as string | undefined) ?? '';
  const workplaceName = (payload.workplaceName as string | undefined) ?? '';
  const workplaceLabel = [workplaceCode, workplaceName]
    .filter(Boolean)
    .join(' — ');

  const body =
    (payload.body as string | undefined) ??
    [employeeName, workplaceLabel].filter(Boolean).join(' — ') ??
    null;

  return { title: resolvedTitle, body: body || null };
}

/* ── Notifications Dropdown ──────────────────────────────────── */

type NotificationsDropdownProps = {
  userId: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function NotificationsDropdown(_props: NotificationsDropdownProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(20),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const { items: notifications = [], unreadCount = 0 } =
    notificationsQuery.data ?? {};

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const dropdownContent = (
    <div
      style={{
        width: 'min(380px, 92vw)',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Шапка дропдауна */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <Space size={6}>
          <Typography.Text strong style={{ fontSize: 14 }}>
            {t('notifications.title', 'Уведомления')}
          </Typography.Text>
          {unreadCount > 0 && (
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
              {unreadCount} новых
            </Tag>
          )}
        </Space>

        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            loading={markAllMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              markAllMutation.mutate();
            }}
            style={{ padding: '0 4px', fontSize: 12 }}
          >
            Прочитать все
          </Button>
        )}
      </div>

      {/* Список */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notificationsQuery.isLoading ? (
          <div style={{ padding: 16 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <Typography.Text type="secondary">
              {t('notifications.empty', 'Уведомлений нет')}
            </Typography.Text>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.readAt;
            const { title, body } = buildNotificationText(item);
            const color = TYPE_COLORS[item.type];

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isUnread && !markReadMutation.isPending) {
                    markReadMutation.mutate(item.id);
                  }
                }}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f5f5f5',
                  cursor: isUnread ? 'pointer' : 'default',
                  background: isUnread ? '#f0f7ff' : '#fff',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (isUnread)
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#e6f0ff';
                }}
                onMouseLeave={(e) => {
                  if (isUnread)
                    (e.currentTarget as HTMLDivElement).style.background =
                      '#f0f7ff';
                }}
              >
                {/* Индикатор непрочитанного */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isUnread ? '#1677ff' : 'transparent',
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography.Text
                      strong={isUnread}
                      style={{
                        fontSize: 13,
                        color: isUnread ? '#1d1d1d' : '#555',
                      }}
                    >
                      {title}
                    </Typography.Text>
                    {color && (
                      <Tag
                        color={color}
                        style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                      >
                        {TYPE_LABELS[item.type]}
                      </Tag>
                    )}
                  </div>

                  {body && (
                    <Typography.Text
                      style={{
                        fontSize: 12,
                        color: '#888',
                        display: 'block',
                        marginTop: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {body}
                    </Typography.Text>
                  )}

                  <Typography.Text
                    style={{
                      fontSize: 11,
                      color: '#bbb',
                      display: 'block',
                      marginTop: 3,
                    }}
                  >
                    {dayjs(item.createdAt).format('DD.MM.YYYY HH:mm')}
                  </Typography.Text>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Футер */}
      {notifications.length > 0 && (
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Последние {notifications.length} уведомлений
          </Typography.Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      trigger={['click']}
      dropdownRender={() => dropdownContent}
      placement="bottomRight"
      overlayStyle={{ padding: 0 }}
    >
      <Badge
        count={unreadCount}
        overflowCount={99}
        offset={[-4, 4]}
        size="small"
      >
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          aria-label="Уведомления"
        />
      </Badge>
    </Dropdown>
  );
}

/* ── AppLayout ───────────────────────────────────────────────── */

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { logout, user, profile, isFetchingProfile } = useAuth();

  const handleLangChange = (lang: string) => {
    void i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  const langOptions = [
    { value: 'en', label: 'EN' },
    { value: 'tr', label: 'TR' },
    { value: 'ru', label: 'RU' },
  ];

  const [isMobile, setIsMobile] = useState(false);
  const [isSiderCollapsed, setIsSiderCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setIsSiderCollapsed(false);
      else setIsSiderCollapsed(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isWorker = user?.role === 'USER';
  const isDevUser = user?.email === 'dev@armico.local';

  const displayName = useMemo(() => {
    const fullName = (profile?.fullName ?? '').trim();
    if (fullName) return fullName;
    if (isAdmin) return t('layout.adminFallbackName', 'Администратор');
    return (profile?.email ?? '').trim();
  }, [profile?.fullName, profile?.email, isAdmin, t]);

  const navigationItems = useMemo(() => {
    if (!(isAdmin || isManager || isDevUser)) return [];

    const items: {
      key: string;
      path: string;
      label: string;
      icon?: ReactNode;
    }[] = [
      { key: 'dashboard', path: '/dashboard', label: t('layout.dashboard') },
    ];

    if (isAdmin || isManager) {
      items.push(
        {
          key: 'assignments',
          path: '/assignments',
          label: t('layout.assignments'),
        },
        { key: 'planner', path: '/planner', label: t('layout.planner') },
        {
          key: 'workplaces',
          path: '/workplaces',
          label: t('layout.workplaces'),
        },
        { key: 'users', path: '/users', label: t('layout.users') },
        {
          key: 'statistics',
          path: '/statistics',
          label: t('layout.statistics'),
        },
        {
          key: 'automation-settings',
          path: '/automation-settings',
          label: t('layout.automation', 'Автоматизация'),
        },
        { key: 'hr', path: '/hr', label: t('layout.hr', 'HR') },
      );
    }

    if (isAdmin) {
      items.push({
        key: 'billing',
        path: '/billing',
        label: t('layout.billing', 'Биллинг'),
      });
    }

    if (isAdmin || isDevUser) {
      items.push({
        key: 'dev',
        path: '/dev',
        label: 'Developer console',
        icon: <SettingOutlined />,
      });
    }

    return items;
  }, [isAdmin, isManager, isDevUser, t]);

  const selectedKey = useMemo(() => {
    if (!navigationItems.length) return '';
    const match = navigationItems.find((item) =>
      item.path === '/dashboard'
        ? location.pathname === '/dashboard'
        : location.pathname.startsWith(item.path),
    );
    return match?.key ?? navigationItems[0]?.key ?? '';
  }, [location.pathname, navigationItems]);

  const closeSider = () => setIsSiderCollapsed(true);

  /* ── Worker layout ── */
  if (isWorker && !isAdmin && !isManager && !isDevUser) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            background: '#fff',
            paddingInline: isMobile ? 12 : 24,
            height: 56,
            lineHeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Space size={8} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <Typography.Text
              strong
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {!isMobile && `${t('layout.welcome')} `}
              {displayName}
            </Typography.Text>
            {isFetchingProfile && <Spin size="small" />}
          </Space>
          <Space size={8}>
            <Button type="link" size="small" onClick={() => navigate('/hr')}>
              {t('layout.hr', 'HR')}
            </Button>
            <Select
              size="small"
              value={i18n.language.slice(0, 2)}
              onChange={handleLangChange}
              options={langOptions}
              style={{ width: 68 }}
              variant="borderless"
            />
            {user && <NotificationsDropdown userId={user.sub} />}
            <Button size={isMobile ? 'small' : 'middle'} onClick={logout}>
              {isMobile ? t('layout.logoutShort', 'Выйти') : t('layout.logout')}
            </Button>
          </Space>
        </Header>
        <Content
          style={{
            padding: isMobile ? 8 : 24,
            background: '#f5f5f5',
            minHeight: 0,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: isMobile ? 8 : 12,
              padding: isMobile ? 12 : 24,
              minHeight: '60vh',
            }}
          >
            {isFetchingProfile && !profile ? <Skeleton active /> : <Outlet />}
          </div>
        </Content>
      </Layout>
    );
  }

  /* ── Admin / Manager layout ── */
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Backdrop */}
      {isMobile && !isSiderCollapsed && (
        <div
          className="mobile-sider-overlay visible"
          onClick={closeSider}
          aria-hidden="true"
        />
      )}

      <Sider
        width={240}
        collapsedWidth={0}
        collapsed={isMobile ? isSiderCollapsed : false}
        trigger={null}
        style={
          isMobile
            ? {
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 1000,
                transform: isSiderCollapsed
                  ? 'translateX(-100%)'
                  : 'translateX(0)',
                transition: 'transform 0.25s ease',
                overflow: 'hidden auto',
              }
            : {
                position: 'sticky',
                top: 0,
                height: '100vh',
                overflow: 'hidden auto',
              }
        }
      >
        <div
          style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            padding: '14px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: 4,
          }}
        >
          Grant Thornton
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navigationItems.map((item) => ({
            key: item.key,
            label: item.label,
            icon: item.icon,
          }))}
          onClick={(info) => {
            const target = navigationItems.find(
              (item) => item.key === info.key,
            );
            if (target) navigate(target.path);
            if (isMobile) closeSider();
          }}
        />
      </Sider>

      <Layout style={{ minWidth: 0 }}>
        <Header
          style={{
            background: '#fff',
            paddingInline: isMobile ? 12 : 24,
            height: 56,
            lineHeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Space size={8} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            {navigationItems.length > 0 && (
              <Button
                type="text"
                icon={
                  isSiderCollapsed ? (
                    <MenuUnfoldOutlined />
                  ) : (
                    <MenuFoldOutlined />
                  )
                }
                onClick={() => setIsSiderCollapsed((p) => !p)}
                aria-label="Toggle navigation"
                style={{ flexShrink: 0 }}
              />
            )}
            <Typography.Text
              style={{
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {!isMobile && `${t('layout.welcome')} `}
              {displayName}
            </Typography.Text>
            {isFetchingProfile && <Spin size="small" />}
          </Space>

          <Space size={8} style={{ flexShrink: 0 }}>
            <Select
              size="small"
              value={i18n.language.slice(0, 2)}
              onChange={handleLangChange}
              options={langOptions}
              style={{ width: 68 }}
              variant="borderless"
            />
            {user && <NotificationsDropdown userId={user.sub} />}
            <Button size={isMobile ? 'small' : 'middle'} onClick={logout}>
              {isMobile ? t('layout.logoutShort', 'Выйти') : t('layout.logout')}
            </Button>
          </Space>
        </Header>

        <Content
          style={{
            padding: isMobile ? 8 : 24,
            background: '#f5f5f5',
            minHeight: 0,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: isMobile ? 8 : 12,
              padding: isMobile ? 12 : 24,
              minHeight: '60vh',
            }}
          >
            {isFetchingProfile && !profile ? <Skeleton active /> : <Outlet />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;

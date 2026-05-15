import {
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Button,
  Typography,
  Space,
  List,
  Tag,
  message,
  Popconfirm,
  Alert,
} from 'antd';
import type { TabsProps } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type SmsSettingsForm = {
  enabled: boolean;
  provider?: string | null;
  apiUrl?: string | null;
  apiKey?: string | null;
  sender?: string | null;
  testPhone?: string;
  testText?: string;
};

type EmailSettingsForm = {
  enabled: boolean;
  host?: string | null;
  port?: string | null;
  secure?: boolean;
  user?: string | null;
  password?: string | null;
  from?: string | null;
  testEmail?: string;
};

type DevUserInfo = {
  id: string;
  fullName?: string | null;
  email: string;
};

type DevWorkplaceInfo = {
  id: string;
  code: string;
  name: string;
};

type DevAssignmentLog = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  user?: DevUserInfo | null;
  workplace?: DevWorkplaceInfo | null;
};

type DevNotificationLog = {
  id: string;
  type: string;
  createdAt: string;
  user?: DevUserInfo | null;
};

type DevLogsState = {
  assignments: DevAssignmentLog[];
  notifications: DevNotificationLog[];
};

const DevPage = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [smsForm] = Form.useForm<SmsSettingsForm>();
  const [emailForm] = Form.useForm<EmailSettingsForm>();

  const [loadingSms, setLoadingSms] = useState(false);
  const [savingSms, setSavingSms] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const [logsLoading, setLogsLoading] = useState(false);
  const [logs, setLogs] = useState<DevLogsState | null>(null);

  const [backupLoading, setBackupLoading] = useState(false);

  // ─── Telegram ───
  type TelegramForm = {
    enabled: boolean;
    token?: string | null;
    chatId?: string | null;
  };
  const [telegramForm] = Form.useForm<TelegramForm>();
  const [loadingTelegram, setLoadingTelegram] = useState(false);
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  // ─── API Keys ───
  type ApiKeyRecord = {
    id: string;
    name: string;
    orgId: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    org: { id: string; name: string } | null;
  };
  type CreatedKey = { id: string; name: string; key: string };
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [justCreatedKey, setJustCreatedKey] = useState<CreatedKey | null>(null);

  const isAllowed =
    !!user &&
    (user.email === 'dev@grantthornton.local' || user.role === 'SUPER_ADMIN');

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  // ----- SMS settings load -----

  const loadSmsSettings = async () => {
    try {
      setLoadingSms(true);
      const res = await fetch(`${API_URL}/dev/sms-settings`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load SMS settings');
      }

      const data: {
        enabled?: boolean;
        provider?: string | null;
        apiUrl?: string | null;
        apiKey?: string | null;
        sender?: string | null;
      } = await res.json();

      smsForm.setFieldsValue({
        enabled: Boolean(data.enabled),
        provider: data.provider ?? '',
        apiUrl: data.apiUrl ?? '',
        apiKey: data.apiKey ?? '',
        sender: data.sender ?? '',
      });
    } catch (err) {
      console.error(err);
      message.error('Не удалось загрузить SMS-настройки');
    } finally {
      setLoadingSms(false);
    }
  };

  // ----- Email settings load -----

  const loadEmailSettings = async () => {
    try {
      setLoadingEmail(true);
      const res = await fetch(`${API_URL}/dev/email-settings`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!res.ok) {
        console.warn('Failed to load email settings', res.status);
        return;
      }

      const data: {
        enabled?: boolean;
        host?: string | null;
        port?: number | string | null;
        secure?: boolean;
        user?: string | null;
        from?: string | null;
      } = await res.json();

      emailForm.setFieldsValue({
        enabled: Boolean(data.enabled),
        host: data.host ?? '',
        port: data.port != null ? String(data.port) : '',
        secure: data.secure ?? true,
        user: data.user ?? '',
        password: '',
        from: data.from ?? '',
      });
    } catch (err) {
      console.error(err);
      message.error('Не удалось загрузить Email-настройки');
    } finally {
      setLoadingEmail(false);
    }
  };

  // ----- Telegram settings -----

  const loadTelegramSettings = async () => {
    try {
      setLoadingTelegram(true);
      const res = await fetch(`${API_URL}/dev/telegram-settings`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });
      if (!res.ok) throw new Error('Failed to load Telegram settings');
      const data = (await res.json()) as TelegramForm;
      telegramForm.setFieldsValue({
        enabled: Boolean(data.enabled),
        token: data.token ?? '',
        chatId: data.chatId ?? '',
      });
    } catch {
      message.error(t('dev.telegram.loadError'));
    } finally {
      setLoadingTelegram(false);
    }
  };

  const handleTelegramSave = async (values: TelegramForm) => {
    try {
      setSavingTelegram(true);
      const res = await fetch(`${API_URL}/dev/telegram-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error();
      message.success(t('dev.telegram.savedSuccess'));
    } catch {
      message.error(t('dev.telegram.saveError'));
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTelegramTest = async () => {
    try {
      setTestingTelegram(true);
      const res = await fetch(`${API_URL}/dev/test-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        message.error(data.message ?? t('dev.telegram.testError'));
        return;
      }
      message.success(t('dev.telegram.testSuccess'));
    } catch {
      message.error(t('dev.telegram.testError'));
    } finally {
      setTestingTelegram(false);
    }
  };

  // ----- API Keys -----

  const loadApiKeys = async () => {
    try {
      setApiKeysLoading(true);
      const res = await fetch(`${API_URL}/api-keys`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders },
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as ApiKeyRecord[];
      setApiKeys(Array.isArray(data) ? data : []);
    } catch {
      message.error(t('dev.apiKeys.loadError'));
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateKey = async () => {
    const name = newKeyName.trim();
    if (!name) {
      message.warning(t('dev.apiKeys.nameRequired'));
      return;
    }
    try {
      setCreatingKey(true);
      const res = await fetch(`${API_URL}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as CreatedKey;
      setJustCreatedKey(data);
      setNewKeyName('');
      void loadApiKeys();
    } catch {
      message.error(t('dev.apiKeys.createError'));
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await fetch(`${API_URL}/api-keys/${id}`, {
        method: 'DELETE',
        headers: { ...authHeaders },
      });
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      message.success(t('dev.apiKeys.deleteSuccess'));
    } catch {
      message.error(t('dev.apiKeys.deleteError'));
    }
  };

  useEffect(() => {
    if (!isAllowed) return;
    void loadSmsSettings();
    void loadEmailSettings();
    void loadTelegramSettings();
    void loadApiKeys();
  }, [isAllowed]); // eslint-disable-line

  // ----- SMS settings -----

  const handleSmsSave = async (values: SmsSettingsForm) => {
    try {
      setSavingSms(true);
      const res = await fetch(`${API_URL}/dev/sms-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error('Failed to save SMS settings');
      }

      message.success('SMS-настройки сохранены');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при сохранении SMS-настроек');
    } finally {
      setSavingSms(false);
    }
  };

  const handleSmsTest = async () => {
    try {
      const values = smsForm.getFieldsValue();
      const phone = values.testPhone;
      const text = values.testText;

      if (!phone) {
        message.warning('Укажи номер телефона для теста');
        return;
      }

      setTestingSms(true);
      const res = await fetch(`${API_URL}/dev/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ phone, text }),
      });

      if (!res.ok) {
        throw new Error('Failed to send test SMS');
      }

      message.success('Тестовое SMS отправлено (если шлюз настроен)');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при отправке тестового SMS');
    } finally {
      setTestingSms(false);
    }
  };

  // ----- Email settings -----

  const handleEmailSave = async (values: EmailSettingsForm) => {
    try {
      setSavingEmail(true);

      const payload = {
        enabled: Boolean(values.enabled),
        host: values.host?.trim() || '',
        port: values.port ? Number(values.port) : null,
        secure: Boolean(values.secure),
        user: values.user?.trim() || '',
        password: values.password ?? '',
        from: values.from?.trim() || '',
      };

      const res = await fetch(`${API_URL}/dev/email-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to save email settings');
      }

      message.success('Email-настройки сохранены');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при сохранении Email-настроек');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleEmailTest = async () => {
    try {
      const values = emailForm.getFieldsValue();
      const email = values.testEmail;

      if (!email) {
        message.warning('Укажи email для теста');
        return;
      }

      setTestingEmail(true);
      const res = await fetch(`${API_URL}/dev/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // пробуем вытащить message из ответа NestJS
        try {
          const data = (await res.json()) as { message?: string };
          if (typeof data?.message === 'string' && data.message.trim()) {
            message.error(data.message);
            return;
          }
        } catch {
          // если не json — идём вниз
        }

        message.error('Ошибка при отправке тестового письма');
        return;
      }

      message.success('Тестовое письмо отправлено (если шлюз настроен)');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при отправке тестового письма');
    } finally {
      setTestingEmail(false);
    }
  };

  // ----- Logs -----

  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch(`${API_URL}/dev/logs`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load logs');
      }

      const data: DevLogsState = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
      message.error('Не удалось загрузить логи');
    } finally {
      setLogsLoading(false);
    }
  };

  // ----- Backup -----

  const handleBackupDownload = async () => {
    try {
      setBackupLoading(true);
      const res = await fetch(`${API_URL}/dev/backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to create backup');
      }

      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');

      link.href = url;
      link.download = `grantthornton-backup-${ts}.json`;
      link.click();

      window.URL.revokeObjectURL(url);
      message.success('Backup выгружен');
    } catch (err) {
      console.error(err);
      message.error('Ошибка при создании backup');
    } finally {
      setBackupLoading(false);
    }
  };

  // ----- Access guard -----

  if (!isAllowed) {
    return (
      <Card>
        <Typography.Title level={3}>{t('dev.accessDenied')}</Typography.Title>
        <Typography.Paragraph>{t('dev.accessDesc')}</Typography.Paragraph>
      </Card>
    );
  }

  // ----- Tabs -----

  const items: TabsProps['items'] = [
    {
      key: 'sms',
      label: t('dev.tabSms'),
      children: (
        <Card loading={loadingSms}>
          <Form<SmsSettingsForm>
            form={smsForm}
            layout="vertical"
            initialValues={{ enabled: false }}
            onFinish={handleSmsSave}
          >
            <Form.Item
              name="enabled"
              label="Включить SMS-уведомления"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item name="provider" label="Провайдер (для себя)">
              <Input placeholder="Например, sms.ru / nexmo / twilio" />
            </Form.Item>

            <Form.Item name="apiUrl" label="API URL">
              <Input placeholder="Полный URL endpoint-а отправки SMS" />
            </Form.Item>

            <Form.Item name="apiKey" label="API ключ">
              <Input.Password placeholder="Секретный ключ / токен" />
            </Form.Item>

            <Form.Item name="sender" label="Подпись отправителя (sender)">
              <Input placeholder="GRANTHORN или имя компании" />
            </Form.Item>

            <Typography.Title level={5} style={{ marginTop: 24 }}>
              Тестовое SMS
            </Typography.Title>

            <Form.Item name="testPhone" label="Телефон для теста">
              <Input placeholder="+7..." />
            </Form.Item>

            <Form.Item name="testText" label="Текст для теста">
              <Input.TextArea
                placeholder="Если не заполнено — отправится дефолтный текст"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={savingSms}>
                Сохранить настройки
              </Button>
              <Button onClick={handleSmsTest} loading={testingSms}>
                Отправить тестовое SMS
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'email',
      label: t('dev.tabEmail'),
      children: (
        <Card loading={loadingEmail}>
          <Form<EmailSettingsForm>
            form={emailForm}
            layout="vertical"
            initialValues={{ enabled: false, secure: true }}
            onFinish={handleEmailSave}
          >
            <Form.Item
              name="enabled"
              label="Включить email-уведомления"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item name="host" label="SMTP host">
              <Input placeholder="smtp.example.com" />
            </Form.Item>

            <Form.Item name="port" label="SMTP порт">
              <Input placeholder="465 / 587" />
            </Form.Item>

            <Form.Item
              name="secure"
              label="Защищённое соединение (TLS/SSL)"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item name="user" label="SMTP пользователь">
              <Input placeholder="smtp-user@example.com" />
            </Form.Item>

            <Form.Item name="password" label="SMTP пароль">
              <Input.Password placeholder="Пароль или токен" />
            </Form.Item>

            <Form.Item name="from" label="Адрес отправителя (From)">
              <Input placeholder="noreply@grantthornton.local" />
            </Form.Item>

            <Typography.Title level={5} style={{ marginTop: 24 }}>
              Тестовое письмо
            </Typography.Title>

            <Form.Item name="testEmail" label="Email для теста">
              <Input placeholder="test@example.com" />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={savingEmail}>
                Сохранить настройки
              </Button>
              <Button onClick={handleEmailTest} loading={testingEmail}>
                Отправить тестовое письмо
              </Button>
            </Space>
          </Form>
        </Card>
      ),
    },
    {
      key: 'logs',
      label: t('dev.tabLogs'),
      children: (
        <Card
          extra={
            <Button onClick={loadLogs} loading={logsLoading}>
              Обновить
            </Button>
          }
        >
          {!logs ? (
            <Typography.Text type="secondary">
              Нажми «Обновить», чтобы загрузить последние события.
            </Typography.Text>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Typography.Title level={5}>Назначения</Typography.Title>
                <List
                  size="small"
                  dataSource={logs.assignments}
                  locale={{ emptyText: 'Нет назначений' }}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={0}>
                        <Typography.Text>
                          <strong>
                            {item.user?.fullName || item.user?.email}
                          </strong>{' '}
                          →{' '}
                          <strong>
                            {item.workplace?.code}{' '}
                            {item.workplace?.name
                              ? `— ${item.workplace.name}`
                              : ''}
                          </strong>
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          {new Date(item.startsAt).toLocaleString()} —
                          {item.endsAt
                            ? ` ${new Date(item.endsAt).toLocaleString()}`
                            : ' бессрочно'}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Статус: <Tag>{item.status}</Tag>
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>

              <div>
                <Typography.Title level={5}>Уведомления</Typography.Title>
                <List
                  size="small"
                  dataSource={logs.notifications}
                  locale={{ emptyText: 'Нет уведомлений' }}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" size={0}>
                        <Typography.Text>
                          <strong>
                            {item.user?.fullName || item.user?.email}
                          </strong>
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Тип: {item.type}
                        </Typography.Text>
                        <Typography.Text type="secondary">
                          Время: {new Date(item.createdAt).toLocaleString()}
                        </Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            </Space>
          )}
        </Card>
      ),
    },
    {
      key: 'telegram',
      label: t('dev.tabTelegram'),
      children: (
        <Card loading={loadingTelegram}>
          <Form<TelegramForm>
            form={telegramForm}
            layout="vertical"
            initialValues={{ enabled: false }}
            onFinish={handleTelegramSave}
          >
            <Form.Item
              name="enabled"
              label={t('dev.telegram.enabledLabel')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="token"
              label={t('dev.telegram.tokenLabel')}
              extra={t('dev.telegram.tokenHelp')}
            >
              <Input.Password placeholder="123456789:AABBcc..." />
            </Form.Item>
            <Form.Item
              name="chatId"
              label={t('dev.telegram.chatIdLabel')}
              extra={t('dev.telegram.chatIdHelp')}
            >
              <Input placeholder="-1001234567890" />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={savingTelegram}>
                {t('dev.telegram.save')}
              </Button>
              <Button onClick={handleTelegramTest} loading={testingTelegram}>
                {t('dev.telegram.test')}
              </Button>
            </Space>
          </Form>
          <Typography.Paragraph
            type="secondary"
            style={{ marginTop: 16, marginBottom: 0 }}
          >
            {t('dev.telegram.desc')}
          </Typography.Paragraph>
        </Card>
      ),
    },
    {
      key: 'api-keys',
      label: t('dev.tabApiKeys'),
      children: (
        <Card loading={apiKeysLoading}>
          <Typography.Paragraph>
            {t('dev.apiKeys.desc')}
            <br />
            <Typography.Text code>GET /public/assignments</Typography.Text>{' '}
            <Typography.Text code>GET /public/users</Typography.Text>
            <br />
            <Typography.Text code>
              Authorization: Bearer &lt;key&gt;
            </Typography.Text>
          </Typography.Paragraph>

          {justCreatedKey && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('dev.apiKeys.createdAlert')}
              description={
                <Typography.Text
                  copyable
                  code
                  style={{ wordBreak: 'break-all' }}
                >
                  {justCreatedKey.key}
                </Typography.Text>
              }
              closable
              onClose={() => setJustCreatedKey(null)}
            />
          )}

          <Space.Compact
            style={{ marginBottom: 16, width: '100%', maxWidth: 480 }}
          >
            <Input
              placeholder={t('dev.apiKeys.namePlaceholder')}
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onPressEnter={handleCreateKey}
            />
            <Button
              type="primary"
              onClick={handleCreateKey}
              loading={creatingKey}
            >
              {t('dev.apiKeys.createBtn')}
            </Button>
          </Space.Compact>

          {apiKeys.length === 0 ? (
            <Typography.Text type="secondary">
              {t('dev.apiKeys.noKeys')}
            </Typography.Text>
          ) : (
            <List
              size="small"
              dataSource={apiKeys}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="del"
                      title={t('dev.apiKeys.deleteConfirm')}
                      onConfirm={() => void handleDeleteKey(item.id)}
                      okText={t('dev.apiKeys.deleteBtn')}
                      cancelText={t('common.cancel')}
                    >
                      <Button type="link" danger size="small">
                        {t('dev.apiKeys.deleteBtn')}
                      </Button>
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space size={4}>
                        {item.org && <Tag>{item.org.name}</Tag>}
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {t('dev.apiKeys.createdLabel')}:{' '}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Typography.Text>
                        {item.lastUsedAt && (
                          <Typography.Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                          >
                            · {t('dev.apiKeys.lastUsedLabel')}:{' '}
                            {new Date(item.lastUsedAt).toLocaleDateString()}
                          </Typography.Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      ),
    },
    {
      key: 'backup',
      label: t('dev.tabBackup'),
      children: (
        <Card>
          <Typography.Paragraph>
            Здесь можно выгрузить JSON-backup основных таблиц (организация,
            пользователи, рабочие места, назначения, планы, слоты, ограничения).
          </Typography.Paragraph>
          <Button
            type="primary"
            onClick={handleBackupDownload}
            loading={backupLoading}
          >
            Скачать backup (JSON)
          </Button>
        </Card>
      ),
    },
  ];

  return (
    <Card>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        {t('dev.title')}
      </Typography.Title>
      <Tabs
        defaultActiveKey="sms"
        items={items}
        onChange={(key) => {
          if (key === 'logs' && !logs) {
            void loadLogs();
          }
        }}
      />
    </Card>
  );
};

export default DevPage;

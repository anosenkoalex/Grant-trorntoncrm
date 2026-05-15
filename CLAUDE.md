# Журнал разработки — Armico CRM

Этот файл ведётся автоматически ИИ-ассистентом (Claude Code). Каждое изменение фиксируется здесь: дата, описание, затронутые файлы.

---

## 2026-05-15 — Фаза 15: White-label и корпоративные настройки

Добавлена возможность кастомизации внешнего вида для каждой организации.

### Backend

**Prisma schema** — в модель `Org` добавлены поля: `logoUrl String?`, `primaryColor String?`, `companyDisplayName String?`.

**Миграция** — `20260515200000_add_org_branding/migration.sql`

**OrgsService** — обновлён `getMyOrg()` (теперь возвращает все три новых поля); добавлен метод `updateBranding(orgId, { logoUrl?, primaryColor?, companyDisplayName? })`.

**OrgsController** — добавлен эндпоинт `PATCH /orgs/branding` (SUPER_ADMIN), объявлен до параметрических маршрутов.

### Frontend

**api/client.ts** — расширен тип `MyOrgResponse` тремя новыми необязательными полями; добавлена функция `updateOrgBranding()`.

**OrgSettings.tsx** (новая страница) — форма с полями: `companyDisplayName` (Input), `logoUrl` (Input URL), `primaryColor` (Ant Design ColorPicker с кнопкой «Сбросить»). Форма предзаполняется из `GET /orgs/me`; мутация через `PATCH /orgs/branding`.

**Layout.tsx** — пункт «Настройки организации» добавлен в сайдбар для SUPER_ADMIN; сайдбар показывает `companyDisplayName` вместо «Grant Thornton» если задано; весь admin-layout обёрнут в `<ConfigProvider theme={{ token: { colorPrimary } }}>` — меняет основной цвет Ant Design на лету.

**routes/index.tsx** — добавлен маршрут `/org-settings`.

**i18n.ts** — добавлен раздел `orgSettings.*` и ключ `layout.orgSettings` во все три языка (RU/EN/TR).

### Изменённые файлы

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260515200000_add_org_branding/migration.sql` (новый)
- `backend/src/orgs/orgs.service.ts`
- `backend/src/orgs/orgs.controller.ts`
- `frontend/src/api/client.ts`
- `frontend/src/pages/OrgSettings.tsx` (новый)
- `frontend/src/components/Layout.tsx`
- `frontend/src/routes/index.tsx`
- `frontend/src/i18n.ts`

---

## 2026-05-15 — Фаза 14: Welcome email после регистрации

После успешной оплаты и создания аккаунта (событие `checkout.session.completed`) отправляется welcome-письмо новому администратору.

### Изменения по файлам

**email.service.ts** — добавлен метод `sendWelcomeEmail(to, companyName, plan, appUrl)`: строит HTML-письмо с приветствием по имени компании, email для входа, ссылкой на систему и названием плана; вызывает `sendHtmlEmail()`; содержит собственный try/catch, чтобы ошибка SMTP не пробрасывалась наружу; если SMTP не настроен — молча пропускает

**billing.module.ts** — добавлен импорт `NotificationsModule` (который экспортирует `EmailService`)

**billing.service.ts** — `EmailService` инжектирован в конструктор; в `handleCheckoutCompleted()` после `this.logger.log(...)` вызывается `emailService.sendWelcomeEmail(...)` в отдельном try/catch — ошибка email никогда не ломает регистрацию

**Изменённые файлы:**

- `backend/src/notifications/email.service.ts`
- `backend/src/billing/billing.module.ts`
- `backend/src/billing/billing.service.ts`

---

## 2026-05-15 — Фаза 13: Onboarding Wizard

Добавлен пошаговый мастер настройки для новых организаций.

### Backend

**Prisma schema** — в модель `Org` добавлено поле `onboardingCompleted Boolean @default(false)`.

**Миграция** — `20260515100000_add_onboarding_flag/migration.sql`

**OrgsController** — два новых эндпоинта (объявлены ДО параметрических маршрутов):

- `GET /orgs/me` (SUPER_ADMIN | MANAGER) — возвращает `{ id, name, slug, onboardingCompleted }`
- `PATCH /orgs/onboarding-complete` (SUPER_ADMIN) — ставит флаг `onboardingCompleted: true`

**OrgsService** — добавлены `getMyOrg(orgId)` и `completeOnboarding(orgId)`.

### Frontend

**api/client.ts** — добавлены тип `MyOrgResponse`, функции `fetchMyOrg()` и `completeOnboarding()`.

**OnboardingWizard.tsx** (новый компонент) — Modal Ant Design без возможности закрыть, со Steps (3 шага):

1. Создать рабочее место (name + code) → `createWorkplace()` → Step 2
2. Добавить сотрудника (fullName + email + password) → `createUser()` → Step 3
3. Result «Готово!» → `completeOnboarding()` → закрыть
   На шагах 1 и 2 есть кнопка «Пропустить» — переходит к следующему шагу.

**Layout.tsx** — `useQuery` для `fetchMyOrg` (только для SUPER_ADMIN с `orgId`). Если `onboardingCompleted === false`, рендерит `<OnboardingWizard onDone={() => refetch()}>` поверх контента.

**i18n.ts** — добавлен раздел `onboarding.*` во все три языка (RU/EN/TR).

### Изменённые файлы

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260515100000_add_onboarding_flag/migration.sql` (новый)
- `backend/src/orgs/orgs.service.ts`
- `backend/src/orgs/orgs.controller.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/OnboardingWizard.tsx` (новый)
- `frontend/src/components/Layout.tsx`
- `frontend/src/i18n.ts`

---

## 2026-05-15 — Фаза 12: Интеграция Google Calendar

Реализован полный OAuth2 flow для подключения Google Calendar и синхронизации назначений сотрудника как событий.

### Backend

**Prisma schema** — в модель `User` добавлены поля: `googleAccessToken String?`, `googleRefreshToken String?`, `googleCalendarConnected Boolean @default(false)`.

**Миграция** — `20260515000000_add_google_calendar/migration.sql`

**Новый модуль** — `backend/src/integrations/google-calendar/`:

- `google-calendar.service.ts` — создаёт OAuth2 URL (userId в `state` как base64), обменивает код на токены, сохраняет в БД, синхронизирует активные назначения (каждую смену → событие в Google Calendar; если смен нет — событие по дням). Авто-обновление access_token при истечении.
- `google-calendar.controller.ts`:
  - `GET /integrations/google/auth-url` — JWT-protected, возвращает `{ url }` для редиректа браузера на Google OAuth
  - `GET /integrations/google/callback` — публичный, получает `code` + `state`, сохраняет токены, редиректит на `/my-place?gc=success|error`
  - `GET /integrations/google/status` — JWT-protected, `{ connected: boolean }`
  - `DELETE /integrations/google/disconnect` — JWT-protected, очищает токены
  - `POST /integrations/google/sync` — JWT-protected, создаёт события в Google Calendar
- `google-calendar.module.ts`

**env.validation.ts** — добавлены `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (optional).

**app.module.ts** — добавлен `GoogleCalendarModule`.

**package.json** — зависимость `googleapis`.

### Frontend

**api/client.ts** — добавлены: тип `GoogleCalendarStatus`, функции `fetchGoogleCalendarStatus`, `getGoogleCalendarAuthUrl`, `disconnectGoogleCalendar`, `syncGoogleCalendar`.

**MyPlace.tsx** — добавлен Card «Google Calendar»: статус-тег (Connected/Not connected), кнопка Connect (открывает OAuth URL через `window.location.href`), Sync и Disconnect (с loading-состоянием). `useEffect` при монтировании читает `?gc=success|error` из URL, показывает уведомление, очищает параметр через `history.replaceState`.

**i18n.ts** — добавлен раздел `googleCalendar` во все три языка (RU/EN/TR).

### Переменные окружения (добавить в Render)

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://grant-trorntoncrm.onrender.com/integrations/google/callback
```

### Изменённые файлы

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260515000000_add_google_calendar/migration.sql` (новый)
- `backend/src/integrations/google-calendar/google-calendar.service.ts` (новый)
- `backend/src/integrations/google-calendar/google-calendar.controller.ts` (новый)
- `backend/src/integrations/google-calendar/google-calendar.module.ts` (новый)
- `backend/src/app.module.ts`
- `backend/src/config/env.validation.ts`
- `backend/package.json`
- `frontend/src/api/client.ts`
- `frontend/src/pages/MyPlace.tsx`
- `frontend/src/i18n.ts`

---

## 2026-05-15 — Фаза 10: Фикс изоляции планировщика по orgId

В `planner.service.ts` оба вызова `prisma.assignment.findMany` фильтровали данные по `workplace.orgId` (`where.workplace = { is: { orgId } }`), что расходилось с паттерном, принятым в остальных сервисах. Заменено на `where.user = { orgId }` — теперь показываются только назначения сотрудников своей организации.

Контроллер уже получал `orgId` через `@CurrentUser()` и передавал в сервис — изменений не потребовалось.

### Изменения по файлам

**planner.service.ts** — в `collectRows()` и `exportMatrixToExcel()`: `where.workplace = { is: { orgId: effectiveOrgId } }` заменено на `where.user = { orgId: effectiveOrgId }`; добавлен `/* eslint-disable @typescript-eslint/no-explicit-any */`

**Изменённые файлы:**

- `backend/src/planner/planner.service.ts`

---

## 2026-05-15 — Перевод оставшихся хардкоженных строк (Assignments, Planner)

Переведены оставшиеся хардкоженные русские строки в Assignments.tsx и Planner.tsx; добавлены недостающие i18n-ключи для всех трёх языков.

### Изменения по файлам

**Assignments.tsx** — кнопки переключения вида (`viewActive`/`viewTrash`), кнопки запросов (`assignmentRequests`, `scheduleAdjustmentsButton`, `assignmentRequestsTitle`), блок «Свободных сотрудников» (`freeUsers`, `common.show`), модалка свободных сотрудников (`freeUsersModal.title`, `freeUsersModal.allAssigned`, `common.close`, `common.loading`)

**Planner.tsx** — добавлен `/* eslint-disable @typescript-eslint/no-explicit-any */`; перевод строки «Сотрудники: N, N, N + ещё X» через `t('planner.employees')` и `t('planner.andMore', { count })`

**i18n.ts** — добавлены новые ключи во все три языка (RU/EN/TR):

- `assignments.*`: `viewActive`, `viewTrash`, `assignmentRequests`, `scheduleAdjustmentsButton`, `assignmentRequestsTitle`, `freeUsers`, `show`, `freeUsersModal.{ title, allAssigned }`
- `planner.*`: `title`, `byUsers`, `byWorkplaces`, `downloadExcel`, `totalEmployees`, `totalWorkplaces`, `periodSummary`, `exportError`, `employees`, `andMore`
- `common.*`: `show`, `close`

**Изменённые файлы:**

- `frontend/src/i18n.ts`
- `frontend/src/pages/Assignments.tsx`
- `frontend/src/pages/Planner.tsx`

---

## 2026-05-15 — Перевод всех хардкоженных русских строк на i18n-ключи

Все хардкоженные русские строки в компонентах фронтенда заменены на вызовы `t('ключ')` через `useTranslation`. Добавлены недостающие ключи в переводы для RU/EN/TR.

### Изменения по файлам

**AssignmentAdjustments.tsx** — все заголовки колонок, метки статусов, кнопки и сообщения заменены на `t('assignmentAdjustments.*')`; устранён `any` через явный тип

**Statistics.tsx** — `shiftKindLabels` и `workplaceColumns` перенесены внутрь компонента; `KpiCards` и `DynamicsChart` получили `useTranslation()`; все Russian-строки заменены на i18n-ключи (фильтры, заголовки, экспорт, модалки)

**FileAttachment.tsx** — добавлен `useTranslation`; все `message.success/error` и UI-текст заменены на `t('fileAttachment.*')`

**WorkReportCalendarModal.tsx** — добавлен `useTranslation`; заголовок модалки, кнопка OK, описание и теги переведены через `t('workReportModal.*')`; удалено неиспользуемое состояние `currentMonth`

**Dashboard.tsx** — хардкоженный fallback `'Администратор'` заменён на `t('layout.adminFallbackName')`

**Workplaces.tsx** — хардкоженный `'дн.'` заменён на `t('common.days')`

**i18n.ts** — добавлены недостающие ключи:

- RU: `notifications.*Short`-варианты; `myPlace.shiftKind*`, `noCorrectionIntervals`, `invalidInterval`; `assignmentAdjustments.filterStatus/filterAll`
- TR: все 9 новых разделов — `register`, `registerSuccess`, `billing`, `superAdmin`, `scheduleAdjustments`, `assignmentAdjustments`, `fileAttachment`, `workReportModal`, `mobileFilters`

**Изменённые файлы:**

- `frontend/src/i18n.ts`
- `frontend/src/pages/AssignmentAdjustments.tsx`
- `frontend/src/pages/Statistics.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Workplaces.tsx`
- `frontend/src/components/FileAttachment.tsx`
- `frontend/src/components/WorkReportCalendarModal.tsx`

---

## 2026-05-14 — Мультитенантная изоляция данных по организациям

Все основные сервисы теперь фильтруют данные по `orgId` из JWT-токена текущего пользователя. Данные одной организации больше не видны пользователям другой.

### Изменения по сервисам

**workplaces.service.ts** — `buildWhere` принимает `orgId?: string`, добавляет `where.orgId = orgId`; `findAll` обновлён соответственно

**workplaces.controller.ts** — `findAll` использует `@CurrentUser()` и передаёт `user.orgId ?? undefined`

**users.service.ts** — `findAll(params, orgId?)` добавляет `where.orgId = orgId` если задан

**users.controller.ts** — `findAll` использует `@CurrentUser()` и передаёт `user.orgId ?? undefined`; добавлены импорты `CurrentUser`, `JwtPayload`

**assignments.service.ts** — `buildWhere(params, orgId?)` и `buildTrashWhere(params, orgId?)` добавляют `where.user = { orgId }` для фильтрации через связь; `findAll(params, orgId?)` и `findAllInTrash(params, orgId?)` обновлены соответственно; `getUsersAssignmentsSummary(orgId?)` уже поддерживал `orgId`, остался без изменений

**assignments.controller.ts** — `findAll`, `findAllInTrash`, `getUsersAssignmentsSummary` передают `this.getOrgId(req)` в сервис

**statistics.service.ts** — `getStatistics(dto, orgId?)` и `getKpi(dto, orgId?)` добавляют `assignment: { user: { orgId } }` в where-фильтр смен

**statistics.controller.ts** — оба метода используют `@CurrentUser()` и передают `user.orgId ?? undefined`; добавлены импорты `CurrentUser`, `JwtPayload`

**planner.service.ts / planner.controller.ts** — уже были изолированы через `auth.orgId` (не изменялись)

**Изменённые файлы:**

- `backend/src/workplaces/workplaces.service.ts`
- `backend/src/workplaces/workplaces.controller.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/assignments/assignments.service.ts`
- `backend/src/assignments/assignments.controller.ts`
- `backend/src/statistics/statistics.service.ts`
- `backend/src/statistics/statistics.controller.ts`

---

## 2026-05-14 — Stripe webhook: совместимость с API 2026-04-22.dahlia

- **billing.service.ts**: исправлена обработка `checkout.session.completed` и `customer.subscription.updated` — поле `current_period_end` читается из `sub.items.data[0]` с fallback на верхний уровень (новый Stripe API 2026-04-22.dahlia перенёс поле внутрь items)

**Изменённые файлы:**

- `backend/src/billing/billing.service.ts`

---

## 2026-05-14 — Переменная окружения VITE_API_URL

- **api/client.ts**: `baseURL` теперь читается из `import.meta.env.VITE_API_URL`, с fallback на `/api`

**Изменённые файлы:**

- `frontend/src/api/client.ts`

---

## 2026-05-14 — Страница регистрации: брендинг и переключатель языков

- **Register.tsx**: заменено «Armico CRM» → «Grant Thornton CRM»; добавлен header с логотипом-ссылкой на `/` и переключателем языков EN/TR/RU (Select + useTranslation/i18next, сохранение в localStorage); лого убрано из тела формы, осталось только в шапке

**Изменённые файлы:**

- `frontend/src/pages/Register.tsx` — header с Grant Thornton CRM + lang switcher

---

## 2026-05-14 — Мультиязычность лендинга + порядок языков

- **i18n.ts**: добавлен раздел `landing` во все три языка (EN/TR/RU) — ключи: `signIn`, `getStarted`, `startTrial`, `heroTitle`, `heroSubtitle`, `featuresTitle`, `feature1Title`…`feature6Title`, `feature1Desc`…`feature6Desc`, `pricingTitle`, `pricingSubtitle`, `popular`, `perMonth`, `planCta`, `starterName/Limit`, `businessName/Limit`, `enterpriseName/Limit`, `fShifts`…`fSla`, `footerRights`
- **Landing.tsx**: все хардкоженные строки заменены на `t('landing.*')`; массивы `PLANS` и `FEATURES` перенесены внутрь компонента с использованием `t()`; порядок языков в переключателе исправлен на EN / TR / RU

**Изменённые файлы:**

- `frontend/src/i18n.ts` — раздел `landing` в EN и TR (RU был добавлен ранее)
- `frontend/src/pages/Landing.tsx` — useTranslation для всех строк, LANG_OPTIONS [en, tr, ru]

---

## 2026-05-14 — Доработки лендинга

- **Landing.tsx**: заменено «Armico CRM» → «Grant Thornton CRM» во всех местах (шапка, hero-текст, футер); добавлен переключатель языков RU/EN/TR в шапку (Select из antd + useTranslation/i18next, сохранение в localStorage)
- **routes/index.tsx**: `/` теперь показывает лендинг для незалогиненных и редиректит на `/dashboard` или `/my-place` для залогиненных; все защищённые маршруты вынесены в pathless layout route с `ProtectedRoute`; `/landing` остаётся как алиас; `ProtectedRoute` при отсутствии токена редиректит на `/` вместо `/login`

**Изменённые файлы:**

- `frontend/src/pages/Landing.tsx` — Grant Thornton CRM, language switcher
- `frontend/src/routes/index.tsx` — / как лендинг, pathless protected layout

---

## 2026-05-14 — Фаза 9: SaaS-монетизация (Stripe + Лендинг + Биллинг)

Реализована полная SaaS-инфраструктура: публичный лендинг, регистрация через Stripe Checkout, управление подписками, биллинг-страница и панель платформенного администратора.

### Backend

**Prisma schema:**

- Новые enums: `SubscriptionPlan` (STARTER/BUSINESS/ENTERPRISE), `SubscriptionStatus` (ACTIVE/CANCELLED/PAST_DUE/TRIALING/INCOMPLETE)
- Новая модель `Subscription`: orgId (unique), stripeCustomerId (unique), stripeSubId (unique), stripePriceId, plan, status, currentPeriodEnd, cancelAtPeriodEnd
- Новая модель `PendingRegistration`: companyName, adminEmail, password (bcrypt hash), plan, sessionId (unique), processedAt, expiresAt
- `Org` расширена полем `subscription Subscription?`
- Новая миграция: `20260514100000_add_subscriptions/migration.sql`

**billing.service.ts:**

- `initiateRegistration()` — создаёт PendingRegistration, Stripe Customer, Stripe Checkout Session; возвращает URL для редиректа
- `handleWebhook()` — обрабатывает `checkout.session.completed` (создаёт Org + User + Subscription в транзакции), `customer.subscription.updated`, `customer.subscription.deleted`
- `getBillingInfo()` — возвращает текущую подписку и историю Stripe invoices
- `createPortalSession()` — создаёт Stripe Customer Portal session

**billing.controller.ts:**

- `POST /billing/register` — публичный, принимает регистрационные данные, возвращает Stripe URL
- `POST /billing/webhook` — без JWT, использует rawBody для верификации Stripe signature
- `GET /billing/info` — JWT-protected, информация о подписке
- `POST /billing/portal` — JWT-protected, открывает Stripe Customer Portal

**super-admin.service.ts + super-admin.controller.ts:**

- `GET /super-admin/orgs` — список всех организаций с подпиской и счётчиком пользователей
- `GET /super-admin/stats` — общая статистика платформы (orgs, users, active subscriptions)
- Доступ только для пользователя с email = `PLATFORM_ADMIN_EMAIL` из env

**main.ts:** добавлен `{ rawBody: true }` для NestFactory.create (нужно для webhook-верификации)

**env.validation.ts:** добавлены переменные: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE`, `PLATFORM_ADMIN_EMAIL`

**package.json:** добавлена зависимость `stripe ^16.0.0`

### Frontend

**Landing.tsx** — публичная маркетинговая страница:

- Hero секция с CTA кнопками "Start Free Trial" и "Sign In"
- Секция с 6 ключевыми функциями продукта
- Pricing секция с тремя планами (Starter $29/BUSINESS $99/Enterprise $299)
- Доступна по `/landing`

**Register.tsx** — страница регистрации компании:

- Форма: Company Name, Admin Email, Password (подтверждение), Plan selector
- POST `/billing/register` → редирект на Stripe Checkout
- Обработка ошибок (EMAIL_TAKEN, validation)
- Доступна по `/register`

**RegisterSuccess.tsx** — страница успешной регистрации:

- Result компонент с кнопкой "Go to Login"
- Доступна по `/register/success`

**Billing.tsx** — страница биллинга:

- Текущий план с тегом и лимитом пользователей
- Статус подписки (ACTIVE/PAST_DUE/CANCELLED/TRIALING)
- Дата следующего платежа
- Кнопка "Open Billing Portal" → Stripe Customer Portal
- Таблица истории платежей с PDF-ссылками
- Доступна по `/billing`, защищена JWT

**SuperAdmin.tsx** — панель платформенного администратора:

- KPI карточки: total orgs, total users, active subscriptions
- Таблица всех организаций: plan, status, users, next renewal, created date
- Использует `GET /super-admin/orgs` и `GET /super-admin/stats`
- Доступна по `/super-admin`

**api/client.ts:**

- Типы: `SubscriptionPlan`, `SubscriptionStatus`, `Subscription`, `Invoice`, `BillingInfo`, `RegisterPayload`, `OrgSummary`
- Функции: `initiateRegistration()`, `fetchBillingInfo()`, `createPortalSession()`, `fetchSuperAdminOrgs()`, `fetchSuperAdminStats()`

**routes/index.tsx:** добавлены маршруты `/landing`, `/register`, `/register/success` (публичные), `/billing`, `/super-admin` (protected)

**components/Layout.tsx:** добавлен пункт «Биллинг» в навигацию для SUPER_ADMIN

**i18n.ts:** добавлен ключ `layout.billing` на RU/EN/TR

**Новые файлы:**

- `backend/prisma/migrations/20260514100000_add_subscriptions/migration.sql`
- `backend/src/billing/billing.service.ts`
- `backend/src/billing/billing.controller.ts`
- `backend/src/billing/billing.module.ts`
- `backend/src/super-admin/super-admin.service.ts`
- `backend/src/super-admin/super-admin.controller.ts`
- `backend/src/super-admin/super-admin.module.ts`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/pages/RegisterSuccess.tsx`
- `frontend/src/pages/Billing.tsx`
- `frontend/src/pages/SuperAdmin.tsx`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — enums + модели Subscription/PendingRegistration
- `backend/src/main.ts` — rawBody: true
- `backend/src/config/env.validation.ts` — Stripe env vars
- `backend/src/app.module.ts` — BillingModule, SuperAdminModule
- `backend/package.json` — stripe dependency
- `frontend/src/api/client.ts` — billing/super-admin типы и функции
- `frontend/src/routes/index.tsx` — новые маршруты
- `frontend/src/components/Layout.tsx` — Billing в навигации
- `frontend/src/i18n.ts` — layout.billing ключ

**Переменные окружения (добавить в .env):**

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_ENTERPRISE=price_...
PLATFORM_ADMIN_EMAIL=platform@example.com
APP_URL=https://your-domain.com
```

---

## 2026-05-14 — Доработки из КП: HR-календарь, HR-уведомления, лог автоматизации, Google Calendar

### 1. HR — Визуальный календарь отпусков (новая вкладка «Календарь»)

- **Frontend — HR.tsx**: добавлен компонент `VacationCalendarTab` — Gantt-таблица с навигацией по месяцам; цветные полосы по типу заявки: VACATION=#1677ff, SICK_LEAVE=#ff7a45, DAY_OFF=#52c41a; для менеджеров/админов — все одобренные заявки за месяц, для сотрудников — свои заявки; поддержка hover-tooltip с датами. Добавлен импорт `LeftOutlined`, `RightOutlined`, `Skeleton` из ant-design
- **Backend — hr.controller.ts**: добавлены параметры `dateFrom` и `dateTo` в `GET /hr/vacations`
- **Backend — hr.service.ts**: добавлена фильтрация по датам (пересечение диапазонов) в `findAll()`
- **Frontend — api/client.ts**: расширен тип `FetchVacationsParams` полями `dateFrom` и `dateTo`
- **i18n.ts**: добавлены ключи `hr.calendarTab`, `hr.calendarEmpty`, `hr.calendarApprovedOnly` (RU/EN/TR)

### 2. HR — Уведомление сотруднику при одобрении/отклонении заявки

- **Backend — hr.service.ts**: инжектирован `NotificationsService`; в методах `approve()` и `reject()` после сохранения создаётся системное уведомление через `notifications.createSystemNotification()` с типом заявки и датами
- **Backend — hr.module.ts**: добавлен импорт `NotificationsModule`

### 3. Автоматизация — Лог отправленных уведомлений

- **Backend — schema.prisma**: добавлена модель `NotificationLog` (id, orgId, userId, userLabel, type, channel SYSTEM|TELEGRAM, createdAt); отношения добавлены в `Org` и `User`
- **Backend — migration**: `20260514000000_add_notification_log/migration.sql`
- **Backend — automation.service.ts**: добавлен приватный метод `logNotification()`; вызывается в `notifyWithCheck()` для каждого получателя (SYSTEM) и для Telegram (TELEGRAM); добавлен метод `getNotificationLog()` с пагинацией
- **Backend — automation.controller.ts**: добавлен эндпоинт `GET /automation/notification-log`; рефакторинг проверки прав в `checkManagerAccess()`
- **Backend — telegram.service.ts**: `sendMessage()` и `notifyAssignment()` возвращают `boolean` (true если отправлено)
- **Frontend — api/client.ts**: добавлены тип `NotificationLogItem` и функция `fetchNotificationLog()`
- **Frontend — AutomationSettings.tsx**: добавлен компонент `NotificationLogTable` — таблица с колонками Дата / Тип события / Получатель / Канал; рендерится ниже формы настроек
- **i18n.ts**: добавлены ключи `automation.logTitle/logDesc/logDate/logType/logRecipient/logChannel/logChannelSystem/logTotal/logEmpty` (RU/EN/TR)

### 4. Google Calendar — кнопка в детализации назначения

- **Frontend — Assignments.tsx**: добавлена вспомогательная функция `buildGoogleCalendarUrl()` — формирует ссылку `https://calendar.google.com/calendar/render?action=TEMPLATE&...` с предзаполненными title, dates (UTC), details (сотрудник + рабочее место), location; кнопка «Google Calendar» с иконкой `CalendarOutlined` добавлена в колонку действий для каждого назначения (открывается в новой вкладке)
- **i18n.ts**: добавлен ключ `assignments.addToGoogleCalendar` (RU/EN/TR)

**Новые файлы:**

- `backend/prisma/migrations/20260514000000_add_notification_log/migration.sql`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — модель NotificationLog, отношения
- `backend/src/hr/hr.service.ts` — инжекция NotificationsService, уведомления, date filtering
- `backend/src/hr/hr.module.ts` — импорт NotificationsModule
- `backend/src/hr/hr.controller.ts` — параметры dateFrom/dateTo
- `backend/src/automation/automation.service.ts` — logNotification, getNotificationLog
- `backend/src/automation/automation.controller.ts` — GET /notification-log
- `backend/src/telegram/telegram.service.ts` — boolean return type
- `frontend/src/api/client.ts` — NotificationLogItem, fetchNotificationLog, FetchVacationsParams
- `frontend/src/pages/HR.tsx` — VacationCalendarTab
- `frontend/src/pages/AutomationSettings.tsx` — NotificationLogTable
- `frontend/src/pages/Assignments.tsx` — Google Calendar button
- `frontend/src/i18n.ts` — новые ключи

---

## 2026-05-13 — Developer Console в сайдбаре для SUPER_ADMIN

- **Layout.tsx**: добавлен пункт «Developer console» с иконкой `SettingOutlined` для ролей `SUPER_ADMIN` и `isDevUser`; тип массива `navigationItems` расширен полем `icon?: ReactNode`; `ReactNode` добавлен в импорт `react`; `SettingOutlined` добавлен в импорт `@ant-design/icons`; Menu рендерит `icon` из каждого элемента

**Изменённые файлы:**

- `frontend/src/components/Layout.tsx`

---

## 2026-05-13 — Фаза 8: Мультиязычность (RU / EN / TR)

Реализована полная мультиязычность: русский, английский, турецкий.

**Что сделано:**

- **i18n.ts**: Полный рефакторинг — добавлены переводы `en` и `tr` для всех существующих ключей (login, layout, dashboard, workplaces, assignments, users, planner, myPlace, statistics, notifications, admin, common); добавлены новые разделы `automation`, `hr`, `dev` (Telegram + API keys) на всех трёх языках; инициализация языка из `localStorage.getItem('lang') ?? 'ru'`
- **Layout.tsx**: Добавлен `Select` с переключением RU/EN/TR — сохраняется в `localStorage('lang')`; переключатель добавлен в шапку как для worker-layout, так и для admin/manager-layout; кнопка HR в worker-шапке переведена через `t('layout.hr')`
- **HR.tsx**: Полностью переведена через `useTranslation` — TYPE_LABELS и STATUS_LABELS вычисляются через `t()` внутри компонентов; все заголовки колонок, кнопки, плейсхолдеры, подтверждения
- **AutomationSettings.tsx**: Переведена через `useTranslation` — заголовки карточек, описания, Switch labels (on/off), валидационные сообщения, кнопка сохранения; добавлен ключ `automation.hoursUnit` (ч./h./sa.)
- **DevPage.tsx**: Переведены tab labels, access-denied блок, Telegram-вкладка (все labels/help/кнопки/сообщения), API keys-вкладка (все строки), title

**Изменённые файлы:**

- `frontend/src/i18n.ts` — полный рефакторинг с EN/TR и новыми разделами
- `frontend/src/components/Layout.tsx` — Select переключатель языка в обеих шапках
- `frontend/src/pages/HR.tsx` — useTranslation для всех строк
- `frontend/src/pages/AutomationSettings.tsx` — useTranslation для всех строк
- `frontend/src/pages/DevPage.tsx` — useTranslation для tab labels, Telegram и API keys вкладок

---

## 2026-05-13 — Фаза 7: HR контур

Реализован модуль управления отпусками и заявками сотрудников.

**Что сделано:**

- **Backend — VacationRequest модель**: enums `VacationType` (VACATION/SICK_LEAVE/DAY_OFF), `VacationStatus` (PENDING/APPROVED/REJECTED); таблица `VacationRequest` с FK на User (userId, decidedById) и Org
- **Backend — hr.service.ts**: `create()`, `findAll()` (пагинация, фильтр по status/userId для менеджера), `findMine()`, `approve()`, `reject()` с опциональным комментарием
- **Backend — hr.controller.ts**: `GET /hr/vacations/my` (ПЕРВЫМ, до параметризованных), `GET /hr/vacations` (MANAGER/SUPER_ADMIN), `POST /hr/vacations`, `PATCH /hr/vacations/:id/approve`, `PATCH /hr/vacations/:id/reject`
- **Backend — hr.module.ts**: минимальный модуль (PrismaModule глобальный)
- **Backend — app.module.ts**: добавлен `HrModule`
- **Backend — migration**: `20260513210000_add_vacation_requests/migration.sql`
- **Frontend — api/client.ts**: типы `VacationType`, `VacationStatus`, `VacationRequest`, `CreateVacationPayload`; функции `createVacationRequest`, `fetchMyVacations`, `fetchVacations`, `approveVacation`, `rejectVacation`
- **Frontend — HR.tsx**: страница с двумя вкладками — «Мои заявки» (таблица + модал создания: RangePicker + Select типа + TextArea), «Команда» (для менеджера/админа — таблица с Popconfirm одобрения и Modal отклонения с комментарием, фильтр по статусу)
- **Frontend — routes/index.tsx**: маршрут `/hr`
- **Frontend — Layout.tsx**: пункт «HR» в сайдбаре для SUPER_ADMIN/MANAGER; кнопка HR в шапке для worker-layout

**Новые файлы:**

- `backend/prisma/migrations/20260513210000_add_vacation_requests/migration.sql`
- `backend/src/hr/hr.service.ts`
- `backend/src/hr/hr.controller.ts`
- `backend/src/hr/hr.module.ts`
- `frontend/src/pages/HR.tsx`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — enums VacationType/VacationStatus, модель VacationRequest, отношения в User и Org
- `backend/src/app.module.ts` — добавлен HrModule
- `frontend/src/api/client.ts` — типы и функции HR API
- `frontend/src/routes/index.tsx` — маршрут `/hr`
- `frontend/src/components/Layout.tsx` — HR в навигации и worker-шапке

---

## 2026-05-13 — Фаза 6: Интеграции (Telegram + REST API)

Реализованы Telegram-уведомления и публичный REST API с авторизацией по API-ключам.

**Что сделано:**

### Telegram-бот

- **Backend — TelegramSettings**: новая модель `TelegramSettings` (token, chatId, enabled) — глобальная настройка для всего инстанса
- **Backend — telegram.service.ts**: `getSettings()`, `updateSettings()`, `sendMessage()` (POST к Telegram Bot API через axios, parse_mode HTML), `notifyAssignment()` — форматирует сообщение по типу события с emoji
- **Backend — telegram.module.ts**: провайдер + экспорт `TelegramService`
- **Backend — automation.service.ts**: `TelegramService` инжектирован; в `notifyWithCheck()` после push-уведомления вызывается `telegram.notifyAssignment()` для событий CREATED/UPDATED/CANCELLED
- **Backend — automation.module.ts**: добавлен импорт `TelegramModule`
- **Backend — dev.controller.ts**: `GET /dev/telegram-settings`, `PUT /dev/telegram-settings`, `POST /dev/test-telegram` (отправка тестового сообщения); `TelegramService` инжектирован
- **Backend — dev.module.ts**: добавлен импорт `TelegramModule`
- **Frontend — DevPage.tsx**: вкладка «Telegram» — форма с token/chatId/switch, кнопки «Сохранить» и «Отправить тест»; доступ расширен для `SUPER_ADMIN`

### Публичный REST API (API Keys)

- **Backend — ApiKey модель**: `id, name, keyHash (SHA-256), orgId?, createdById, lastUsedAt, createdAt`; отношения добавлены в `Org` и `User`
- **Backend — api-keys.service.ts**: `create()` — генерирует 32-байтный random hex, хранит SHA-256 хэш, возвращает plaintext только при создании; `findAll()` — без keyHash; `delete()`; `validateKey()` — хэширует входящий токен и ищет в БД + обновляет `lastUsedAt`
- **Backend — api-key.guard.ts**: `CanActivate` — берёт `Authorization: Bearer <token>`, хэширует, ищет в БД, кладёт `request.apiKey` в контекст
- **Backend — api-keys.controller.ts**: `POST /api-keys`, `GET /api-keys`, `DELETE /api-keys/:id` (JWT + SUPER_ADMIN/MANAGER); `GET /public/assignments`, `GET /public/users` (ApiKeyGuard, org-scoped результат)
- **Backend — api-keys.module.ts**: оба контроллера + экспорт сервиса и guard
- **Backend — app.module.ts**: добавлены импорты `TelegramModule`, `ApiKeysModule`
- **Frontend — DevPage.tsx**: вкладка «API ключи» — форма создания ключа с названием, Alert с plaintext ключом (одноразово), список ключей с датами и кнопкой удаления через Popconfirm

**Новые файлы:**

- `backend/prisma/migrations/20260513200000_add_telegram_apikeys/migration.sql`
- `backend/src/telegram/telegram.service.ts`
- `backend/src/telegram/telegram.module.ts`
- `backend/src/api-keys/api-keys.service.ts`
- `backend/src/api-keys/api-key.guard.ts`
- `backend/src/api-keys/api-keys.controller.ts`
- `backend/src/api-keys/api-keys.module.ts`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — модели `TelegramSettings`, `ApiKey`, отношения в `Org`, `User`
- `backend/src/automation/automation.service.ts` — инжекция `TelegramService`, вызов в `notifyWithCheck`
- `backend/src/automation/automation.module.ts` — импорт `TelegramModule`
- `backend/src/dev/dev.controller.ts` — telegram-эндпоинты
- `backend/src/dev/dev.module.ts` — импорт `TelegramModule`
- `backend/src/app.module.ts` — импорт `TelegramModule`, `ApiKeysModule`
- `frontend/src/pages/DevPage.tsx` — вкладки Telegram и API ключи, расширен доступ

---

## 2026-05-13 — Фаза 5: Документооборот и файлы

Реализовано прикрепление файлов к назначениям: загрузка через multer, хранение на диске, drag & drop UI.

**Что сделано:**

- **Backend — Prisma**: модель `File` (id, originalName, filename, mimetype, size, uploadedById, createdAt), модель `AssignmentFile` (связь назначение ↔ файл); отношения `files` добавлены в `User` и `Assignment`
- **Backend — files.service.ts**: `attachToAssignment()` — сохранение метаданных и привязка к назначению; `getFilesForAssignment()` — список файлов; `getFileById()` — для скачивания; `deleteAssignmentFile()` — удаление с очисткой физического файла при отсутствии других ссылок
- **Backend — files.controller.ts**: `GET /files/:id` — скачивание файла по ID (авторизованный эндпоинт, stream через `res.download()`)
- **Backend — files.module.ts**: регистрация контроллера, провайдера, экспорт `FilesService`
- **Backend — assignments.controller.ts**: `POST /assignments/:id/files` (multer `FileInterceptor`, diskStorage, лимит 20 МБ), `GET /assignments/:id/files`, `DELETE /assignments/:id/files/:fileId`; инжектирован `FilesService`
- **Backend — assignments.module.ts**: импорт `FilesModule`
- **Backend — app.module.ts**: импорт `FilesModule`
- **Backend — package.json**: зависимость `multer ^1.4.5-lts.1`, devDependency `@types/multer ^1.4.12`
- **Frontend — api/client.ts**: тип `AttachedFile`; функции `fetchAssignmentFiles()`, `uploadAssignmentFile()`, `deleteAssignmentFile()`, `downloadFile()`
- **Frontend — FileAttachment.tsx**: компонент с Upload.Dragger (drag & drop), иконки по MIME-типу (PDF/image/Excel/Word/generic), список файлов, кнопки скачать/удалить, форматирование размера
- **Frontend — Assignments.tsx**: состояние `filesModalAssignment`, кнопка «Файлы» с иконкой скрепки в колонке действий, Modal с `FileAttachment` (`destroyOnClose`)

**Новые файлы:**

- `backend/prisma/migrations/20260513190000_add_files/migration.sql`
- `backend/src/files/files.service.ts`
- `backend/src/files/files.controller.ts`
- `backend/src/files/files.module.ts`
- `backend/uploads/.gitkeep`
- `frontend/src/components/FileAttachment.tsx`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — модели `File`, `AssignmentFile`, отношения в `User`, `Assignment`
- `backend/src/assignments/assignments.controller.ts` — файловые эндпоинты, инжекция `FilesService`
- `backend/src/assignments/assignments.module.ts` — импорт `FilesModule`
- `backend/src/app.module.ts` — импорт `FilesModule`
- `backend/package.json` — multer зависимости
- `frontend/src/api/client.ts` — типы и функции для файлов
- `frontend/src/pages/Assignments.tsx` — кнопка «Файлы» и модалка

---

## 2026-05-13 — Фаза 4: Автоматизация процессов

Реализована система автоматических уведомлений по триггерам назначений и SLA-напоминания через cron-задачу.

**Что сделано:**

- **Backend — AutomationSettings модель**: новая таблица `AutomationSettings` в Prisma — per-org настройки триггеров и напоминаний; добавлено поле `reminderSentAt` в `Assignment` для трекинга отправки
- **Backend — automation.service.ts**: метод `notifyWithCheck(orgId, ...)` — условная отправка уведомлений с проверкой настроек; метод `updateSettings()`/`getSettings()` — upsert настроек с дефолтами; `@Cron('0 * * * *')` cron-задача `sendSlaReminders()` — каждый час ищет назначения, начинающиеся через N часов, без отправленного REMINDER, рассылает напоминания и ставит `reminderSentAt`
- **Backend — automation.controller.ts**: `GET /automation/settings`, `PUT /automation/settings` — доступны только SUPER_ADMIN и MANAGER
- **Backend — automation.module.ts**: регистрация контроллера, провайдеров, экспорт `AutomationService`
- **Backend — assignments.service.ts**: все 7 вызовов `notifyMany` заменены на `automation.notifyWithCheck(orgId, ...)` — теперь каждое уведомление проверяет настройки организации
- **Backend — assignments.module.ts**: импортирует `AutomationModule`, убран прямой `NotificationsService`
- **Backend — app.module.ts**: добавлены `ScheduleModule.forRoot()` и `AutomationModule`
- **Backend — package.json**: добавлена зависимость `@nestjs/schedule: ^3.0.4`
- **Frontend — api/client.ts**: типы `AutomationSettings`, `UpdateAutomationSettingsPayload`; функции `fetchAutomationSettings()`, `updateAutomationSettings()`
- **Frontend — AutomationSettings.tsx**: страница настроек — Card «Триггеры уведомлений» (3 переключателя), Card «SLA-напоминания» (Switch + InputNumber за N часов); React Query + useMutation; disabled InputNumber когда напоминания выключены
- **Frontend — Layout.tsx**: пункт «Автоматизация» в сайдбаре для SUPER_ADMIN и MANAGER
- **Frontend — routes/index.tsx**: маршрут `/automation-settings`

**Новые файлы:**

- `backend/prisma/migrations/20260513180000_add_automation_settings/migration.sql`
- `backend/src/automation/automation.service.ts`
- `backend/src/automation/automation.controller.ts`
- `backend/src/automation/automation.module.ts`
- `frontend/src/pages/AutomationSettings.tsx`

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — модель `AutomationSettings`, поле `reminderSentAt` в `Assignment`, отношение в `Org`
- `backend/src/assignments/assignments.service.ts` — замена `NotificationsService` на `AutomationService`
- `backend/src/assignments/assignments.module.ts` — импорт `AutomationModule`
- `backend/src/app.module.ts` — `ScheduleModule.forRoot()`, `AutomationModule`
- `backend/package.json` — зависимость `@nestjs/schedule`
- `frontend/src/api/client.ts` — типы и функции для automation API
- `frontend/src/components/Layout.tsx` — пункт навигации «Автоматизация»
- `frontend/src/routes/index.tsx` — маршрут `/automation-settings`

---

## 2026-05-13 — Фаза 3: Центр уведомлений

Реализован полноценный центр уведомлений с real-time счётчиком и дропдауном в шапке.

**Что сделано:**

- **Backend — расширение enum**: добавлены типы `SYSTEM` и `REMINDER` в `NotificationType` (Prisma migration + schema)
- **Backend — notifications.service.ts**: переписан — `findForUser()` возвращает `{ items, unreadCount }` через `$transaction`; новые методы `markAsRead()`, `markAllAsRead()`, `createSystemNotification()`
- **Backend — notifications.controller.ts**: добавлены эндпоинты `GET /notifications`, `PATCH+POST /notifications/:id/read`, `PATCH+POST /notifications/read-all`, `GET /notifications/me` (compat)
- **Backend — notifications.module.ts**: зарегистрирован `NotificationsController` в модуле
- **Frontend — api/client.ts**: новые типы `NotificationsResponse`, расширен `NotificationType`; функции `fetchNotifications()`, `markNotificationRead()`, `markAllNotificationsRead()`
- **Frontend — Layout.tsx**: новый компонент `NotificationsDropdown` — Badge с unread-счётчиком, дропдаун с прокручиваемым списком уведомлений, отметка прочитанным по клику, кнопка «Прочитать все», автообновление каждые 30 секунд

**Новые файлы:**

- `backend/prisma/migrations/20260513165502_add_notification_types/migration.sql` — SQL-миграция для новых enum-значений

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — `SYSTEM`, `REMINDER` в `NotificationType`
- `backend/src/notifications/notifications.service.ts` — полная переработка
- `backend/src/notifications/notifications.controller.ts` — новые эндпоинты
- `backend/src/notifications/notifications.module.ts` — регистрация контроллера
- `frontend/src/api/client.ts` — API-функции и типы для уведомлений
- `frontend/src/components/Layout.tsx` — компонент `NotificationsDropdown`

---

## 2026-05-13 — Фаза 2: Полная адаптивность для мобильных устройств

Реализована полная мобильная адаптивность для всего приложения (от 320px).

**Что сделано:**

- **Бургер-меню** — переработан сайдер: CSS-transform-анимация вместо left-сдвига, добавлен затемняющий backdrop-оверлей с закрытием по клику, кнопка Выйти сокращается на мобиле
- **Модалки** — полный экран (100vw × 100dvh) на мобиле: flex-колонка заголовок/тело/футер, тело прокручивается, кнопки футера растягиваются на всю ширину
- **Таблицы** — гарантированный горизонтальный скролл через `.ant-table-wrapper`, `-webkit-overflow-scrolling: touch`, compact-padding на мобиле
- **Фильтры-аккордеон** — новый компонент `MobileFilters` (Collapse с иконкой фильтра): на мобиле сворачивает любые фильтры, на десктопе показывает как есть
- **KPI-карточки** — уже использовали `xs={24}` Col, доп. стили для Statistic на малых экранах
- **Popover/Dropdown** — ограничены по ширине на мобиле (90vw / 92vw)
- **Date picker** — range-picker показывает панели вертикально на мобиле
- **Recharts** — адаптирован шрифт/легенда на xs-экранах
- **320px** — проверен базовый reset, убран горизонтальный overflow на `html`

**Новые файлы:**

- `frontend/src/hooks/useIsMobile.ts` — хук с resize-листенером
- `frontend/src/components/MobileFilters.tsx` — аккордеон-обёртка для фильтров

**Изменённые файлы:**

- `frontend/src/styles/responsive.css` — полностью переписан (~230 строк)
- `frontend/src/components/Layout.tsx` — backdrop, transform-анимация сайдера, адаптивный header
- `frontend/src/pages/Statistics.tsx` — MobileFilters для блока фильтров
- `frontend/src/pages/Assignments.tsx` — MobileFilters для блока фильтров
- `frontend/src/pages/Users.tsx` — MobileFilters для блока фильтров
- `frontend/src/pages/Workplaces.tsx` — MobileFilters для поиска/статуса, кнопка добавления вынесена отдельно

---

## 2026-05-13 — Фаза 1: Расширенная аналитика и KPI dashboard

Реализована расширенная аналитика на странице Statistics. Новые возможности:

- **KPI-карточки**: сотрудники в периоде, плановые/отчётные часы, процент выполнения (gauge), количество смен, количество сотрудников без отчёта (с визуальным выделением)
- **График динамики**: линейный график плановых vs отчётных часов по дням (recharts)
- **Сводная таблица по рабочим местам**: плановые ч., отчётные ч., выполнение (цветной тег), количество сотрудников, количество смен — с сортировкой по всем колонкам
- Весь существующий функционал сохранён (таблица сотрудников, детализация, календарь отчётов, CSV-экспорт)

**Изменённые файлы:**

- `backend/src/statistics/statistics.service.ts` — добавлен метод `getKpi()`, тип `KpiResponse`; агрегация KPI-метрик, сводки по рабочим местам и дневной динамики
- `backend/src/statistics/statistics.controller.ts` — добавлен эндпоинт `GET /statistics/kpi` с `JwtAuthGuard`
- `frontend/src/api/client.ts` — добавлены типы `KpiSummary`, `KpiByWorkplace`, `KpiDynamicsPoint`, `KpiResponse`; функция `fetchKpi()`
- `frontend/src/pages/Statistics.tsx` — добавлены компоненты `KpiCards`, `DynamicsChart`, `workplaceColumns`; интегрирован recharts; сохранена вся предыдущая функциональность
- `frontend/package.json` — добавлена зависимость `recharts`

---

## 2026-05-13 — Актуальная версия с сервера (`a7a66e2`)

Синхронизация кода с production-сервера. Масштабный рефакторинг UI.

**Изменённые файлы:**

- `default.conf` — добавлен Nginx-конфиг в корень
- `docker-compose.yml` — правки конфигурации
- `frontend/nginx-conf/default.conf` — Nginx-конфиг фронтенда
- `frontend/src/nginx-conf/default.conf` — дублирующий конфиг
- `frontend/src/components/Layout.tsx` — переработка layout-компонента
- `frontend/src/index.css` — правки глобальных стилей
- `frontend/src/pages/Assignments.tsx` — доработки страницы назначений
- `frontend/src/pages/Dashboard.tsx` — переработка дашборда
- `frontend/src/pages/MyPlace.tsx` — правки личного кабинета
- `frontend/src/pages/Planner.tsx` — крупная переработка планировщика смен
- `frontend/src/pages/Statistics.tsx` — доработки страницы статистики
- `frontend/src/pages/Users.tsx` — мелкие правки
- `frontend/src/pages/Workplaces.tsx` — переработка страницы рабочих мест
- `frontend/src/styles/responsive.css` — правки адаптивных стилей

---

## 2025-12-29 — Корректировки расписания, смена рабочего места, поведение статистики (`fb60f05`)

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — добавлены поля в схему
- `backend/src/users/me.controller.ts` — правки контроллера профиля
- `frontend/src/pages/Assignments.tsx` — расширение функционала назначений
- `frontend/src/pages/MyPlace.tsx` — крупная доработка личного кабинета (корректировки расписания, запрос на смену места)
- `frontend/src/pages/Statistics.tsx` — масштабная переработка статистики

---

## 2025-12-21 — Каскадные удаления и страница инструкций (`6136741`)

**Изменённые файлы:**

- `backend/src/assignments/assignments.service.ts` — исправление каскадных удалений
- `backend/src/users/users.service.ts` — исправление каскадных удалений
- `backend/src/workplaces/workplaces.service.ts` — исправление каскадных удалений
- `frontend/src/pages/Instructions.tsx` — создание полноценной страницы инструкций
- `frontend/src/routes/index.tsx` — добавление маршрута для страницы инструкций

---

## 2025-12-20 — Рабочие отчёты, блок «Моя статистика», правки рабочих мест (`9463032`)

Крупная итерация: модуль WorkReport, рефакторинг назначений, переработка MyPlace.

**Изменённые файлы:**

- `backend/prisma/schema.prisma` — добавлена модель `WorkReport`
- `backend/src/app.module.ts` — регистрация нового модуля
- `backend/src/assignments/assignments.controller.ts` — расширение эндпоинтов
- `backend/src/assignments/assignments.service.ts` — расширение сервиса
- `backend/src/auth/auth.service.ts` — правки аутентификации
- `backend/src/notifications/email.service.ts` — правки email-уведомлений
- `backend/src/planner/planner.controller.ts` — правки
- `backend/src/planner/planner.service.ts` — правки
- `backend/src/report/report.controller.ts` — создан контроллер отчётов
- `backend/src/report/report.module.ts` — создан модуль отчётов
- `backend/src/report/report.service.ts` — создан сервис отчётов
- `backend/src/statistics/statistics.service.ts` — доработки
- `backend/src/users/me.controller.ts` — расширение профиля
- `backend/src/users/users.controller.ts` — правки
- `backend/src/users/users.service.ts` — правки
- `backend/src/workplaces/workplaces.controller.ts` — правки
- `frontend/src/api/client.ts` — расширение API-клиента
- `frontend/src/components/WorkReportCalendarModal.tsx` — создан модал для ввода рабочих часов
- `frontend/src/i18n.ts` — правки локализации
- `frontend/src/index.css` — стили
- `frontend/src/main.tsx` — правки точки входа
- `frontend/src/pages/AssignmentAdjustments.tsx` — правки
- `frontend/src/pages/Assignments.tsx` — крупная доработка
- `frontend/src/pages/MyPlace.tsx` — масштабная переработка
- `frontend/src/pages/Planner.tsx` — доработки
- `frontend/src/pages/Statistics.tsx` — доработки
- `frontend/src/pages/Users.tsx` — доработки
- `frontend/src/pages/Workplaces.tsx` — правки
- `frontend/src/styles/responsive.css` — добавлен файл адаптивных стилей

---

## 2025-12-15 — Обработка паролей и самостоятельная смена пароля (`1d7a356`)

**Изменённые файлы:**

- `backend/src/users/users.service.ts` — логика отправки пароля по email и хранения метаданных
- `frontend/src/pages/MyPlace.tsx` — форма самостоятельной смены пароля

---

## 2025-12-15 — Статистика, корректировки, цвет рабочего места, очистка кода (`4d266e8`)

Масштабный рефакторинг: добавлены модули статистики и корректировок расписания.

**Изменённые файлы:**

- `.gitignore` — обновление
- `backend/package.json` — зависимости
- `backend/prisma/schema.prisma` — крупное расширение схемы
- `backend/src/app.module.ts` — регистрация модулей
- `backend/src/assignments/assignments.controller.ts` — расширение
- `backend/src/assignments/assignments.service.ts` — расширение
- `backend/src/auth/auth.controller.ts` — правки
- `backend/src/notifications/email.service.ts` — правки
- `backend/src/notifications/notifications.module.ts` — правки
- `backend/src/planner/planner.service.ts` — крупная доработка
- `backend/src/statistics/dto/get-statistics.dto.ts` — создан DTO
- `backend/src/statistics/statistics.controller.ts` — создан контроллер
- `backend/src/statistics/statistics.module.ts` — создан модуль
- `backend/src/statistics/statistics.service.ts` — создан сервис
- `backend/src/users/dto/create-user.dto.ts` — расширение DTO
- `backend/src/users/me.controller.ts` — крупная доработка
- `backend/src/users/users.controller.ts` — правки
- `backend/src/users/users.module.ts` — правки
- `backend/src/users/users.service.ts` — правки
- `backend/src/workplaces/dto/create-workplace.dto.ts` — поле color
- `backend/src/workplaces/dto/update-workplace.dto.ts` — поле color
- `docker-compose.yml` — правки
- `frontend/index.html` — правки

---

## 2025-11-20 — Редизайн MyPlace, поток корректировок, вид планировщика (`aa67c1e`)

**Изменённые файлы:**

- Масштабный рефакторинг страниц `MyPlace`, планировщика и эндпоинтов бекенда (детали в коммите `aa67c1e`)

---

## 2025-11-08 — Dev-инструменты, настройки SMS, бекапы и логи (`fb12b89`)

**Изменённые файлы:**

- `backend/src/dev/` — страница и инструменты разработчика
- `backend/src/sms/` — модуль настроек SMS
- Инфраструктурные скрипты для бекапов и логов

---

## 2025-11-02 — 2025-11-03 — Начальная разработка ядра системы

Серия PR через GitHub Codex: базовая архитектура, JWT-аутентификация, матрица планировщика, роли пользователей, экспорт, email-уведомления.

**Ключевые модули, созданные в этот период:**

- `backend/src/auth/` — JWT-аутентификация
- `backend/src/assignments/` — назначения сотрудников
- `backend/src/planner/` — планировщик смен
- `backend/src/users/` — управление пользователями и ролями
- `backend/src/workplaces/` — рабочие места
- `backend/src/notifications/` — email-уведомления
- `frontend/src/pages/` — все основные страницы
- `frontend/src/api/client.ts` — Axios API-клиент

---

## 2025-11-01 — Инициализация проекта (`eb6773a`, `b1492c8`)

- Создана структура pnpm-монорепозитория
- Базовая сборка Armico CRM
- Первая миграция Prisma
- Docker Compose с PostgreSQL и Redis
- Примеры `.env`

---

_Следующие записи добавляются при каждом изменении кода._

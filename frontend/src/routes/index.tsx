import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { Spin } from 'antd';
import AppLayout from '../components/Layout.js';
import { useAuth } from '../context/AuthContext.js';

const Dashboard = lazy(() => import('../pages/Dashboard.js'));
const Login = lazy(() => import('../pages/Login.js'));
const MyPlace = lazy(() => import('../pages/MyPlace.js'));
const WorkplacesPage = lazy(() => import('../pages/Workplaces.js'));
const AssignmentsPage = lazy(() => import('../pages/Assignments.js'));
const PlannerPage = lazy(() => import('../pages/Planner.js'));
const UsersPage = lazy(() => import('../pages/Users.js'));
const UsersCreatePage = lazy(() => import('../pages/UsersCreate.js'));
const DevPage = lazy(() => import('../pages/DevPage.js'));
const StatisticsPage = lazy(() => import('../pages/Statistics.js'));
const AssignmentAdjustmentsPage = lazy(
  () => import('../pages/AssignmentAdjustments.js'),
);
const InstructionsPage = lazy(() => import('../pages/Instructions.js'));
const AutomationSettingsPage = lazy(
  () => import('../pages/AutomationSettings.js'),
);
const HRPage = lazy(() => import('../pages/HR.js'));
const LandingPage = lazy(() => import('../pages/Landing.js'));
const RegisterPage = lazy(() => import('../pages/Register.js'));
const RegisterSuccessPage = lazy(() => import('../pages/RegisterSuccess.js'));
const BillingPage = lazy(() => import('../pages/Billing.js'));
const SuperAdminPage = lazy(() => import('../pages/SuperAdmin.js'));
const OrgSettingsPage = lazy(() => import('../pages/OrgSettings.js'));
const AuditLogPage = lazy(() => import('../pages/AuditLog.js'));
const TermsOfServicePage = lazy(() => import('../pages/TermsOfService.js'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicy.js'));
const StatusPageComponent = lazy(() => import('../pages/StatusPage.js'));

const PageLoader = (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <Spin size="large" />
  </div>
);

const ProtectedRoute = () => {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <AppLayout />;
};

const AppRoutes = () => {
  const { token, user } = useAuth();

  const defaultPath = user?.role === 'USER' ? '/my-place' : '/dashboard';

  const element = useRoutes([
    // Корень — лендинг для гостей, редирект для залогиненных
    {
      path: '/',
      element: token ? (
        <Navigate to={defaultPath} replace />
      ) : (
        <Suspense fallback={PageLoader}>
          <LandingPage />
        </Suspense>
      ),
    },

    // /landing — алиас
    {
      path: '/landing',
      element: token ? (
        <Navigate to={defaultPath} replace />
      ) : (
        <Suspense fallback={PageLoader}>
          <LandingPage />
        </Suspense>
      ),
    },

    // Регистрация
    {
      path: '/register',
      element: token ? (
        <Navigate to={defaultPath} replace />
      ) : (
        <Suspense fallback={PageLoader}>
          <RegisterPage />
        </Suspense>
      ),
    },
    {
      path: '/register/success',
      element: (
        <Suspense fallback={PageLoader}>
          <RegisterSuccessPage />
        </Suspense>
      ),
    },

    // Страница инструкций — без авторизации
    {
      path: '/instructions',
      element: (
        <Suspense fallback={PageLoader}>
          <InstructionsPage />
        </Suspense>
      ),
    },

    // Публичные страницы
    {
      path: '/terms',
      element: (
        <Suspense fallback={PageLoader}>
          <TermsOfServicePage />
        </Suspense>
      ),
    },
    {
      path: '/privacy',
      element: (
        <Suspense fallback={PageLoader}>
          <PrivacyPolicyPage />
        </Suspense>
      ),
    },
    {
      path: '/status',
      element: (
        <Suspense fallback={PageLoader}>
          <StatusPageComponent />
        </Suspense>
      ),
    },

    // Логин
    {
      path: '/login',
      element: token ? (
        <Navigate to={defaultPath} replace />
      ) : (
        <Suspense fallback={PageLoader}>
          <Login />
        </Suspense>
      ),
    },

    // Защищённый layout
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/dashboard',
          element: (
            <Suspense fallback={PageLoader}>
              <Dashboard />
            </Suspense>
          ),
        },
        {
          path: '/my-place',
          element: (
            <Suspense fallback={PageLoader}>
              <MyPlace />
            </Suspense>
          ),
        },
        {
          path: '/workplaces',
          element: (
            <Suspense fallback={PageLoader}>
              <WorkplacesPage />
            </Suspense>
          ),
        },
        {
          path: '/assignments',
          element: (
            <Suspense fallback={PageLoader}>
              <AssignmentsPage />
            </Suspense>
          ),
        },
        {
          path: '/planner',
          element: (
            <Suspense fallback={PageLoader}>
              <PlannerPage />
            </Suspense>
          ),
        },
        {
          path: '/users',
          element: (
            <Suspense fallback={PageLoader}>
              <UsersPage />
            </Suspense>
          ),
        },
        {
          path: '/users/create',
          element: (
            <Suspense fallback={PageLoader}>
              <UsersCreatePage />
            </Suspense>
          ),
        },
        {
          path: '/statistics',
          element: (
            <Suspense fallback={PageLoader}>
              <StatisticsPage />
            </Suspense>
          ),
        },
        {
          path: '/schedule-adjustments',
          element: (
            <Suspense fallback={PageLoader}>
              <AssignmentAdjustmentsPage />
            </Suspense>
          ),
        },
        {
          path: '/automation-settings',
          element: (
            <Suspense fallback={PageLoader}>
              <AutomationSettingsPage />
            </Suspense>
          ),
        },
        {
          path: '/hr',
          element: (
            <Suspense fallback={PageLoader}>
              <HRPage />
            </Suspense>
          ),
        },
        {
          path: '/billing',
          element: (
            <Suspense fallback={PageLoader}>
              <BillingPage />
            </Suspense>
          ),
        },
        {
          path: '/org-settings',
          element: (
            <Suspense fallback={PageLoader}>
              <OrgSettingsPage />
            </Suspense>
          ),
        },
        {
          path: '/audit-log',
          element: (
            <Suspense fallback={PageLoader}>
              <AuditLogPage />
            </Suspense>
          ),
        },
        {
          path: '/super-admin',
          element: (
            <Suspense fallback={PageLoader}>
              <SuperAdminPage />
            </Suspense>
          ),
        },
        {
          path: '/dev',
          element: (
            <Suspense fallback={PageLoader}>
              <DevPage />
            </Suspense>
          ),
        },
      ],
    },

    // Все остальные URL
    {
      path: '*',
      element: token ? (
        <Navigate to={defaultPath} replace />
      ) : (
        <Navigate to="/" replace />
      ),
    },
  ]);

  return element;
};

export default AppRoutes;

import { Navigate, useRoutes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard.js';
import Login from '../pages/Login.js';
import MyPlace from '../pages/MyPlace.js';
import WorkplacesPage from '../pages/Workplaces.js';
import AssignmentsPage from '../pages/Assignments.js';
import PlannerPage from '../pages/Planner.js';
import UsersPage from '../pages/Users.js';
import UsersCreatePage from '../pages/UsersCreate.js';
import DevPage from '../pages/DevPage.js';
import StatisticsPage from '../pages/Statistics.js';
import AssignmentAdjustmentsPage from '../pages/AssignmentAdjustments.js';
import AppLayout from '../components/Layout.js';
import { useAuth } from '../context/AuthContext.js';
import InstructionsPage from '../pages/Instructions.js';
import AutomationSettingsPage from '../pages/AutomationSettings.js';
import HRPage from '../pages/HR.js';
import LandingPage from '../pages/Landing.js';
import RegisterPage from '../pages/Register.js';
import RegisterSuccessPage from '../pages/RegisterSuccess.js';
import BillingPage from '../pages/Billing.js';
import SuperAdminPage from '../pages/SuperAdmin.js';

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
      element: token ? <Navigate to={defaultPath} replace /> : <LandingPage />,
    },

    // /landing — алиас
    {
      path: '/landing',
      element: token ? <Navigate to={defaultPath} replace /> : <LandingPage />,
    },

    // Регистрация
    {
      path: '/register',
      element: token ? <Navigate to={defaultPath} replace /> : <RegisterPage />,
    },
    {
      path: '/register/success',
      element: <RegisterSuccessPage />,
    },

    // Страница инструкций — без авторизации
    {
      path: '/instructions',
      element: <InstructionsPage />,
    },

    // Логин
    {
      path: '/login',
      element: token ? <Navigate to={defaultPath} replace /> : <Login />,
    },

    // Защищённый layout (без явного path — wraps все protected routes)
    {
      element: <ProtectedRoute />,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/my-place', element: <MyPlace /> },
        { path: '/workplaces', element: <WorkplacesPage /> },
        { path: '/assignments', element: <AssignmentsPage /> },
        { path: '/planner', element: <PlannerPage /> },
        { path: '/users', element: <UsersPage /> },
        { path: '/users/create', element: <UsersCreatePage /> },
        { path: '/statistics', element: <StatisticsPage /> },
        { path: '/schedule-adjustments', element: <AssignmentAdjustmentsPage /> },
        { path: '/automation-settings', element: <AutomationSettingsPage /> },
        { path: '/hr', element: <HRPage /> },
        { path: '/billing', element: <BillingPage /> },
        { path: '/super-admin', element: <SuperAdminPage /> },
        { path: '/dev', element: <DevPage /> },
      ],
    },

    // Все остальные URL
    {
      path: '*',
      element: token ? <Navigate to={defaultPath} replace /> : <Navigate to="/" replace />,
    },
  ]);

  return element;
};

export default AppRoutes;

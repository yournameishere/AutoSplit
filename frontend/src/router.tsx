import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './features/landing/LandingPage';
import PayPage from './features/pay/PayPage';
import OwnerDashboard from './features/owner/OwnerDashboard';
import MemberDashboard from './features/member/MemberDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'pay/:teamId', element: <PayPage /> },
      { path: 'dashboard/owner', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/overview', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/teams', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/payments', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/members', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/proposals', element: <OwnerDashboard /> },
      { path: 'dashboard/owner/settings', element: <OwnerDashboard /> },
      { path: 'dashboard/member', element: <MemberDashboard /> },
      { path: 'dashboard/member/overview', element: <MemberDashboard /> },
      { path: 'dashboard/member/teams', element: <MemberDashboard /> },
      { path: 'dashboard/member/payments', element: <MemberDashboard /> },
      { path: 'dashboard/member/proposals', element: <MemberDashboard /> },
      { path: 'dashboard/member/settings', element: <MemberDashboard /> },
    ],
  },
]);



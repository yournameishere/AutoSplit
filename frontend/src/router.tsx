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
      { path: 'dashboard/member', element: <MemberDashboard /> },
    ],
  },
]);



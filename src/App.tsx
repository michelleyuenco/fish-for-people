import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './presentation/layouts/AppLayout';
import { HomePage } from './presentation/pages/HomePage';
import { SeatTrackerPage } from './presentation/pages/SeatTrackerPage';
import { RequestsPage } from './presentation/pages/RequestsPage';
import { HeadcountPage } from './presentation/pages/HeadcountPage';
import { CinemaPage } from './presentation/pages/CinemaPage';
import { useService } from './application/hooks/useService';
import { useRequests } from './application/hooks/useRequests';
import { useHeadcount } from './application/hooks/useHeadcount';
import type { TabName, HeadcountStatus } from './presentation/components/NavBar';
import type { UserRole } from './domain/models/Service';

const ROLE_STORAGE_KEY = 'fish-for-people:role';

// Map route paths to tab names
const pathToTab: Record<string, TabName> = {
  '/seats': 'seats',
  '/requests': 'requests',
  '/headcount': 'headcount',
};

const tabToPath: Record<TabName, string> = {
  seats: '/seats',
  requests: '/requests',
  headcount: '/headcount',
};

// Wrapper to get pending count (must be inside component that has serviceId)
const AppWithService: React.FC<{
  role: UserRole;
  onChangeRole: () => void;
}> = ({ role, onChangeRole }) => {
  const { serviceId, loading: serviceLoading } = useService();
  const { pendingCount } = useRequests(serviceId);
  const { counterA, counterB, discrepancies } = useHeadcount(serviceId);
  const navigate = useNavigate();
  const location = useLocation();

  const headcountStatus: HeadcountStatus = (() => {
    if (!counterA && !counterB) return 'idle';
    if (discrepancies.length > 0) return 'discrepancy';
    if (counterA && counterB) return 'ready';
    return 'one-submitted';
  })();

  // Derive active tab from current path
  const activeTab: TabName = pathToTab[location.pathname] ??
    (role === 'congregation' ? 'requests' : 'seats');

  const handleTabChange = (tab: TabName) => {
    navigate(tabToPath[tab]);
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'seats':
        return 'Seat Availability Tracker';
      case 'requests':
        return role === 'congregation' ? 'Request Assistance' : 'Needs Requests Dashboard';
      case 'headcount':
        return 'Attendance Headcount';
      default:
        return '';
    }
  };

  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Connecting to service...</p>
        </div>
      </div>
    );
  }

  // Cinema fullscreen route — rendered outside AppLayout
  if (location.pathname === '/cinema') {
    return role === 'welcome-team'
      ? <CinemaPage serviceId={serviceId} />
      : <Navigate to="/requests" replace />;
  }

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      pendingRequestCount={pendingCount}
      role={role}
      title={getPageTitle()}
      onChangeRole={onChangeRole}
      headcountStatus={headcountStatus}
      onOpenCinema={role === 'welcome-team' ? () => navigate('/cinema') : undefined}
    >
      <Routes>
        <Route path="/seats" element={
          role === 'welcome-team'
            ? <SeatTrackerPage serviceId={serviceId} />
            : <Navigate to="/requests" replace />
        } />
        <Route path="/requests" element={
          <RequestsPage serviceId={serviceId} role={role} />
        } />
        <Route path="/headcount" element={
          role === 'welcome-team'
            ? <HeadcountPage serviceId={serviceId} />
            : <Navigate to="/requests" replace />
        } />
        {/* Default redirect based on role */}
        <Route path="*" element={
          <Navigate to={role === 'congregation' ? '/requests' : '/seats'} replace />
        } />
      </Routes>
    </AppLayout>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();

  // Load role from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (saved === 'welcome-team' || saved === 'congregation') {
      setRole(saved);
    }
    setLoaded(true);
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem(ROLE_STORAGE_KEY, selectedRole);
    navigate(selectedRole === 'congregation' ? '/requests' : '/seats');
  };

  const handleChangeRole = () => {
    setRole(null);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    navigate('/');
  };

  if (!loaded) return null;

  return (
    <Routes>
      <Route path="/" element={
        role ? <Navigate to={role === 'congregation' ? '/requests' : '/seats'} replace /> : <HomePage onSelectRole={handleSelectRole} />
      } />
      <Route path="/*" element={
        role ? <AppWithService role={role} onChangeRole={handleChangeRole} /> : <Navigate to="/" replace />
      } />
    </Routes>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from './presentation/layouts/AppLayout';
import { HomePage } from './presentation/pages/HomePage';
import { SeatTrackerPage } from './presentation/pages/SeatTrackerPage';
import { RequestsPage } from './presentation/pages/RequestsPage';
import { HeadcountPage } from './presentation/pages/HeadcountPage';
import { FloorPlanPage } from './presentation/pages/FloorPlanPage';
import { ZoneInputPage } from './presentation/pages/ZoneInputPage';
import { ZonePlanPage } from './presentation/pages/ZonePlanPage';
import { useService } from './application/hooks/useService';
import { useRequests } from './application/hooks/useRequests';
import type { UserRole, TabName } from './domain/models/Service';
import { STORAGE_KEYS } from './domain/constants/storageKeys';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Derive active tab from current path (/zone-input maps to 'seats' tab)
  const activeTab: TabName = pathToTab[location.pathname] ??
    (location.pathname === '/zone-input' ? 'seats' :
    (role === 'congregation' ? 'requests' : 'seats'));

  const handleTabChange = (tab: TabName) => {
    navigate(tabToPath[tab]);
  };

  const getPageTitle = () => {
    if (location.pathname === '/zone-input') return t('zonePlan.pageTitle');
    switch (activeTab) {
      case 'seats':
        return t('pageTitle.seats');
      case 'requests':
        return role === 'congregation' ? t('pageTitle.requestsCongregation') : t('pageTitle.requestsTeam');
      case 'headcount':
        return t('pageTitle.headcount');
      default:
        return '';
    }
  };

  if (serviceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('common.connecting')}</p>
        </div>
      </div>
    );
  }

  // Full-screen routes — rendered outside AppLayout
  if (location.pathname === '/floor-plan') {
    return role === 'welcome-team'
      ? <FloorPlanPage serviceId={serviceId} />
      : <Navigate to="/requests" replace />;
  }
  if (location.pathname === '/zone-plan') {
    return role === 'welcome-team'
      ? <ZonePlanPage />
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
      onOpenFloorPlan={role === 'welcome-team' ? () => navigate('/floor-plan') : undefined}
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
        <Route path="/zone-input" element={
          role === 'welcome-team'
            ? <ZoneInputPage />
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
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
    if (saved === 'welcome-team' || saved === 'congregation') {
      setRole(saved);
    }
    setLoaded(true);
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem(STORAGE_KEYS.ROLE, selectedRole);
    navigate(selectedRole === 'congregation' ? '/requests' : '/seats');
  };

  const handleChangeRole = () => {
    setRole(null);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
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

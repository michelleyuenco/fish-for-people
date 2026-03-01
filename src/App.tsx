import React, { useState, useEffect } from 'react';
import { AppLayout } from './presentation/layouts/AppLayout';
import { HomePage } from './presentation/pages/HomePage';
import { SeatTrackerPage } from './presentation/pages/SeatTrackerPage';
import { RequestsPage } from './presentation/pages/RequestsPage';
import { HeadcountPage } from './presentation/pages/HeadcountPage';
import { useService } from './application/hooks/useService';
import { useRequests } from './application/hooks/useRequests';
import { useHeadcount } from './application/hooks/useHeadcount';
import type { TabName, HeadcountStatus } from './presentation/components/NavBar';
import type { UserRole } from './domain/models/Service';

const ROLE_STORAGE_KEY = 'fish-for-people:role';

// Wrapper to get pending count (must be inside component that has serviceId)
const AppWithService: React.FC<{
  role: UserRole;
  onChangeRole: () => void;
}> = ({ role, onChangeRole }) => {
  const { serviceId, loading: serviceLoading } = useService();
  const { pendingCount } = useRequests(serviceId);
  const { counterA, counterB, discrepancies } = useHeadcount(serviceId);

  const headcountStatus: HeadcountStatus = (() => {
    if (!counterA && !counterB) return 'idle';
    if (discrepancies.length > 0) return 'discrepancy';
    if (counterA && counterB) return 'ready';
    return 'one-submitted';
  })();

  const [activeTab, setActiveTab] = useState<TabName>(
    role === 'congregation' ? 'requests' : 'seats'
  );

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
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

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      pendingRequestCount={pendingCount}
      role={role}
      title={getPageTitle()}
      onChangeRole={onChangeRole}
      headcountStatus={headcountStatus}
    >
      {/* Content */}
      {activeTab === 'seats' && role === 'welcome-team' && (
        <SeatTrackerPage serviceId={serviceId} />
      )}
      {activeTab === 'requests' && (
        <RequestsPage serviceId={serviceId} role={role} />
      )}
      {activeTab === 'headcount' && (
        <HeadcountPage serviceId={serviceId} />
      )}
    </AppLayout>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState<UserRole | null>(null);

  // Load role from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (saved === 'welcome-team' || saved === 'congregation') {
      setRole(saved);
    }
  }, []);

  const handleSelectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem(ROLE_STORAGE_KEY, selectedRole);
  };

  const handleChangeRole = () => {
    setRole(null);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  };

  if (!role) {
    return <HomePage onSelectRole={handleSelectRole} />;
  }

  return (
    <AppWithService role={role} onChangeRole={handleChangeRole} />
  );
}

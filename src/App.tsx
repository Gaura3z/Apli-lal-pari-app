import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { PublicNavbar, PublicNavTab } from './layouts/PublicNavbar';
import { PublicFooter } from './layouts/PublicFooter';
import { AnveshanaDemoBar } from './components/AnveshanaDemoBar';
import { LoginModal } from './components/LoginModal';

// Pages
import { HomePage } from './pages/HomePage';
import { FindBusPage } from './pages/FindBusPage';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { BusStopsPage } from './pages/BusStopsPage';
import { RoutesPage } from './pages/RoutesPage';
import { HelpPage } from './pages/HelpPage';
import { AboutPage } from './pages/AboutPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { DriverLoginPage } from './pages/DriverLoginPage';

// Dashboards
import { DriverDashboard } from './components/DriverDashboard';
import { DepotManagerDashboard } from './components/DepotManagerDashboard';
import { AuthorityDashboard } from './components/AuthorityDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AdminDashboard } from './components/AdminDashboard';

import { UserRole, BusState } from './types';

export default function App() {
  const { userProfile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<PublicNavTab>(() => {
    const path = window.location.pathname;
    if (path === '/live-tracking') return 'LIVE_TRACKING';
    if (path === '/find-bus') return 'FIND_BUS';
    if (path === '/stops') return 'BUS_STOPS';
    if (path === '/routes') return 'ROUTES';
    if (path === '/help') return 'HELP';
    if (path === '/about') return 'ABOUT';
    if (path === '/staff/driver/login') return 'DRIVER_LOGIN';
    if (path === '/staff/driver') return 'STAFF_DRIVER';
    return 'HOME';
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [targetedPortalName, setTargetedPortalName] = useState<string>('');
  
  // Cross-page parameters
  const [searchParams, setSearchParams] = useState<{ from: string; to: string }>({ from: 'Pune', to: 'Lonavala' });
  const [focusedBusId, setFocusedBusId] = useState<string | undefined>(undefined);
  const [selectedBusStand, setSelectedBusStand] = useState<string | undefined>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('stand') || undefined;
  });

  // Sync activeTab with window history & URL path
  React.useEffect(() => {
    let path = '/';
    if (activeTab === 'LIVE_TRACKING') path = '/live-tracking';
    else if (activeTab === 'FIND_BUS') path = '/find-bus';
    else if (activeTab === 'BUS_STOPS') path = '/stops';
    else if (activeTab === 'ROUTES') path = '/routes';
    else if (activeTab === 'HELP') path = '/help';
    else if (activeTab === 'ABOUT') path = '/about';
    else if (activeTab === 'DRIVER_LOGIN') path = '/staff/driver/login';
    else if (activeTab === 'STAFF_DRIVER') path = '/staff/driver';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [activeTab]);

  // Handle browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/live-tracking') setActiveTab('LIVE_TRACKING');
      else if (path === '/find-bus') setActiveTab('FIND_BUS');
      else if (path === '/stops') setActiveTab('BUS_STOPS');
      else if (path === '/routes') setActiveTab('ROUTES');
      else if (path === '/help') setActiveTab('HELP');
      else if (path === '/about') setActiveTab('ABOUT');
      else if (path === '/staff/driver/login') setActiveTab('DRIVER_LOGIN');
      else if (path === '/staff/driver') setActiveTab('STAFF_DRIVER');
      else setActiveTab('HOME');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Security guard for staff portal navigation
  const handlePortalNavigation = (portalKey: string, portalName: string, requiredRole?: UserRole) => {
    // If clicking Driver Portal while unauthenticated, route straight to dedicated Driver Login
    if (portalKey === 'DRIVER') {
      if (!userProfile) {
        setActiveTab('DRIVER_LOGIN');
        return;
      }
      setActiveTab('STAFF_DRIVER');
      return;
    }

    // If not authenticated, open login modal
    if (!userProfile) {
      setTargetedPortalName(portalName);
      setLoginModalOpen(true);
      return;
    }

    // Map portalKey to PublicNavTab
    let targetTab: PublicNavTab = 'HOME';
    if (portalKey === 'PASSENGER') targetTab = 'FIND_BUS';
    else if (portalKey === 'DRIVER') targetTab = 'STAFF_DRIVER';
    else if (portalKey === 'DEPOT') targetTab = 'STAFF_DEPOT';
    else if (portalKey === 'AUTHORITY') targetTab = 'STAFF_AUTHORITY';
    else if (portalKey === 'ANALYST') targetTab = 'STAFF_ANALYST';
    else if (portalKey === 'ADMIN') targetTab = 'ADMIN';

    setActiveTab(targetTab);
  };

  const handleSearchFromHome = (from: string, to: string) => {
    setSearchParams({ from, to });
    setActiveTab('FIND_BUS');
  };

  const handleTrackBus = (bus: BusState) => {
    setFocusedBusId(bus.busId);
    setActiveTab('LIVE_TRACKING');
  };

  const handleLoginSuccess = () => {
    setLoginModalOpen(false);
    // After login, route according to authorized role
    if (userProfile) {
      switch (userProfile.role) {
        case 'DRIVER':
          setActiveTab('STAFF_DRIVER');
          break;
        case 'DEPOT_MANAGER':
          setActiveTab('STAFF_DEPOT');
          break;
        case 'AUTHORITY':
          setActiveTab('STAFF_AUTHORITY');
          break;
        case 'ANALYST':
          setActiveTab('STAFF_ANALYST');
          break;
        case 'SUPER_ADMIN':
          setActiveTab('ADMIN');
          break;
        default:
          setActiveTab('FIND_BUS');
          break;
      }
    }
  };

  // Render view content with role protection
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'HOME':
        return (
          <HomePage
            onSearch={handleSearchFromHome}
            onNavigateToPortal={handlePortalNavigation}
            onOpenLiveTracking={() => setActiveTab('LIVE_TRACKING')}
            onSelectStand={(standName) => {
              setSelectedBusStand(standName);
              setActiveTab('BUS_STOPS');
            }}
          />
        );

      case 'FIND_BUS':
        return (
          <FindBusPage
            initialFrom={searchParams.from}
            initialTo={searchParams.to}
            onTrackBus={handleTrackBus}
            onOpenBusStand={(standName) => {
              setSelectedBusStand(standName);
              setActiveTab('BUS_STOPS');
            }}
          />
        );

      case 'LIVE_TRACKING':
        return (
          <LiveTrackingPage 
            initiallySelectedBusId={focusedBusId}
            onNavigateToSearch={() => setActiveTab('FIND_BUS')}
          />
        );

      case 'BUS_STOPS':
        return (
          <BusStopsPage
            initialStopName={selectedBusStand}
            onTrackBus={handleTrackBus}
            onSelectStopToSearch={(origin, destination) => {
              setSearchParams({ from: origin, to: destination });
              setActiveTab('FIND_BUS');
            }}
          />
        );

      case 'ROUTES':
        return (
          <RoutesPage
            onSelectRouteSearch={(origin, dest) => {
              setSearchParams({ from: origin, to: dest });
              setActiveTab('FIND_BUS');
            }}
          />
        );

      case 'HELP':
        return <HelpPage />;

      case 'ABOUT':
        return <AboutPage />;

      // Dedicated Driver Authentication Route: /staff/driver/login
      case 'DRIVER_LOGIN':
        return (
          <DriverLoginPage
            onLoginSuccess={() => setActiveTab('STAFF_DRIVER')}
            onNavigateHome={() => setActiveTab('HOME')}
          />
        );

      // Protected Driver Cockpit Route: /staff/driver
      case 'STAFF_DRIVER':
        if (!userProfile) {
          return (
            <DriverLoginPage
              onLoginSuccess={() => setActiveTab('STAFF_DRIVER')}
              onNavigateHome={() => setActiveTab('HOME')}
            />
          );
        }
        if (!hasRole(['DRIVER', 'SUPER_ADMIN'])) {
          return (
            <AccessDeniedPage
              portalTitle="Driver Console"
              requiredRole="DRIVER"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => setActiveTab('DRIVER_LOGIN')}
            />
          );
        }
        return <DriverDashboard />;

      case 'STAFF_DEPOT':
        if (!userProfile) {
          return (
            <AccessDeniedPage
              portalTitle="Depot Manager Portal"
              requiredRole="DEPOT_MANAGER"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Depot Manager Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        if (!hasRole(['DEPOT_MANAGER', 'SUPER_ADMIN'])) {
          return (
            <AccessDeniedPage
              portalTitle="Depot Manager Portal"
              requiredRole="DEPOT_MANAGER"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Depot Manager Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        return <DepotManagerDashboard />;

      case 'STAFF_AUTHORITY':
        if (!userProfile) {
          return (
            <AccessDeniedPage
              portalTitle="Authority Headquarters Command"
              requiredRole="AUTHORITY"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Authority Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        if (!hasRole(['AUTHORITY', 'SUPER_ADMIN'])) {
          return (
            <AccessDeniedPage
              portalTitle="Authority Headquarters Command"
              requiredRole="AUTHORITY"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Authority Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        return <AuthorityDashboard />;

      case 'STAFF_ANALYST':
        if (!userProfile) {
          return (
            <AccessDeniedPage
              portalTitle="Analytics Portal"
              requiredRole="ANALYST"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Analytics Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        if (!hasRole(['ANALYST', 'SUPER_ADMIN'])) {
          return (
            <AccessDeniedPage
              portalTitle="Analytics Portal"
              requiredRole="ANALYST"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Analytics Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        return <AnalyticsDashboard />;

      case 'ADMIN':
        if (!userProfile) {
          return (
            <AccessDeniedPage
              portalTitle="Super Administration Portal"
              requiredRole="SUPER_ADMIN"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Super Admin Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        if (!hasRole(['SUPER_ADMIN'])) {
          return (
            <AccessDeniedPage
              portalTitle="Super Administration Portal"
              requiredRole="SUPER_ADMIN"
              onNavigateHome={() => setActiveTab('HOME')}
              onOpenLogin={() => {
                setTargetedPortalName('Super Admin Portal');
                setLoginModalOpen(true);
              }}
            />
          );
        }
        return <AdminDashboard />;

      default:
        return (
          <HomePage
            onSearch={handleSearchFromHome}
            onNavigateToPortal={handlePortalNavigation}
            onOpenLiveTracking={() => setActiveTab('LIVE_TRACKING')}
            onSelectStand={(stand) => {
              setSelectedBusStand(stand);
              setActiveTab('BUS_STOPS');
            }}
            onTrackBus={handleTrackBus}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* 1. Prototype Simulation & Evaluation Bar */}
      <AnveshanaDemoBar />

      {/* 2. Public Responsive Navbar */}
      <PublicNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenLogin={() => {
          setTargetedPortalName('Staff Authentication');
          setLoginModalOpen(true);
        }}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {renderCurrentView()}
      </main>

      {/* 4. Public Footer */}
      <PublicFooter onSelectTab={(tab) => setActiveTab(tab)} />

      {/* 5. Staff Login Modal */}
      {loginModalOpen && (
        <LoginModal
          initialPortalName={targetedPortalName}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { EmergencyTypesPage } from './pages/EmergencyTypesPage';
import { LiveGroupStatusPage } from './pages/LiveGroupStatusPage';
import { SubscriptionManagementPage } from './pages/SubscriptionManagementPage';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    alert('Logged out from SafeAlert Admin Console');
  };

  return (
    <div className="flex h-screen bg-[#F4F6FA] text-slate-800 overflow-hidden font-sans antialiased">
      {/* Deep Navy Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        activeSOSCount={5}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Pure White Header */}
        <Header
          currentTab={currentTab}
          onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        />

        {/* Dynamic Views wrapped with ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F4F6FA]">
          <ErrorBoundary>
            {currentTab === 'dashboard' && (
              <DashboardPage onNavigateToTab={(tab) => setCurrentTab(tab)} />
            )}

            {currentTab === 'users' && <UserManagementPage />}

            {currentTab === 'emergency-types' && <EmergencyTypesPage />}

            {currentTab === 'live-groups' && <LiveGroupStatusPage />}

            {currentTab === 'subscriptions' && <SubscriptionManagementPage />}

            {currentTab === 'settings' && <SettingsPage />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Log out Confirmation Modal (Matching Figma Frame) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center animate-scale-up">
            {/* Red Warning Icon */}
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Log out from App
            </h3>
            <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
              Are you sure you want to log out from this admin account?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenLogoutModal: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenLogoutModal,
  onToggleSidebar,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const titleMap: Record<string, string> = {
    dashboard: 'Dashboard',
    users: 'User Management',
    'emergency-types': 'Emergency Type',
    'live-groups': 'Live Group Status',
    subscriptions: 'Subscription Management',
    settings: 'Settings',
  };

  const currentTitle = titleMap[currentTab] || 'Dashboard';

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-800 p-2 -ml-1 rounded-lg transition-colors touch-manipulation"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-gray-800 tracking-tight truncate">
          {currentTitle}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-amber-500 hover:text-amber-600 transition-colors relative touch-manipulation"
            title="Notifications"
          >
            <svg
              className="w-5 h-5 text-amber-500 fill-amber-500"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-2">
                <span className="text-xs font-bold text-gray-800">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer whitespace-nowrap">
                  Mark all as read
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-red-700">
                  <p className="font-bold text-[11px]">SOS Alert Triggered</p>
                  <p className="text-[10px] text-red-600">Uttara Night Patrol reported Medical Emergency</p>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 text-gray-700">
                  <p className="font-bold text-[11px]">New Premium Subscription</p>
                  <p className="text-[10px] text-gray-500">Sarah Mitchell upgraded to SafeAlert Pro</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenLogoutModal}
          className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-gray-100 transition-colors touch-manipulation"
        >
          <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-xs text-white shadow-sm">
            AU
          </div>
          <span className="text-xs font-bold text-gray-800 hidden sm:inline">Admin User</span>
        </button>
      </div>
    </header>
  );
};

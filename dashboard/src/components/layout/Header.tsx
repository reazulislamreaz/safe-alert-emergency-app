import React, { useState } from 'react';
import { Menu, Bell, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onOpenLogoutModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenLogoutModal,
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
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Hamburger + Page Title Breadcrumb */}
      <div className="flex items-center gap-3">
        <button className="text-gray-500 hover:text-gray-800 p-1 rounded-lg transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-gray-800 tracking-tight">
          {currentTitle}
        </span>
      </div>

      {/* Right: Notification Bell & Admin Profile */}
      <div className="flex items-center gap-4">
        {/* Golden Bell Notification */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-amber-500 hover:text-amber-600 transition-colors relative"
            title="Notifications"
          >
            {/* Golden bell icon */}
            <svg
              className="w-5 h-5 text-amber-500 fill-amber-500"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            {/* Red notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-800">Notifications</span>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-red-700">
                  <p className="font-bold text-[11px]">🔴 SOS Alert Triggered</p>
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

        {/* Admin User Avatar & Name */}
        <div 
          onClick={onOpenLogoutModal}
          className="flex items-center gap-2.5 cursor-pointer p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-xs text-white shadow-sm">
            AU
          </div>
          <span className="text-xs font-bold text-gray-800 hidden sm:inline">
            Admin User
          </span>
        </div>
      </div>
    </header>
  );
};

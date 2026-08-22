import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  ShieldAlert, 
  Radio, 
  CreditCard, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLogoutModal: () => void;
  activeSOSCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogoutModal,
  activeSOSCount = 3,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      badge: null,
    },
    {
      id: 'emergency-types',
      label: 'Emergency Types',
      icon: ShieldAlert,
      hasDot: true,
    },
    {
      id: 'live-groups',
      label: 'Live Group Status',
      icon: Radio,
      badge: activeSOSCount > 0 ? activeSOSCount.toString() : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'subscriptions',
      label: 'Subscriptions',
      icon: CreditCard,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-60 lg:w-64 bg-[#0A1145] text-white flex flex-col flex-shrink-0 min-h-screen select-none">
      {/* Brand Header */}
      <div className="px-6 py-7 flex items-center gap-3">
        {/* Round SA Logo icon */}
        <div className="w-10 h-10 rounded-full bg-[#1D4ED8] flex items-center justify-center font-black text-sm text-white shadow-md border border-blue-400/30">
          SA
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-tight leading-tight">
            SafeAlert
          </h1>
          <p className="text-[11px] text-blue-200/70 font-medium">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md'
                  : 'text-blue-100/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-200/80'}`} />
                <span>{item.label}</span>
              </div>

              {item.hasDot && !isActive && (
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
              )}

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile User Bar */}
      <div className="p-4 border-t border-white/10 mx-2 mb-2">
        <div 
          onClick={onOpenLogoutModal}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
          title="Click to sign out"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-xs text-white border border-blue-300/30">
              AU
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight">Admin User</p>
              <p className="text-[10px] text-blue-200/60 truncate max-w-[120px]">admin@safealert.app</p>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-blue-200/50 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
};

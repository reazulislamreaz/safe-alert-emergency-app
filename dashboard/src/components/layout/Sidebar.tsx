import React from 'react';
import {
  LayoutGrid,
  Users,
  ShieldAlert,
  Radio,
  CreditCard,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLogoutModal: () => void;
  activeSOSCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogoutModal,
  activeSOSCount = 3,
  isOpen,
  onClose,
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

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(16.5rem,85vw)] bg-[#0A1145] text-white flex flex-col select-none h-full min-h-0 transform transition-transform duration-200 ease-out lg:static lg:z-auto lg:translate-x-0 lg:flex-shrink-0 lg:w-60 xl:w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 sm:px-6 py-6 sm:py-7 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1D4ED8] flex items-center justify-center font-black text-sm text-white shadow-md border border-blue-400/30 shrink-0">
            SA
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base text-white tracking-tight leading-tight">
              SafeAlert
            </h1>
            <p className="text-[11px] text-blue-200/70 font-medium">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-blue-200/70 hover:text-white hover:bg-white/10 lg:hidden touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 sm:px-4 py-2 sm:py-4 space-y-1.5 overflow-y-auto min-h-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 touch-manipulation ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-md'
                    : 'text-blue-100/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-blue-200/80'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.hasDot && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                )}

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
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

        <div className="p-3 sm:p-4 border-t border-white/10 mx-2 mb-2">
          <button
            type="button"
            onClick={onOpenLogoutModal}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group touch-manipulation"
            title="Click to sign out"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center font-bold text-xs text-white border border-blue-300/30 shrink-0">
                AU
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white leading-tight">Admin User</p>
                <p className="text-[10px] text-blue-200/60 truncate">admin@safealert.app</p>
              </div>
            </div>
            <LogOut className="w-4 h-4 text-blue-200/50 group-hover:text-red-400 transition-colors shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};

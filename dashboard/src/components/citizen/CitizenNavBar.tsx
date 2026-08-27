import React from 'react';
import { Activity, BookOpen, Shield, User, Users } from 'lucide-react';

export type CitizenTab = 'home' | 'alerts' | 'contacts' | 'journal' | 'profile';

const TABS: { id: CitizenTab; label: string; Icon: typeof Shield }[] = [
  { id: 'home', label: 'Home', Icon: Shield },
  { id: 'alerts', label: 'Alerts', Icon: Activity },
  { id: 'contacts', label: 'Contacts', Icon: Users },
  { id: 'journal', label: 'Journal', Icon: BookOpen },
  { id: 'profile', label: 'Profile', Icon: User },
];

export const CitizenNavBar: React.FC<{
  current: CitizenTab;
  onSelect: (tab: CitizenTab) => void;
}> = ({ current, onSelect }) => {
  return (
    <nav className="shrink-0 h-[60px] bg-[#F5F5F5] border-t border-[#E1E1E1] flex items-center justify-center">
      <div className="flex items-start gap-3">
        {TABS.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className="flex flex-col items-center gap-1 px-3 touch-manipulation"
            >
              <span className="relative size-5 overflow-clip">
                <Icon
                  className={`w-full h-full ${active ? 'text-[#3A67D5]' : 'text-[#888887]'}`}
                  strokeWidth={active ? 2.25 : 1.75}
                />
              </span>
              <span
                className={`text-center whitespace-nowrap ${
                  active
                    ? 'text-[10px] font-semibold leading-[15px] text-[#3A67D5]'
                    : 'text-xs font-medium leading-4 text-[#888887]'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

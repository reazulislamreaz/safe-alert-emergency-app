import React from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { authTitleClass } from './AuthShell';

interface MobileAuthLayoutProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}

export const MobileAuthLayout: React.FC<MobileAuthLayoutProps> = ({
  title,
  onBack,
  onClose,
  children,
}) => {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full bg-[#F3F4F6] overflow-x-hidden font-sans antialiased">
      <div className="relative z-10 flex min-h-screen min-h-[100dvh] items-stretch justify-center [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[390px] min-h-[100dvh] bg-white px-4 pt-4 pb-8 sm:min-h-0 sm:my-8 sm:rounded-2xl sm:shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:max-h-[calc(100dvh-4rem)] sm:overflow-y-auto">
          <header className="flex items-center justify-between gap-3 mb-8 min-h-7">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="shrink-0 p-1 -ml-1 text-[#09003B] touch-manipulation"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h1 className={`${authTitleClass} truncate`}>{title}</h1>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 p-1 text-[#09003B] touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
};

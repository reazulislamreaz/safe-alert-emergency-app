import React from 'react';

export const authInputClass =
  'w-full min-h-11 h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-base sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6] transition-colors';

export const authPrimaryBtnClass =
  'w-full min-h-11 h-11 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm shadow-blue-500/20 transition-colors touch-manipulation';

export const authTitleClass =
  'text-xl sm:text-[22px] font-bold text-gray-800 leading-tight';

export const authBackTitleClass =
  `${authTitleClass} flex items-center gap-1 -ml-1 mb-5 sm:mb-7 text-left w-full min-w-0`;

export const authOtpInputClass =
  'min-w-0 flex-1 aspect-square max-w-12 h-auto text-center text-base sm:text-lg font-semibold text-gray-800 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:border-[#3B82F6]';

export const AuthLogo: React.FC = () => (
  <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-5 sm:mb-8">
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[11px] sm:text-xs font-black tracking-tight shrink-0">
      SA
    </div>
    <span className="text-lg sm:text-[22px] font-semibold text-gray-500 tracking-tight">
      SafeAlert
    </span>
  </div>
);

interface AuthShellProps {
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full bg-[#F3F4F6] overflow-x-hidden font-sans antialiased">
      <div className="pointer-events-none fixed -top-24 -right-20 h-[280px] w-[280px] sm:h-[420px] sm:w-[420px] rounded-full bg-[#C5D0EA]/80 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -left-24 h-[300px] w-[300px] sm:h-[460px] sm:w-[460px] rounded-full bg-[#E8D7B8]/70 blur-3xl" />

      <div className="relative z-10 flex min-h-screen min-h-[100dvh] items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-8 [padding-top:max(1.5rem,env(safe-area-inset-top))] [padding-bottom:max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[420px] min-w-0 bg-white rounded-xl sm:rounded-2xl shadow-[0_12px_40px_rgba(15,23,42,0.08)] px-5 py-6 sm:px-10 sm:py-10">
          <AuthLogo />
          {children}
        </div>
      </div>
    </div>
  );
};

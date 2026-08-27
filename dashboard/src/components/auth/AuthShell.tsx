import React from 'react';

export const authInputClass =
  'w-full min-h-12 h-12 px-[17px] rounded-lg border border-[#E1E1E1] bg-white text-sm text-[#09003B] placeholder:text-[#888887] focus:outline-none focus:ring-2 focus:ring-[#3A67D5]/20 focus:border-[#3A67D5] transition-colors';

export const authPrimaryBtnClass =
  'w-full min-h-12 h-12 rounded-full bg-[#3A67D5] hover:bg-[#2F56B8] disabled:opacity-50 disabled:cursor-not-allowed text-[#DBF5FF] text-sm font-medium shadow-sm shadow-blue-500/20 transition-colors touch-manipulation';

export const authTitleClass =
  'text-lg sm:text-[18px] font-normal text-[#09003B] leading-7';

export const authBackTitleClass =
  `${authTitleClass} flex items-center gap-2 -ml-1 mb-8 sm:mb-10 text-left w-full min-w-0`;

export const authOtpInputClass =
  'min-w-0 flex-1 h-14 text-center text-base font-medium text-[#09003B] rounded-2xl border border-[#E1E1E1] focus:outline-none focus:ring-2 focus:ring-[#3A67D5]/20 focus:border-[#3A67D5] bg-white';

export const authLabelClass =
  'block text-xs font-normal text-[#09003B] mb-2';

export const authLinkClass =
  'text-xs font-normal text-[#3A67D5] hover:text-[#2F56B8] touch-manipulation';

export const authMutedClass =
  'text-xs text-[#30302F]';

export const AuthLogo: React.FC = () => (
  <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-5 sm:mb-8">
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[11px] sm:text-xs font-black tracking-tight shrink-0">
      SC
    </div>
    <span className="text-lg sm:text-[22px] font-semibold text-gray-500 tracking-tight">
      Safety Circle
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

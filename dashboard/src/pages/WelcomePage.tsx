import React from 'react';
import { authLinkClass } from '../components/auth/AuthShell';

interface WelcomePageProps {
  onCreateAccount: () => void;
  onLogin: () => void;
  onOperatorLogin: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onCreateAccount,
  onLogin,
  onOperatorLogin,
}) => {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#3A67D5] flex items-center justify-center font-sans antialiased">
      <div className="w-full max-w-[390px] min-h-[100dvh] sm:min-h-[760px] sm:my-6 sm:rounded-[32px] sm:overflow-hidden relative flex flex-col px-4 pb-8 pt-10 [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[260px] h-[260px] rounded-full bg-[#DBF5FF]/15 border border-white/20 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black tracking-tight">
                SA
              </div>
              <p className="text-2xl font-semibold tracking-tight">SafeAlert</p>
              <p className="mt-2 text-sm text-[#DBF5FF]/90">Emergency support starts here</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button type="button" onClick={onCreateAccount} className="w-full min-h-12 h-12 rounded-full bg-[#DBF5FF] text-[#09003B] text-sm font-medium touch-manipulation">
            Create Account
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="w-full min-h-12 h-12 rounded-full border border-[#DBF5FF] bg-transparent text-[#DBF5FF] text-sm font-medium touch-manipulation"
          >
            Log in
          </button>
          <button type="button" onClick={onOperatorLogin} className={`${authLinkClass} w-full text-center text-white/80 hover:text-white`}>
            Operator console
          </button>
        </div>
      </div>
    </div>
  );
};

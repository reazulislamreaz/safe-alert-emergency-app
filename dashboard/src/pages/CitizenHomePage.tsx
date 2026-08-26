import React from 'react';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

interface CitizenHomePageProps {
  user: User;
  onLogout: () => void;
  onOperatorLogin: () => void;
}

export const CitizenHomePage: React.FC<CitizenHomePageProps> = ({
  user,
  onLogout,
  onOperatorLogin,
}) => {
  return (
    <MobileAuthLayout title="SafeAlert">
      <div className="pt-4">
        <h2 className="text-2xl font-bold text-[#09003B]">You're signed in</h2>
        <p className="mt-2 text-sm text-[#30302F]">
          {user.fullName} is authenticated as a citizen account.
        </p>
        <p className={`${authMutedClass} mt-4`}>
          The operator command center is limited to dispatch admins. Use the mobile app for SOS
          alerts, or sign in with an operator account.
        </p>
        <div className="mt-8 space-y-3">
          <button type="button" onClick={onLogout} className={authPrimaryBtnClass}>
            Log out
          </button>
          <button
            type="button"
            onClick={onOperatorLogin}
            className="w-full min-h-12 h-12 rounded-full border border-[#3A67D5] text-[#3A67D5] text-sm font-medium touch-manipulation"
          >
            Operator console
          </button>
        </div>
      </div>
    </MobileAuthLayout>
  );
};

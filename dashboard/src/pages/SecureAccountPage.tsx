import React, { useState } from 'react';
import { ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { FaceIdScanner } from '../components/auth/FaceIdScanner';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

interface SecureAccountPageProps {
  setupToken: string;
  email: string;
  onBack: () => void;
  onComplete: (user: User) => void;
}

export const SecureAccountPage: React.FC<SecureAccountPageProps> = ({
  setupToken,
  email,
  onBack,
  onComplete,
}) => {
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finishWithUser = (user?: User) => {
    if (!user) {
      throw new Error('Setup succeeded but user session was not returned.');
    }
    onComplete(user);
  };

  const completeWithSession = async () => {
    api.setAuthToken(setupToken, true);
    const me = await api.getMe();
    finishWithUser(me.user);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!credentialId) {
      setErrorMessage('Please complete Face ID registration, or continue without Face ID.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.setBiometric(true, credentialId, setupToken);
      api.setFaceIdEnabled(true, email, credentialId);
      finishWithUser(data.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save Face ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      await completeWithSession();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not finish account setup.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileAuthLayout title="Secure Account" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleComplete} className="flex flex-col min-h-[520px]">
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Add Face ID (optional)</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            Your 4-digit PIN is already set. Face ID is optional and can be skipped.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[#3A67D5] bg-[#E3E8F7] h-[140px] sm:h-[148px] flex flex-col items-center justify-center gap-3.5">
          <ScanFace className="w-8 h-8 text-[#09003B]" />
          <span className="text-center">
            <span className="block text-sm font-semibold text-[#09003B]">Face ID</span>
            <span className="block text-xs text-[#30302F] mt-0.5">Biometric access</span>
          </span>
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-start">
          <FaceIdScanner
            mode="register"
            isRegistered={Boolean(credentialId)}
            onSuccess={(id) => {
              setCredentialId(id || `faceid_${Date.now()}`);
              setErrorMessage(null);
            }}
            onError={(err) => setErrorMessage(err)}
          />
        </div>

        <div className="mt-auto pt-8 space-y-2">
          <button
            type="submit"
            disabled={isLoading || !credentialId}
            className={authPrimaryBtnClass}
          >
            {isLoading ? <AuthSpinner /> : 'Complete with Face ID'}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSkip}
            className="w-full min-h-12 h-12 rounded-full border border-[#E1E1E1] bg-white text-[#09003B] text-sm font-medium touch-manipulation"
          >
            Continue without Face ID
          </button>
          <p className={`${authMutedClass} text-center`}>
            You can always log in with the PIN you created during registration.
          </p>
        </div>
      </form>
    </MobileAuthLayout>
  );
};

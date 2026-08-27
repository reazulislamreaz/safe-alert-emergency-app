import React, { useState } from 'react';
import { LockKeyhole, ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { FourDigitPinInput } from '../components/auth/FourDigitPinInput';
import { FaceIdScanner } from '../components/auth/FaceIdScanner';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

interface SecureAccountPageProps {
  setupToken: string;
  email: string;
  onBack: () => void;
  onComplete: (user: User) => void;
}

type AuthMethod = 'pin' | 'face';

export const SecureAccountPage: React.FC<SecureAccountPageProps> = ({
  setupToken,
  email,
  onBack,
  onComplete,
}) => {
  const [method, setMethod] = useState<AuthMethod>('pin');
  const [selectedPin, setSelectedPin] = useState('');
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finishWithUser = (user?: User) => {
    if (!user) {
      throw new Error('Setup succeeded but user session was not returned.');
    }
    onComplete(user);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (method === 'pin') {
      if (!/^\d{4}$/.test(selectedPin)) {
        setErrorMessage('Please enter an exactly 4-digit PIN.');
        return;
      }
      setIsLoading(true);
      try {
        const data = await api.setupPin(selectedPin, setupToken);
        finishWithUser(data.user);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to save PIN.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!credentialId) {
      setErrorMessage('Please complete Face ID registration, or switch to PIN setup.');
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

  const canComplete =
    method === 'pin' ? selectedPin.length === 4 : Boolean(credentialId);

  return (
    <MobileAuthLayout title="Secure Account" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleComplete} className="flex flex-col min-h-[520px]">
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Secure your Account</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            Choose either a 4-digit PIN or Face ID. You only need to set up one method.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setMethod('face');
              setErrorMessage(null);
            }}
            className={`h-[140px] sm:h-[148px] rounded-2xl border flex flex-col items-center justify-center gap-3.5 transition-all touch-manipulation ${
              method === 'face'
                ? 'bg-[#E3E8F7] border-[#3A67D5] shadow-sm ring-1 ring-[#3A67D5]/30'
                : 'bg-[#F5F5F5] border-[#E1E1E1] hover:bg-gray-100'
            }`}
            aria-pressed={method === 'face'}
          >
            <ScanFace className="w-8 h-8 text-[#09003B]" />
            <span className="text-center">
              <span className="block text-sm font-semibold text-[#09003B]">Face ID</span>
              <span className="block text-xs text-[#30302F] mt-0.5">Biometric access</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('pin');
              setErrorMessage(null);
            }}
            className={`h-[140px] sm:h-[148px] rounded-2xl border flex flex-col items-center justify-center gap-3.5 transition-all touch-manipulation ${
              method === 'pin'
                ? 'bg-[#E3E8F7] border-[#3A67D5] shadow-sm ring-1 ring-[#3A67D5]/30'
                : 'bg-[#F5F5F5] border-[#E1E1E1] hover:bg-gray-100'
            }`}
            aria-pressed={method === 'pin'}
          >
            <LockKeyhole className="w-8 h-8 text-[#09003B]" />
            <span className="text-center">
              <span className="block text-sm font-semibold text-[#09003B]">4-digit PIN</span>
              <span className="block text-xs text-[#30302F] mt-0.5">Code access</span>
            </span>
          </button>
        </div>

        <div className="mt-6 flex-1 flex flex-col justify-start">
          {method === 'pin' && (
            <FourDigitPinInput
              value={selectedPin}
              onChange={(pin) => {
                setSelectedPin(pin);
                setErrorMessage(null);
              }}
              label="Enter 4-digit PIN"
            />
          )}

          {method === 'face' && (
            <FaceIdScanner
              mode="register"
              isRegistered={Boolean(credentialId)}
              onSuccess={(id) => {
                setCredentialId(id || `faceid_${Date.now()}`);
                setErrorMessage(null);
              }}
              onError={(err) => setErrorMessage(err)}
            />
          )}
        </div>

        <div className="mt-auto pt-8 space-y-2">
          <button
            type="submit"
            disabled={isLoading || !canComplete}
            className={authPrimaryBtnClass}
          >
            {isLoading ? <AuthSpinner /> : 'Complete Setup'}
          </button>
          <p className={`${authMutedClass} text-center`}>
            {method === 'pin'
              ? 'Face ID is optional — you can skip it by completing with PIN only.'
              : 'PIN is optional — you can skip it by completing with Face ID only.'}
          </p>
        </div>
      </form>
    </MobileAuthLayout>
  );
};

import React, { useState } from 'react';
import { LockKeyhole, ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { OneDigitPinSelector } from '../components/auth/OneDigitPinSelector';
import { FaceIdScanner } from '../components/auth/FaceIdScanner';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authPrimaryBtnClass } from '../components/auth/AuthShell';

interface SecureAccountPageProps {
  setupToken: string;
  email: string;
  onBack: () => void;
  onComplete: (user: User) => void;
}

type SetupStep = 'pin' | 'face';

export const SecureAccountPage: React.FC<SecureAccountPageProps> = ({
  setupToken,
  email,
  onBack,
  onComplete,
}) => {
  const [step, setStep] = useState<SetupStep>('pin');
  const [selectedPin, setSelectedPin] = useState<string>('3');
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePinContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedPin || !/^\d$/.test(selectedPin)) {
      setErrorMessage('Please select a 1-digit PIN (0-9).');
      return;
    }

    setIsLoading(true);
    try {
      await api.setupPin(selectedPin, setupToken);
      setStep('face');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save PIN.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!credentialId) {
      setErrorMessage('Please complete Face ID registration to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.setBiometric(true, credentialId, setupToken);
      api.setFaceIdEnabled(true, email, credentialId);
      if (!data.user) {
        throw new Error('Face ID setup succeeded but user session was not returned.');
      }
      onComplete(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save Face ID.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'face') {
    return (
      <MobileAuthLayout title="Secure Account" onBack={() => setStep('pin')}>
        <AuthErrorBanner message={errorMessage} />
        <form onSubmit={handleFaceComplete} className="flex flex-col min-h-[520px]">
          <div>
            <h2 className="text-2xl font-bold text-[#09003B]">Set up Face ID</h2>
            <p className="mt-2 text-sm text-[#30302F]">
              Register Face ID for faster emergency access. This step is required.
            </p>
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

          <div className="mt-auto pt-8">
            <button type="submit" disabled={isLoading || !credentialId} className={authPrimaryBtnClass}>
              {isLoading ? <AuthSpinner /> : 'Complete Setup & Continue'}
            </button>
          </div>
        </form>
      </MobileAuthLayout>
    );
  }

  return (
    <MobileAuthLayout title="Secure Account" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handlePinContinue} className="flex flex-col min-h-[520px]">
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Set your 1-digit PIN</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            Choose a single digit PIN for quick emergency access. This step is required.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6 opacity-60 pointer-events-none">
          <div className="h-[100px] rounded-2xl border bg-[#F5F5F5] border-[#E1E1E1] flex flex-col items-center justify-center gap-2">
            <ScanFace className="w-7 h-7 text-[#09003B]" />
            <span className="text-xs text-[#30302F]">Face ID next</span>
          </div>
          <div className="h-[100px] rounded-2xl border bg-[#E3E8F7] border-[#3A67D5] flex flex-col items-center justify-center gap-2 ring-1 ring-[#3A67D5]/30">
            <LockKeyhole className="w-7 h-7 text-[#09003B]" />
            <span className="text-xs font-semibold text-[#09003B]">1-digit PIN</span>
          </div>
        </div>

        <div className="mt-6 flex-1">
          <OneDigitPinSelector
            value={selectedPin}
            onChange={(pin) => {
              setSelectedPin(pin);
              setErrorMessage(null);
            }}
            label="Select 1 digit PIN"
          />
        </div>

        <div className="mt-auto pt-8">
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Continue to Face ID'}
          </button>
        </div>
      </form>
    </MobileAuthLayout>
  );
};

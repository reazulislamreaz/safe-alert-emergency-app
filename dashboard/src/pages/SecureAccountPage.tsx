import React, { useState } from 'react';
import { LockKeyhole, ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { OneDigitPinSelector } from '../components/auth/OneDigitPinSelector';
import { FaceIdScanner } from '../components/auth/FaceIdScanner';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

interface SecureAccountPageProps {
  setupToken: string;
  onBack: () => void;
  onComplete: () => void;
}

export const SecureAccountPage: React.FC<SecureAccountPageProps> = ({
  setupToken,
  onBack,
  onComplete,
}) => {
  const [method, setMethod] = useState<'face' | 'pin'>('pin');
  const [selectedPin, setSelectedPin] = useState<string>('3');
  const [isFaceIdRegistered, setIsFaceIdRegistered] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (method === 'pin' && !selectedPin) {
      setErrorMessage('Please select a 1-digit PIN (1-4).');
      return;
    }

    if (method === 'face' && !isFaceIdRegistered) {
      setErrorMessage('Please scan and register your face, or select 1-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      if (method === 'face') {
        api.setFaceIdEnabled(true);
        // Also save fallback 1-digit PIN "3" or selected PIN
        await api.setupPin(selectedPin || '3', setupToken);
      } else {
        await api.setupPin(selectedPin, setupToken);
        api.setFaceIdEnabled(false);
      }

      api.logout();
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save security credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    api.logout();
    onComplete();
  };

  return (
    <MobileAuthLayout title="Secure Account" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleComplete} className="flex flex-col min-h-[520px]">
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Secure your Account</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            Choose how to quickly access SafeGuard in emergencies
          </p>
        </div>

        {/* Method Switcher Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => setMethod('face')}
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
              <span className="block text-xs text-[#30302F] mt-0.5">Fastest access</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('pin')}
            className={`h-[140px] sm:h-[148px] rounded-2xl border flex flex-col items-center justify-center gap-3.5 transition-all touch-manipulation ${
              method === 'pin'
                ? 'bg-[#E3E8F7] border-[#3A67D5] shadow-sm ring-1 ring-[#3A67D5]/30'
                : 'bg-[#F5F5F5] border-[#E1E1E1] hover:bg-gray-100'
            }`}
            aria-pressed={method === 'pin'}
          >
            <LockKeyhole className="w-8 h-8 text-[#09003B]" />
            <span className="text-center">
              <span className="block text-sm font-semibold text-[#09003B]">1-digit pin</span>
              <span className="block text-xs text-[#30302F] mt-0.5">Simple Fallback</span>
            </span>
          </button>
        </div>

        {/* Selected Method Dynamic Content */}
        <div className="mt-6 flex-1 flex flex-col justify-start">
          {method === 'pin' && (
            <OneDigitPinSelector
              value={selectedPin}
              onChange={(pin) => {
                setSelectedPin(pin);
                setErrorMessage(null);
              }}
              label="Enter 1 digit Pin"
            />
          )}

          {method === 'face' && (
            <FaceIdScanner
              mode="register"
              isRegistered={isFaceIdRegistered}
              onSuccess={() => {
                setIsFaceIdRegistered(true);
                setErrorMessage(null);
              }}
              onError={(err) => setErrorMessage(err)}
            />
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto pt-8 space-y-3">
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Complete Setup'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className={`${authMutedClass} w-full text-center py-2 hover:text-[#09003B] transition-colors touch-manipulation`}
          >
            Skip for now
          </button>
        </div>
      </form>
    </MobileAuthLayout>
  );
};

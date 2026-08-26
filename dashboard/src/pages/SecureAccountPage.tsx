import React, { useState } from 'react';
import { LockKeyhole, ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { DigitBoxes } from '../components/auth/DigitBoxes';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

const PIN_LENGTH = 4;

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
  const [pinDigits, setPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pin = pinDigits.join('');
  const activeIndex = pinDigits.findIndex((digit) => !digit);
  const selectedSlot = activeIndex === -1 ? PIN_LENGTH : activeIndex + 1;

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (method === 'face') {
      setErrorMessage('Face ID is not available in the browser. Choose a 4-digit PIN.');
      setMethod('pin');
      return;
    }

    if (pin.length !== PIN_LENGTH) {
      setErrorMessage('Enter a 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      await api.setupPin(pin, setupToken);
      api.logout();
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save PIN.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileAuthLayout title="Secure Account" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleComplete} className="flex flex-col min-h-[520px]">
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Secure your Account</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            Choose how to quickly access SafeAlert in emergencies
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-6">
          <button
            type="button"
            onClick={() => setMethod('face')}
            className={`h-[148px] rounded-2xl border flex flex-col items-center justify-center gap-4 touch-manipulation ${
              method === 'face'
                ? 'bg-[#E3E8F7] border-[#3A67D5]'
                : 'bg-[#F5F5F5] border-[#E1E1E1]'
            }`}
          >
            <ScanFace className="w-8 h-8 text-[#09003B]" />
            <span className="text-center">
              <span className="block text-sm font-semibold text-[#09003B]">Face ID</span>
              <span className="block text-xs text-[#30302F]">Fastest access</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMethod('pin')}
            className={`h-[148px] rounded-2xl border flex flex-col items-center justify-center gap-4 touch-manipulation ${
              method === 'pin'
                ? 'bg-[#E3E8F7] border-[#3A67D5]'
                : 'bg-[#F5F5F5] border-[#E1E1E1]'
            }`}
          >
            <LockKeyhole className="w-8 h-8 text-[#09003B]" />
            <span className="text-center">
              <span className="block text-sm font-semibold text-[#09003B]">4-digit PIN</span>
              <span className="block text-xs text-[#30302F]">Simple Fallback</span>
            </span>
          </button>
        </div>

        {method === 'pin' && (
          <div className="mt-6">
            <p className="text-xs text-[#09003B] mb-2">Enter 4-digit PIN</p>
            <DigitBoxes
              length={PIN_LENGTH}
              value={pinDigits}
              onChange={setPinDigits}
              autoComplete="new-password"
              masked
            />
            <p className="mt-3 text-xs text-[#00AA1D]">
              {pin ? `PIN ${Math.min(selectedSlot, PIN_LENGTH)} selected` : 'Enter each digit'}
            </p>
          </div>
        )}

        <div className="mt-auto pt-10 space-y-4">
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Complete Setup'}
          </button>
          <button
            type="button"
            onClick={() => {
              api.logout();
              onComplete();
            }}
            className={`${authMutedClass} w-full text-center touch-manipulation`}
          >
            Skip for now
          </button>
        </div>
      </form>
    </MobileAuthLayout>
  );
};

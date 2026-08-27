import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { api } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { DigitBoxes } from '../components/auth/DigitBoxes';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { authLinkClass, authMutedClass, authPrimaryBtnClass } from '../components/auth/AuthShell';

const OTP_LENGTH = 6;

interface VerifyEmailPageProps {
  email: string;
  demoCode?: string;
  onBack: () => void;
  onVerified: (token?: string) => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  email,
  demoCode,
  onBack,
  onVerified,
}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [codeHint, setCodeHint] = useState<string | undefined>(demoCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpCode = otpDigits.join('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (otpCode.length !== OTP_LENGTH) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.verifyEmailOtp(email, otpCode);
      onVerified(data.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setErrorMessage(null);
    try {
      const data = await api.sendEmailOtp(email);
      setCodeHint(data.code);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      setErrorMessage(message);
    }
  };

  return (
    <MobileAuthLayout title="Verify" onBack={onBack}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#3A67D5]/15 border border-[#3A67D5] flex items-center justify-center text-[#3A67D5]">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#09003B]">Verify your email</h2>
          <p className="mt-2 text-sm text-[#30302F]">
            We sent a 6-digit code to <span className="text-[#3A67D5] font-medium">{email}</span>
          </p>
        </div>
        <DigitBoxes length={OTP_LENGTH} value={otpDigits} onChange={setOtpDigits} />
        {codeHint && (
          <p className="text-xs text-gray-400 text-center">
            Demo verification code: <span className="font-semibold text-gray-600">{codeHint}</span>
          </p>
        )}
        <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
          {isLoading ? <AuthSpinner /> : 'Verify & Continue'}
        </button>
      </form>
      <p className={`${authMutedClass} mt-4 flex items-center justify-center gap-1.5`}>
        Didn't receive it?
        <button type="button" onClick={handleResend} className={authLinkClass}>
          Resend code
        </button>
      </p>
    </MobileAuthLayout>
  );
};

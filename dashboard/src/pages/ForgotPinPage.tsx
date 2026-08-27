import React, { useState } from 'react';
import { Check, Mail } from 'lucide-react';
import { api } from '../services/api';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { DigitBoxes } from '../components/auth/DigitBoxes';
import { OneDigitPinSelector } from '../components/auth/OneDigitPinSelector';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPrimaryBtnClass,
  authTitleClass,
} from '../components/auth/AuthShell';

const OTP_LENGTH = 6;

type ForgotPinStep = 'email' | 'otp' | 'pin' | 'success';

interface ForgotPinPageProps {
  onBackToLogin: () => void;
}

export const ForgotPinPage: React.FC<ForgotPinPageProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<ForgotPinStep>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [selectedPin, setSelectedPin] = useState<string>('3');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpCode = otpDigits.join('');

  const goBack = () => {
    setErrorMessage(null);
    if (step === 'email') {
      onBackToLogin();
      return;
    }
    if (step === 'otp') {
      setStep('email');
      return;
    }
    if (step === 'pin') {
      setStep('otp');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const data = await api.requestPinReset(email.trim());
      setDemoCode(data.code ?? null);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      setStep('otp');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (otpCode.length !== OTP_LENGTH) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await api.verifyPinResetOtp(email.trim(), otpCode);
      setSelectedPin('3');
      setStep('pin');
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
      const data = await api.requestPinReset(email.trim());
      setDemoCode(data.code ?? null);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      setErrorMessage(message);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedPin || !/^\d$/.test(selectedPin)) {
      setErrorMessage('Please select a 1-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPin(email.trim(), otpCode, selectedPin);
      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update PIN.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <MobileAuthLayout title="" onClose={onBackToLogin}>
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-16 h-16 rounded-full bg-[#00AA1D] text-white flex items-center justify-center mb-4">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
          <h1 className={`${authTitleClass} text-2xl font-bold text-[#09003B] mb-2`}>Pin Updated!</h1>
          <p className={`${authMutedClass} mb-8`}>Your 1-digit PIN has been reset successfully.</p>
          <button type="button" onClick={onBackToLogin} className={authPrimaryBtnClass}>
            Back to Login
          </button>
        </div>
      </MobileAuthLayout>
    );
  }

  return (
    <MobileAuthLayout
      title={step === 'email' ? 'Forgot PIN' : step === 'otp' ? 'Verify' : 'New PIN'}
      onBack={goBack}
    >
      <AuthErrorBanner message={errorMessage} />

      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3A67D5]/15 border border-[#3A67D5] flex items-center justify-center text-[#3A67D5]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <label htmlFor="forgot-pin-email" className={authLabelClass}>
              Email Address
            </label>
            <input
              id="forgot-pin-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@gmail.com"
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Send verification code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <p className="text-sm text-[#30302F]">
            Enter the 6-digit code sent to <span className="font-medium text-[#3A67D5]">{email}</span>
          </p>
          <DigitBoxes length={OTP_LENGTH} value={otpDigits} onChange={setOtpDigits} />
          {demoCode && (
            <p className="text-xs text-gray-400 text-center">
              Demo verification code: <span className="font-semibold text-gray-600">{demoCode}</span>
            </p>
          )}
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Verify code'}
          </button>
          <p className={`${authMutedClass} flex items-center justify-center gap-1.5`}>
            Didn't receive it?
            <button type="button" onClick={handleResend} className={authLinkClass}>
              Resend code
            </button>
          </p>
        </form>
      )}

      {step === 'pin' && (
        <form onSubmit={handleSavePin} className="space-y-6">
          <OneDigitPinSelector
            value={selectedPin}
            onChange={setSelectedPin}
            label="Select your new 1-digit PIN"
          />
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Save PIN'}
          </button>
        </form>
      )}
    </MobileAuthLayout>
  );
};

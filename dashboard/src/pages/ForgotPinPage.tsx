import React, { useState } from 'react';
import { Check, Phone } from 'lucide-react';
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

type ForgotPinStep = 'phone' | 'otp' | 'pin' | 'success';

interface ForgotPinPageProps {
  onBackToLogin: () => void;
}

export const ForgotPinPage: React.FC<ForgotPinPageProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState<ForgotPinStep>('phone');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [selectedPin, setSelectedPin] = useState<string>('3');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpCode = otpDigits.join('');

  const goBack = () => {
    setErrorMessage(null);
    if (step === 'phone') {
      onBackToLogin();
      return;
    }
    if (step === 'otp') {
      setStep('phone');
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
      const data = await api.requestPinReset(phone.trim());
      setDemoCode(data.code ?? '123456');
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
      await api.verifyPinResetOtp(phone.trim(), otpCode);
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
      const data = await api.requestPinReset(phone.trim());
      setDemoCode(data.code ?? '123456');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend code.';
      setErrorMessage(message);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!selectedPin) {
      setErrorMessage('Please select a 1-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPin(phone.trim(), otpCode, selectedPin);
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
        <div className="flex flex-col items-center text-center pt-16">
          <div className="w-[120px] h-[120px] rounded-full bg-[#00AA1D] flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </div>
          <h1 className={`${authTitleClass} text-2xl font-bold text-[#09003B] mb-2`}>Pin Updated!</h1>
          <p className="text-sm text-[#30302F] mb-16">Your Emergency Support starts here</p>
          <button type="button" onClick={onBackToLogin} className={authPrimaryBtnClass}>
            Back to Login
          </button>
        </div>
      </MobileAuthLayout>
    );
  }

  return (
    <MobileAuthLayout
      title={step === 'phone' ? 'Forget Pin' : step === 'otp' ? 'Enter OTP' : 'Set New Pin'}
      onBack={goBack}
    >
      <AuthErrorBanner message={errorMessage} />

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label htmlFor="forgot-pin-phone" className={authLabelClass}>
              Phone Number
            </label>
            <input
              id="forgot-pin-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2(555) 0000 - 0000"
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Get OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#3A67D5]/15 border border-[#3A67D5] flex items-center justify-center text-[#3A67D5]">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#09003B]">Verify your phone</h2>
            <p className="mt-2 text-sm text-[#30302F]">
              We sent a 6-digit code to <span className="text-[#3A67D5]">{phone}</span>
            </p>
          </div>
          <DigitBoxes length={OTP_LENGTH} value={otpDigits} onChange={setOtpDigits} />
          {demoCode && (
            <p className="text-xs text-gray-400 text-center">
              Demo verification code: <span className="font-semibold text-gray-600">{demoCode}</span>
            </p>
          )}
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Set New Pin'}
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
            onChange={(pin) => {
              setSelectedPin(pin);
              setErrorMessage(null);
            }}
            label="Enter 1 digit Pin"
          />
          <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
            {isLoading ? <AuthSpinner /> : 'Save New Pin'}
          </button>
        </form>
      )}
    </MobileAuthLayout>
  );
};

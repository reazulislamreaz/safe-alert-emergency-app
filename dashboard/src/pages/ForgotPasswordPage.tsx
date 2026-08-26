import React, { useRef, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import {
  AuthShell,
  authBackTitleClass,
  authInputClass,
  authOtpInputClass,
  authPrimaryBtnClass,
  authTitleClass,
} from '../components/auth/AuthShell';

type ForgotStep = 'email' | 'otp' | 'reset' | 'success';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

const OTP_LENGTH = 6;

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
}) => {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

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
    if (step === 'reset') {
      setStep('otp');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const data = await api.requestPasswordReset(email.trim());
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

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
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
      await api.verifyPasswordResetOtp(email.trim(), otpCode);
      setNewPassword('');
      setConfirmPassword('');
      setStep('reset');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(email.trim(), otpCode, newPassword);
      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const errorBanner = errorMessage ? (
    <div className="mb-4 sm:mb-5 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-xs text-red-600">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="min-w-0 break-words">{errorMessage}</span>
    </div>
  ) : null;

  const submitLabel = (idle: string) =>
    isLoading ? (
      <span className="inline-flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </span>
    ) : (
      idle
    );

  const passwordToggle = (
    visible: boolean,
    onToggle: () => void,
    hideLabel: string,
    showLabel: string,
  ) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-0 min-w-11 px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 touch-manipulation"
      aria-label={visible ? hideLabel : showLabel}
    >
      {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <AuthShell>
      {step === 'email' && (
        <>
          <button type="button" onClick={goBack} className={`${authBackTitleClass} touch-manipulation`}>
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 shrink-0" />
            <span className="min-w-0 truncate sm:whitespace-normal">Enter your Email</span>
          </button>
          {errorBanner}
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-600 mb-1.5">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={authInputClass}
              />
            </div>
            <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
              {submitLabel('Send OTP')}
            </button>
          </form>
        </>
      )}

      {step === 'otp' && (
        <>
          <button type="button" onClick={goBack} className={`${authBackTitleClass} touch-manipulation`}>
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 shrink-0" />
            <span className="min-w-0">Verify Email</span>
          </button>
          {errorBanner}
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  className={authOtpInputClass}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {demoCode && (
              <p className="text-xs text-gray-400 text-center px-1">
                Demo verification code:{' '}
                <span className="font-semibold text-gray-600">{demoCode}</span>
              </p>
            )}
            <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
              {submitLabel('Verify OTP')}
            </button>
          </form>
        </>
      )}

      {step === 'reset' && (
        <>
          <button type="button" onClick={goBack} className={`${authBackTitleClass} touch-manipulation`}>
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 shrink-0" />
            <span className="min-w-0">Reset Password</span>
          </button>
          {errorBanner}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-600 mb-1.5">
                Enter New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`${authInputClass} pr-11`}
                />
                {passwordToggle(
                  showNewPassword,
                  () => setShowNewPassword((prev) => !prev),
                  'Hide password',
                  'Show password',
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-600 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`${authInputClass} pr-11`}
                />
                {passwordToggle(
                  showConfirmPassword,
                  () => setShowConfirmPassword((prev) => !prev),
                  'Hide password',
                  'Show password',
                )}
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={`${authPrimaryBtnClass} mt-1`}>
              {submitLabel('Update Password')}
            </button>
          </form>
        </>
      )}

      {step === 'success' && (
        <div className="text-center py-1 sm:py-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#3B82F6] flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className={`${authTitleClass} mb-2`}>Password Updated</h1>
          <p className="text-sm text-gray-500 mb-6 sm:mb-8 px-1">
            Your password has been updated successfully.
          </p>
          <button type="button" onClick={onBackToLogin} className={authPrimaryBtnClass}>
            Back to Login
          </button>
        </div>
      )}
    </AuthShell>
  );
};

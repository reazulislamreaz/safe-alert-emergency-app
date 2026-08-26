import React, { useState } from 'react';
import { Eye, EyeOff, ScanFace } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authLinkClass,
  authMutedClass,
  authPrimaryBtnClass,
} from '../components/auth/AuthShell';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onForgotPin: () => void;
  onCreateAccount: () => void;
  onClose: () => void;
  onOperatorLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onForgotPin,
  onCreateAccount,
  onClose,
  onOperatorLogin,
}) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('Enter your 4-digit PIN.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login(phone, pin, true);
      onLoginSuccess(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileAuthLayout title="Log in" onClose={onClose}>
      <AuthErrorBanner message={errorMessage} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="login-phone" className={authLabelClass}>
              Phone Number
            </label>
            <input
              id="login-phone"
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2(555) 0000 - 0000"
              className={authInputClass}
            />
          </div>

          <div>
            <label htmlFor="login-pin" className={authLabelClass}>
              Pin
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 min-w-0">
                <input
                  id="login-pin"
                  type={showPin ? 'text' : 'password'}
                  required
                  inputMode="numeric"
                  autoComplete="current-password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter your 4-digit PIN"
                  className={`${authInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute inset-y-0 right-0 min-w-11 px-3 flex items-center justify-center text-[#888887] touch-manipulation"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setErrorMessage('Face ID is not available in the browser. Use your 4-digit PIN.')
                }
                className="shrink-0 size-12 rounded-lg border border-[#E1E1E1] flex items-center justify-center text-[#3A67D5] touch-manipulation"
                aria-label="Face ID"
              >
                <ScanFace className="w-6 h-6" />
              </button>
            </div>
          </div>

          <p className={`${authMutedClass} flex items-center gap-2`}>
            Forget your Pin?
            <button type="button" onClick={onForgotPin} className={authLinkClass}>
              Reset Now
            </button>
          </p>
        </div>

        <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
          {isLoading ? <AuthSpinner /> : 'Log in'}
        </button>
      </form>

      <p className={`${authMutedClass} mt-4 flex items-center justify-center gap-2`}>
        Don’t have an Account ?
        <button type="button" onClick={onCreateAccount} className={authLinkClass}>
          Create Account
        </button>
      </p>
      <p className="mt-6 text-center text-[11px] text-gray-400">
        Demo citizen: +1 (555) 234-5678 · PIN 1234
      </p>
      <p className="mt-3 text-center">
        <button type="button" onClick={onOperatorLogin} className={authLinkClass}>
          Operator console
        </button>
      </p>
    </MobileAuthLayout>
  );
};

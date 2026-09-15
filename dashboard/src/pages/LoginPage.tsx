import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login(trimmedEmail, password, true);
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
            <label htmlFor="login-email" className={authLabelClass}>
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@gmail.com"
              className={authInputClass}
            />
          </div>

          <div>
            <label htmlFor="login-password" className={authLabelClass}>
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`${authInputClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 min-w-11 px-3 flex items-center justify-center text-[#888887] hover:text-[#09003B] touch-manipulation"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className={`${authMutedClass} flex items-center gap-1.5`}>
            Forgot your password?
            <button type="button" onClick={onForgotPin} className={authLinkClass}>
              Reset Now
            </button>
          </p>
        </div>

        <button type="submit" disabled={isLoading} className={authPrimaryBtnClass}>
          {isLoading ? <AuthSpinner /> : 'Log in'}
        </button>
      </form>

      <p className={`${authMutedClass} mt-6 flex items-center justify-center gap-1.5`}>
        Don’t have an Account ?
        <button type="button" onClick={onCreateAccount} className={authLinkClass}>
          Create Account
        </button>
      </p>

      <p className="mt-6 text-center text-[11px] text-gray-400">
        Demo citizen: sarah.johnson@example.com · password 1234
      </p>
      <p className="mt-3 text-center">
        <button type="button" onClick={onOperatorLogin} className={authLinkClass}>
          Super Admin dashboard
        </button>
      </p>
    </MobileAuthLayout>
  );
};

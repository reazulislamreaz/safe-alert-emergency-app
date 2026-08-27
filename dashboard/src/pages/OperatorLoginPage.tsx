import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { AuthAudience, User } from '../types';
import {
  AuthShell,
  authInputClass,
  authPrimaryBtnClass,
  authTitleClass,
} from '../components/auth/AuthShell';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';

interface OperatorLoginPageProps {
  onLoginSuccess: (user: User, audience?: AuthAudience) => void;
  onForgotPassword: () => void;
<<<<<<< HEAD
  onBack?: () => void;
=======
>>>>>>> 0f7c5155b0c4b261a31d42807139c9a4e9b2756b
}

export const OperatorLoginPage: React.FC<OperatorLoginPageProps> = ({
  onLoginSuccess,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.dashboardLogin(email, password, rememberMe);
      onLoginSuccess(response.user, response.audience);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <h1 className={`${authTitleClass} text-center mb-5 sm:mb-7 font-semibold`}>
        Super Admin dashboard
      </h1>
      <AuthErrorBanner message={errorMessage} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ops-email" className="block text-xs text-[#09003B] mb-2">
            Email Address
          </label>
          <input
            id="ops-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Super Admin email"
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="ops-password" className="block text-xs text-[#09003B] mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="ops-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${authInputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 min-w-11 px-3 flex items-center justify-center text-gray-400 hover:text-gray-600 touch-manipulation"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-[#3A67D5] cursor-pointer"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-[#3A67D5] hover:text-[#2F56B8] touch-manipulation"
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={isLoading} className={`${authPrimaryBtnClass} mt-1`}>
          {isLoading ? <AuthSpinner /> : 'Login'}
        </button>
      </form>

<<<<<<< HEAD
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-4 w-full text-center text-xs text-[#3A67D5] touch-manipulation"
        >
          Back
        </button>
      )}

=======
>>>>>>> 0f7c5155b0c4b261a31d42807139c9a4e9b2756b
      <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
          Demo Super Admin
        </p>
        <button
          type="button"
          onClick={() => {
            setEmail('admin@safealert.app');
            setPassword('adminpassword');
            setErrorMessage(null);
          }}
          className="w-full p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-left transition-all group touch-manipulation min-w-0"
        >
          <div className="text-xs font-bold text-blue-600 group-hover:text-blue-700">Super Admin</div>
          <div className="text-[11px] text-gray-400 truncate">admin@safealert.app</div>
        </button>
      </div>
    </AuthShell>
  );
};

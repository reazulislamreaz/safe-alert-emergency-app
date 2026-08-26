import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import {
  AuthShell,
  authInputClass,
  authPrimaryBtnClass,
  authTitleClass,
} from '../components/auth/AuthShell';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onForgotPassword,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState<string>('');
  const [passwordOrPin, setPasswordOrPin] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.login(emailOrPhone, passwordOrPin, rememberMe);
      onLoginSuccess(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string, secret: string) => {
    setEmailOrPhone(email);
    setPasswordOrPin(secret);
    setErrorMessage(null);
  };

  return (
    <AuthShell>
      <h1 className={`${authTitleClass} text-center mb-5 sm:mb-7`}>
        Welcome back!
      </h1>

      {errorMessage && (
        <div className="mb-4 sm:mb-5 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-600 mb-1.5">
            Email Address
          </label>
          <input
            id="login-email"
            type="text"
            required
            autoComplete="username"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            placeholder="Enter your email"
            className={authInputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-600 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={passwordOrPin}
              onChange={(e) => setPasswordOrPin(e.target.value)}
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
              className="w-4 h-4 rounded border-gray-300 accent-[#3B82F6] cursor-pointer"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm font-medium text-[#3B82F6] hover:text-[#2563EB] touch-manipulation"
          >
            Forgot Password?
          </button>
        </div>

        <button type="submit" disabled={isLoading} className={`${authPrimaryBtnClass} mt-1`}>
          {isLoading ? (
            <span className="inline-flex items-center justify-center">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 text-center">
          Quick Switch Demo Roles
        </p>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('admin@safealert.app', 'adminpassword')}
            className="p-3 min-[480px]:p-2.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl text-left transition-all group touch-manipulation min-w-0"
          >
            <div className="text-xs min-[480px]:text-[11px] font-bold text-blue-600 group-hover:text-blue-700">
              Super Admin
            </div>
            <div className="text-[11px] min-[480px]:text-[9px] text-gray-400 truncate">
              admin@safealert.app
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('ops@safealert.app', 'opspassword')}
            className="p-3 min-[480px]:p-2.5 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-xl text-left transition-all group touch-manipulation min-w-0"
          >
            <div className="text-xs min-[480px]:text-[11px] font-bold text-emerald-600 group-hover:text-emerald-700">
              Ops Dispatcher
            </div>
            <div className="text-[11px] min-[480px]:text-[9px] text-gray-400 truncate">
              ops@safealert.app
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('sarah.johnson@example.com', '1234')}
            className="p-3 min-[480px]:p-2.5 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl text-left transition-all group touch-manipulation min-w-0"
          >
            <div className="text-xs min-[480px]:text-[11px] font-bold text-purple-600 group-hover:text-purple-700">
              Mobile Citizen
            </div>
            <div className="text-[11px] min-[480px]:text-[9px] text-gray-400 truncate">PIN: 1234</div>
          </button>
        </div>
      </div>
    </AuthShell>
  );
};

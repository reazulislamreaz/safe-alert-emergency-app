import React, { useState } from 'react';
import { Eye, EyeOff, ScanFace, X } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { MobileAuthLayout } from '../components/auth/MobileAuthLayout';
import { AuthErrorBanner, AuthSpinner } from '../components/auth/AuthFeedback';
import { FaceIdScanner } from '../components/auth/FaceIdScanner';
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
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFaceIdModalOpen, setIsFaceIdModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pin || !/^\d{1,4}$/.test(pin)) {
      setErrorMessage('Please enter your 1-digit security PIN (or 4-digit PIN).');
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

  const handleFaceIdSuccess = async () => {
    setIsFaceIdModalOpen(false);
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.loginWithFaceId(phone);
      onLoginSuccess(response.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Face ID failed. Please enter your PIN.';
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
                  placeholder="Enter your 1 digit pin"
                  className={`${authInputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  className="absolute inset-y-0 right-0 min-w-11 px-3 flex items-center justify-center text-[#888887] hover:text-[#09003B] touch-manipulation"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Face ID Trigger Button */}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setIsFaceIdModalOpen(true);
                }}
                className="shrink-0 size-12 rounded-lg border border-[#E1E1E1] bg-white hover:bg-[#F4F7FC] hover:border-[#3A67D5] flex items-center justify-center text-[#3A67D5] transition-colors touch-manipulation shadow-sm"
                aria-label="Authenticate with Face ID"
                title="Authenticate with Face ID"
              >
                <ScanFace className="w-6 h-6" />
              </button>
            </div>
          </div>

          <p className={`${authMutedClass} flex items-center gap-1.5`}>
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

      <p className={`${authMutedClass} mt-6 flex items-center justify-center gap-1.5`}>
        Don’t have an Account ?
        <button type="button" onClick={onCreateAccount} className={authLinkClass}>
          Create Account
        </button>
      </p>

      <p className="mt-6 text-center text-[11px] text-gray-400">
        Demo citizen: +1 (555) 234-5678 · PIN 1234 or Face ID
      </p>
      <p className="mt-3 text-center">
        <button type="button" onClick={onOperatorLogin} className={authLinkClass}>
          Operator console
        </button>
      </p>

      {/* Face ID Authentication Modal */}
      {isFaceIdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 relative">
            <button
              type="button"
              onClick={() => setIsFaceIdModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 touch-manipulation"
              aria-label="Close Face ID modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#09003B] text-center mb-1">Face ID Login</h3>
            <p className="text-xs text-gray-500 text-center mb-6">
              Position your face in the camera frame to authenticate
            </p>

            <FaceIdScanner
              mode="authenticate"
              onSuccess={handleFaceIdSuccess}
              onError={(err) => {
                setErrorMessage(err);
                setIsFaceIdModalOpen(false);
              }}
            />

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsFaceIdModalOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium touch-manipulation"
              >
                Cancel & use PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileAuthLayout>
  );
};

import React, { useState } from 'react';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [emailOrPhone, setEmailOrPhone] = useState<string>('admin@safealert.app');
  const [passwordOrPin, setPasswordOrPin] = useState<string>('adminpassword');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.login(emailOrPhone, passwordOrPin);
      onLoginSuccess(response.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
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
    <div className="min-h-screen w-full bg-[#0B1528] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Background radial glowing effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* SafeAlert Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            SafeAlert <span className="text-blue-400">Command Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Emergency Response & Incident Dispatch Console
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#132238]/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign In</h2>
            <p className="text-xs text-slate-400">
              Enter your authorized operator credentials to access live dispatch.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Phone Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="admin@safealert.app or +1 555 234 5678"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B1528] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password or PIN Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password or 4-Digit Security PIN
                </label>
                <span className="text-[10px] text-slate-400">
                  PIN or Admin Password
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordOrPin}
                  onChange={(e) => setPasswordOrPin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B1528] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Switch Demo Roles
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@safealert.app', 'adminpassword')}
                className="p-2.5 bg-[#0B1528] hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                  Super Admin
                </div>
                <div className="text-[9px] text-slate-400 truncate">admin@safealert.app</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('ops@safealert.app', 'opspassword')}
                className="p-2.5 bg-[#0B1528] hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                  Ops Dispatcher
                </div>
                <div className="text-[9px] text-slate-400 truncate">ops@safealert.app</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('sarah.johnson@example.com', '1234')}
                className="p-2.5 bg-[#0B1528] hover:bg-slate-800/80 border border-slate-700 rounded-xl text-left transition-all group"
              >
                <div className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">
                  Mobile Citizen
                </div>
                <div className="text-[9px] text-slate-400 truncate">PIN: 1234</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <KeyRound className="w-3.5 h-3.5" />
          <span>256-Bit Encrypted JWT & Real-Time Socket Handshake Auth</span>
        </div>
      </div>
    </div>
  );
};

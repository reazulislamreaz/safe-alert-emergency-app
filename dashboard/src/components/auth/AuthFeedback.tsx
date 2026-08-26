import React from 'react';
import { AlertCircle } from 'lucide-react';

export const AuthErrorBanner: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-xs text-red-600">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
};

export const AuthSpinner: React.FC = () => (
  <span className="inline-flex items-center justify-center">
    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  </span>
);

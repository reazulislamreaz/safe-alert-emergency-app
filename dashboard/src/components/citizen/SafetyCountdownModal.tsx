import React, { useEffect, useState, useMemo } from 'react';
import { Timer, ShieldCheck, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';
import { SafetyCountdownState } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface SafetyCountdownModalProps {
  currentCountdown: SafetyCountdownState | null;
  onUpdate: (countdown: SafetyCountdownState | null) => void;
  onClose: () => void;
}

export const SafetyCountdownModal: React.FC<SafetyCountdownModalProps> = ({
  currentCountdown,
  onUpdate,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<SafetyCountdownState | null>(currentCountdown);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setCountdown(currentCountdown);
  }, [currentCountdown]);

  // Tick every second to derive live authoritative time remaining
  useEffect(() => {
    if (!countdown || countdown.status !== 'ACTIVE') return;
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [countdown]);

  const remainingSeconds = useMemo(() => {
    if (!countdown?.expiresAt || countdown.status !== 'ACTIVE') return 0;
    const expiry = new Date(countdown.expiresAt).getTime();
    return Math.max(0, Math.ceil((expiry - now) / 1000));
  }, [countdown, now]);

  const formattedTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [remainingSeconds]);

  const formattedExpiryTime = useMemo(() => {
    if (!countdown?.expiresAt) return '';
    try {
      return new Date(countdown.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [countdown?.expiresAt]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.startSafetyCountdown(notes.trim() || undefined);
      setCountdown(data);
      onUpdate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start safety countdown.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSafe = async () => {
    if (!countdown?.id) return;
    setLoading(true);
    setError(null);
    try {
      await api.confirmSafetyCountdown(countdown.id);
      setCountdown(null);
      onUpdate(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm safe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!countdown?.id) return;
    setLoading(true);
    setError(null);
    try {
      await api.cancelSafetyCountdown(countdown.id);
      setCountdown(null);
      onUpdate(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel countdown.');
    } finally {
      setLoading(false);
    }
  };

  const isActive = countdown?.status === 'ACTIVE' && remainingSeconds > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E1E1E1] pb-3">
          <div className="flex items-center gap-2">
            <Timer className="size-5 text-[#3A67D5]" />
            <h3 className="text-base font-bold text-[#09003B]">30-Minute Safety Check</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#888887] hover:bg-[#F5F5F5] touch-manipulation"
          >
            <X className="size-5" />
          </button>
        </div>

        <AuthErrorBanner message={error} />

        {isActive ? (
          <div className="text-center space-y-5 py-2">
            <div className="relative size-44 mx-auto rounded-full bg-[#EBF0FF] border-4 border-[#3A67D5] flex flex-col items-center justify-center shadow-inner">
              <span className="text-[11px] font-bold text-[#3A67D5] uppercase tracking-wider">Remaining</span>
              <span className="text-4xl font-black font-mono text-[#09003B] tracking-tight">{formattedTime}</span>
              {formattedExpiryTime && (
                <span className="text-[11px] text-[#64748B] mt-1">Until {formattedExpiryTime}</span>
              )}
            </div>

            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-2xl text-xs text-[#92400E] text-left flex items-start gap-2">
              <AlertTriangle className="size-4 shrink-0 text-[#D97706] mt-0.5" />
              <p>
                Confirm you are safe before the timer expires. If you do not respond, your Safety Circle will be automatically alerted with an SOS emergency alert.
              </p>
            </div>

            {countdown.notes && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left text-xs">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Note:</span>
                <p className="text-[#09003B] mt-0.5">{countdown.notes}</p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmSafe}
                className="w-full h-13 rounded-full bg-[#00AA1D] hover:bg-[#009218] text-white text-base font-bold flex items-center justify-center gap-2 touch-manipulation shadow-md disabled:opacity-50"
              >
                <CheckCircle className="size-5" />
                {loading ? 'Confirming…' : "I'M SAFE"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="w-full h-11 rounded-full border border-[#E1E1E1] text-xs font-semibold text-[#888887] hover:bg-[#F8FAFC] touch-manipulation"
              >
                Cancel Countdown
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-4">
            <div className="size-16 rounded-full bg-[#EBF0FF] text-[#3A67D5] mx-auto flex items-center justify-center">
              <ShieldCheck className="size-8" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-[#09003B]">Entering an uncertain situation?</h4>
              <p className="text-xs text-[#64748B]">
                Start a 30-minute safety timer. If you don't mark yourself safe before it runs out, SafeAlert will automatically escalate an alert to your Safety Circle.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#09003B] mb-1">
                Optional Note / Activity (e.g. Walking to parking lot)
              </label>
              <input
                type="text"
                placeholder="Where are you or what are you doing?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                className="w-full bg-[#F5F5F5] border border-[#E1E1E1] rounded-2xl px-3.5 py-2.5 text-xs text-[#09003B] placeholder-gray-400 focus:outline-none focus:border-[#3A67D5]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-[#3A67D5] hover:bg-[#2F54B5] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation shadow-md disabled:opacity-50"
            >
              {loading ? <AuthSpinner /> : <Timer className="size-4" />}
              {loading ? 'Starting Check…' : 'Start 30-Minute Check'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

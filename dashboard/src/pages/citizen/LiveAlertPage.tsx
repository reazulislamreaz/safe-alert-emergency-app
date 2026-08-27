import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronLeft, MapPin, MessageCircle, Video } from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { AlertResponderView } from '../../types';
import { LiveTacticalMap } from '../../components/common/LiveTacticalMap';
import { AuthErrorBanner } from '../../components/auth/AuthFeedback';

function initialsFrom(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function durationFrom(iso?: string) {
  if (!iso) return '00:00';
  const total = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

interface LiveAlertPageProps {
  alertId: string;
  onBack: () => void;
  onJoinCall: () => void;
  onMessage: () => void;
}

export const LiveAlertPage: React.FC<LiveAlertPageProps> = ({
  alertId,
  onBack,
  onJoinCall,
  onMessage,
}) => {
  const [alert, setAlert] = useState<AlertResponderView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    api
      .getResponderView(alertId)
      .then((data) => {
        if (mounted) setAlert(data as AlertResponderView);
      })
      .catch((err: unknown) => {
        if (mounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not load live alert.');
        }
      });
    socketService.joinAlertRoom(alertId);
    const off = socketService.on('alert:state', (next: AlertResponderView) => {
      if (next?.id === alertId) {
        setAlert((current) => ({ ...(current || next), ...next }));
      }
    });
    return () => {
      mounted = false;
      off();
    };
  }, [alertId]);

  const timer = useMemo(() => durationFrom(alert?.triggeredAt), [alert?.triggeredAt, now]);

  const respond = async (action: 'RESPONDING' | 'CANT_HELP') => {
    setIsActing(true);
    setErrorMessage(null);
    try {
      const data = (await api.respondToAlert(alertId, action)) as AlertResponderView;
      setAlert(data);
      if (action === 'CANT_HELP') {
        onBack();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update response.');
    } finally {
      setIsActing(false);
    }
  };

  if (!alert && !errorMessage) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-[#3A67D5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="h-full bg-white px-4 pt-16">
        <AuthErrorBanner message={errorMessage} />
        <button type="button" onClick={onBack} className="text-sm text-[#3A67D5]">
          Back to Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-5 flex items-center justify-between border-b border-[#E1E1E1] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="size-9 rounded-[18px] flex items-center justify-center touch-manipulation"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5 text-[#09003B]" />
        </button>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#EB0909]" />
          <p className="text-sm font-bold text-[#EB0909]">{alert.title || 'LIVE ALERT'}</p>
        </div>
        <p className="text-sm font-bold text-[#EB0909] tabular-nums w-10 text-right">{timer}</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4 space-y-6">
        <AuthErrorBanner message={errorMessage} />
        <div className="flex gap-3">
          <div className="size-14 rounded-2xl bg-[#EBF0FF] border border-[#3A67D5] flex items-center justify-center shrink-0">
            <span className="text-xl font-black text-[#3A67D5]">{initialsFrom(alert.userName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-[#09003B] leading-6">{alert.userName}</p>
            <p className="text-xs text-[#30302F]">{alert.groupLabel}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs font-semibold text-[#EB0909]">
                {alert.emergencyType}
              </span>
              <span className="rounded-full bg-[#FEF2F2] px-2 py-0.5 text-xs font-semibold text-[#EB0909]">
                {alert.mode === 'EMERGENCY' ? 'Emergency Mode' : alert.modeLabel || 'Emergency Mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-[#09003B] h-[220px]">
          <LiveTacticalMap
            lat={alert.location.latitude}
            lng={alert.location.longitude}
            groupName={alert.userName}
            category={alert.emergencyType}
            showGps={false}
            className="w-full h-full rounded-none border-0"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-8 rounded-full bg-red-600/10" />
              <div className="relative size-8 rounded-full bg-[#DC2626] shadow-[0_0_10px_rgba(220,38,38,0.6)] flex items-center justify-center">
                <span className="text-[10px] font-black text-white">SOS</span>
              </div>
            </div>
          </div>
          <div className="absolute left-3 right-3 bottom-3 h-8 rounded-[18px] bg-[#F5F5F5] flex items-center gap-2 px-3">
            <MapPin className="size-4 text-[#3A67D5] shrink-0" />
            <p className="flex-1 text-xs text-[#09003B] truncate">{alert.location.address}</p>
            <span className="size-2 rounded-full bg-[#00AA1D] shrink-0" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onJoinCall}
            className="flex-1 h-[72px] rounded-2xl bg-[#EBF0FF] flex flex-col items-center justify-center gap-1.5 touch-manipulation"
          >
            <Video className="size-5 text-[#3A67D5]" />
            <span className="text-xs font-semibold text-[#3A67D5]">{alert.actions.joinCallLabel}</span>
          </button>
          <button
            type="button"
            onClick={onMessage}
            className="flex-1 h-[72px] rounded-2xl bg-[#F0FDF4] flex flex-col items-center justify-center gap-1.5 touch-manipulation"
          >
            <MessageCircle className="size-5 text-[#00AA1D]" />
            <span className="text-xs font-semibold text-[#00AA1D]">{alert.actions.messageLabel}</span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-6 pt-2 space-y-4 shrink-0">
        {alert.responding ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[#F0FDF4] px-4 py-3.5">
            <CheckCircle className="size-5 text-[#00AA1D] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#09003B]">
                {alert.respondingTitle || "You're responding"}
              </p>
              <p className="text-xs text-[#30302F]">
                {alert.respondingBody || `${alert.userName.split(' ')[0]} has been notified you're on the way`}
              </p>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={isActing}
              onClick={() => respond('RESPONDING')}
              className="w-full h-12 rounded-full bg-[#00AA1D] text-[#DBF5FF] text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              <CheckCircle className="size-5" />
              {alert.actions.respondLabel}
            </button>
            <button
              type="button"
              disabled={isActing}
              onClick={() => respond('CANT_HELP')}
              className="w-full h-12 rounded-full border border-[#E1E1E1] text-sm font-semibold text-[#888887] disabled:opacity-50 touch-manipulation"
            >
              {alert.actions.declineLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

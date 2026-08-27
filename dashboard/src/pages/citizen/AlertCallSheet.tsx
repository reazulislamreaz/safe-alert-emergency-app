import React, { useEffect, useMemo, useState } from 'react';
import { PhoneOff } from 'lucide-react';
import { api } from '../../services/api';
import { AuthErrorBanner } from '../../components/auth/AuthFeedback';

interface AlertCallSheetProps {
  alertId: string;
  onBack: () => void;
}

export const AlertCallSheet: React.FC<AlertCallSheetProps> = ({ alertId, onBack }) => {
  const [title, setTitle] = useState('LIVE EMERGENCY CALL');
  const [groupLabel, setGroupLabel] = useState('Emergency Group');
  const [participants, setParticipants] = useState<
    { id: string; name: string; initials: string; status: string; isSender?: boolean; color: string }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    api
      .getAlertCall(alertId)
      .then((data) => {
        setTitle(data.title || 'LIVE EMERGENCY CALL');
        setGroupLabel(data.groupLabel || 'Emergency Group');
        setParticipants(data.participants || []);
      })
      .catch((err: unknown) => {
        setErrorMessage(err instanceof Error ? err.message : 'Could not join call.');
      });
  }, [alertId]);

  const timer = useMemo(() => {
    const total = Math.max(0, Math.floor((now - startedAt) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [now, startedAt]);

  return (
    <div className="h-full bg-[#09003B] text-white flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#EB0909]">● {title}</p>
          <p className="text-sm font-semibold mt-0.5">{groupLabel}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums">{timer}</div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AuthErrorBanner message={errorMessage} />
        <div className="grid grid-cols-2 gap-3">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 min-h-[140px] flex flex-col items-center justify-center gap-2"
            >
              <div
                className="size-14 rounded-2xl flex items-center justify-center text-lg font-black"
                style={{ backgroundColor: `${participant.color}22`, color: participant.color }}
              >
                {participant.initials}
              </div>
              <p className="text-xs font-semibold text-center">
                {participant.isSender ? `You (${participant.name.split(' ')[0]}) — Sender` : participant.name}
              </p>
              <p className="text-[10px] text-white/60">{participant.status}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-5">
        <button
          type="button"
          onClick={onBack}
          className="w-full h-12 rounded-full bg-[#EB0909] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation"
        >
          <PhoneOff className="size-4" />
          Leave Call
        </button>
      </div>
    </div>
  );
};

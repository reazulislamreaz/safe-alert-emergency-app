import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { AuthErrorBanner, AuthSpinner } from '../../components/auth/AuthFeedback';
import { RemoteStreamInfo, ZegoCallSession } from '../../services/zegoCall';
import { ActiveAlert } from '../../types';

interface AlertCallSheetProps {
  alertId: string;
  onBack: () => void;
}

type CallParticipant = {
  id: string;
  name: string;
  displayName?: string;
  initials: string;
  status: string;
  statusLabel?: string;
  isSender?: boolean;
  color: string;
};

type QuickResponse = {
  key: string;
  label: string;
  text: string;
};

export const AlertCallSheet: React.FC<AlertCallSheetProps> = ({ alertId, onBack }) => {
  const [title, setTitle] = useState('LIVE EMERGENCY CALL');
  const [groupLabel, setGroupLabel] = useState('Emergency Group');
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [isSender, setIsSender] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamInfo[]>([]);
  const [quickBusyKey, setQuickBusyKey] = useState<string | null>(null);
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());

  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sessionRef = useRef<ZegoCallSession | null>(null);
  const participantIdRef = useRef<string | null>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timer = useMemo(() => {
    const total = Math.max(0, Math.floor((now - startedAt) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [now, startedAt]);

  const syncParticipantsFromAlert = useCallback((alert: ActiveAlert) => {
    if (!alert?.activeCallParticipants) return;
    setParticipants(alert.activeCallParticipants as CallParticipant[]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const joinCall = async () => {
      setIsJoining(true);
      setErrorMessage(null);

      try {
        const data = await api.getAlertCall(alertId);
        if (cancelled) return;

        setTitle(data.title || 'LIVE EMERGENCY CALL');
        setGroupLabel(data.groupLabel || 'Emergency Group');
        setParticipants(data.participants || []);
        setQuickResponses(data.quickResponses || []);
        setLocalUserId(data.userId || null);
        setDemoMode(Boolean(data.demo) || !data.token || !data.appId);

        const selfParticipantId = data.userId ? `part-${data.userId}` : null;
        participantIdRef.current = selfParticipantId;
        setIsSender(
          Boolean(
            data.userId &&
              (data.participants || []).some(
                (participant: CallParticipant) =>
                  Boolean(participant.isSender) && participant.id === `part-${data.userId}`,
              ),
          ),
        );

        if (selfParticipantId) {
          try {
            const updated = await api.updateAlertParticipant(alertId, {
              participantId: selfParticipantId,
              status: 'CONNECTED',
            });
            if (!cancelled && updated?.activeCallParticipants) {
              setParticipants(updated.activeCallParticipants as CallParticipant[]);
            }
          } catch {
            // Participant sync should not block media join.
          }
        }

        socketService.joinAlertRoom(alertId);

        if (data.demo || !data.token || !data.appId) {
          setConnected(false);
          setErrorMessage(
            'ZegoCloud is not configured on the server (demo mode). Video will be unavailable until ZEGO_APP_ID and ZEGO_SERVER_SECRET are set.',
          );
          return;
        }

        // Wait one frame so the local video container is mounted.
        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => resolve());
        });
        if (cancelled || !localVideoRef.current) {
          throw new Error('Local video container is not ready.');
        }

        const session = new ZegoCallSession({
          onRemoteStreamsChange: (streams) => {
            if (!cancelled) setRemoteStreams(streams);
          },
          onConnectionChange: (isConnected) => {
            if (!cancelled) setConnected(isConnected);
          },
          onError: (message) => {
            if (!cancelled) setErrorMessage(message);
          },
        });
        sessionRef.current = session;

        await session.join(
          {
            appId: Number(data.appId),
            token: String(data.token),
            roomId: String(data.roomId),
            userId: String(data.userId),
            userName: String(data.userName || data.userId),
            server: data.server,
          },
          localVideoRef.current,
        );

        if (!cancelled) {
          setConnected(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not join call.');
        }
      } finally {
        if (!cancelled) {
          setIsJoining(false);
        }
      }
    };

    joinCall();

    const unsubscribe = socketService.on('alert:state', (alert: ActiveAlert) => {
      if (alert?.id === alertId) {
        syncParticipantsFromAlert(alert);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      const session = sessionRef.current;
      sessionRef.current = null;
      void session?.leave();

      const participantId = participantIdRef.current;
      if (participantId && !leavingRef.current) {
        void api
          .updateAlertParticipant(alertId, {
            participantId,
            status: 'CALLING',
          })
          .catch(() => undefined);
      }
    };
  }, [alertId, syncParticipantsFromAlert]);

  useEffect(() => {
    for (const stream of remoteStreams) {
      const container = remoteVideoRefs.current[stream.streamID];
      if (container) {
        sessionRef.current?.attachRemoteStream(stream.streamID, container);
      }
    }
  }, [remoteStreams]);

  const handleToggleMic = () => {
    const next = !micMuted;
    sessionRef.current?.setMicMuted(next);
    setMicMuted(next);
  };

  const handleToggleCamera = () => {
    const next = !cameraMuted;
    sessionRef.current?.setCameraMuted(next);
    setCameraMuted(next);
  };

  const handleQuickResponse = async (action: string) => {
    setQuickBusyKey(action);
    setErrorMessage(null);
    try {
      await api.sendQuickResponse(alertId, action);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send quick response.');
    } finally {
      setQuickBusyKey(null);
    }
  };

  const handleLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    leavingRef.current = true;
    setErrorMessage(null);

    try {
      await sessionRef.current?.leave();
      sessionRef.current = null;
      if (participantIdRef.current) {
        await api.updateAlertParticipant(alertId, {
          participantId: participantIdRef.current,
          status: 'CALLING',
        });
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to leave call cleanly.');
    } finally {
      onBack();
    }
  };

  const remoteByUserId = useMemo(() => {
    const map = new Map<string, RemoteStreamInfo>();
    for (const stream of remoteStreams) {
      if (stream.userID) map.set(stream.userID, stream);
    }
    return map;
  }, [remoteStreams]);

  return (
    <div className="h-full bg-[#09003B] text-white flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#EB0909]">● {title}</p>
          <p className="text-sm font-semibold mt-0.5">{groupLabel}</p>
          <p className="text-[10px] text-white/50 mt-1">
            {isJoining
              ? 'Connecting…'
              : connected
                ? 'Connected'
                : demoMode
                  ? 'Demo mode (no live A/V)'
                  : 'Waiting for media'}
          </p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tabular-nums">{timer}</div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <AuthErrorBanner message={errorMessage} />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden min-h-[160px] relative">
            <div ref={localVideoRef} className="absolute inset-0 bg-black/40 [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            {(!connected || cameraMuted) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="size-14 rounded-2xl bg-[#3A67D5]/30 text-[#9DB4FF] flex items-center justify-center text-lg font-black">
                  You
                </div>
                {cameraMuted && <p className="text-[10px] text-white/60">Camera off</p>}
              </div>
            )}
            <div className="absolute left-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold">
              You {micMuted ? '· Muted' : ''}
            </div>
          </div>

          {remoteStreams.map((stream) => (
            <div
              key={stream.streamID}
              className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden min-h-[160px] relative"
            >
              <div
                ref={(el) => {
                  remoteVideoRefs.current[stream.streamID] = el;
                }}
                className="absolute inset-0 bg-black/40 [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />
              <div className="absolute left-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold">
                {stream.userName || stream.userID || 'Participant'}
              </div>
            </div>
          ))}

          {participants
            .filter((participant) => {
              if (localUserId && participant.id === `part-${localUserId}`) return false;
              const userKey = participant.id.startsWith('part-') ? participant.id.slice(5) : '';
              if (userKey && remoteByUserId.has(userKey)) return false;
              return true;
            })
            .map((participant) => (
              <div
                key={participant.id}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 min-h-[160px] flex flex-col items-center justify-center gap-2"
              >
                <div
                  className="size-14 rounded-2xl flex items-center justify-center text-lg font-black"
                  style={{ backgroundColor: `${participant.color}22`, color: participant.color }}
                >
                  {participant.initials}
                </div>
                <p className="text-xs font-semibold text-center">
                  {participant.isSender
                    ? `You (${(participant.name || '').split(' ')[0]}) — Sender`
                    : participant.displayName || participant.name}
                </p>
                <p className="text-[10px] text-white/60">
                  {participant.statusLabel || participant.status}
                </p>
              </div>
            ))}
        </div>

        {isSender && quickResponses.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-white/70 mb-2">QUICK RESPONSE</p>
            <div className="grid grid-cols-3 gap-2">
              {quickResponses.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={Boolean(quickBusyKey)}
                  onClick={() => handleQuickResponse(item.key)}
                  className="rounded-xl bg-white/10 border border-white/10 px-2 py-3 text-[11px] font-semibold touch-manipulation hover:bg-white/15 disabled:opacity-60"
                >
                  {quickBusyKey === item.key ? '…' : item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={!connected || isJoining}
            className="size-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center touch-manipulation disabled:opacity-40"
            aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {micMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>
          <button
            type="button"
            onClick={handleToggleCamera}
            disabled={!connected || isJoining}
            className="size-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center touch-manipulation disabled:opacity-40"
            aria-label={cameraMuted ? 'Turn camera on' : 'Turn camera off'}
          >
            {cameraMuted ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleLeave}
          disabled={isLeaving}
          className="w-full h-12 rounded-full bg-[#EB0909] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation disabled:opacity-70"
        >
          {isLeaving ? <AuthSpinner /> : <PhoneOff className="size-4" />}
          {isLeaving ? 'Leaving…' : 'Leave Call'}
        </button>
      </div>
    </div>
  );
};

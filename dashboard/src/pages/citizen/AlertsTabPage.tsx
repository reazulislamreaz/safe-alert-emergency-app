import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle, MapPin, MessageCircle, Users, Video } from 'lucide-react';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';
import { AlertInbox, AlertInboxCard, User } from '../../types';
import { AuthErrorBanner } from '../../components/auth/AuthFeedback';
import safeAlertMark from '../../assets/safealert-mark.png';
import noActiveAlert from '../../assets/no-active-alert.png';

interface AlertsTabPageProps {
  user: User;
  onOpenLive: (alertId: string) => void;
  onJoinCall: (alertId: string) => void;
  onMessage: (alertId: string) => void;
  onOpenNotifications: () => void;
}

export const AlertsTabPage: React.FC<AlertsTabPageProps> = ({
  user,
  onOpenLive,
  onJoinCall,
  onMessage,
  onOpenNotifications,
}) => {
  const [inbox, setInbox] = useState<AlertInbox | null>(null);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [skipInvites, setSkipInvites] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInbox = useCallback(async (nextTab: 'active' | 'past' = tab) => {
    const data = (await api.getAlertInbox(nextTab)) as AlertInbox;
    setInbox(data);
    setTab(data.selectedTab);
  }, [tab]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    loadInbox('active')
      .catch((err: unknown) => {
        if (mounted) {
          setErrorMessage(err instanceof Error ? err.message : 'Could not load alerts.');
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return socketService.on('presence:changed', () => {
      loadInbox(tab).catch(() => undefined);
    });
  }, [loadInbox, tab]);

  useEffect(() => {
    return socketService.on('alert:new', () => {
      loadInbox(tab).catch(() => undefined);
    });
  }, [loadInbox, tab]);

  const handleTab = async (next: 'active' | 'past') => {
    setTab(next);
    setErrorMessage(null);
    try {
      await loadInbox(next);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not load alerts.');
    }
  };

  const handleInvite = async (id: string, accept: boolean) => {
    setBusyId(id);
    setErrorMessage(null);
    try {
      if (accept) {
        await api.acceptGroupInvitation(id);
      } else {
        await api.declineGroupInvitation(id);
      }
      await loadInbox(tab);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not update invitation.');
    } finally {
      setBusyId(null);
    }
  };

  const greeting = inbox?.greeting || 'Good morning';
  const displayName = inbox?.user?.fullName || user.fullName;
  const unread = inbox?.notifications?.unreadCount ?? 0;
  const invitations = skipInvites ? [] : inbox?.invitations.items ?? [];
  const activeCount = inbox?.active.length ?? 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="relative px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-[#30302F]">{greeting}</p>
            <p className="text-base font-bold text-[#09003B] leading-6 truncate">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative size-9 rounded-[18px] bg-[#F1F5FF] flex items-center justify-center touch-manipulation"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-[#09003B]" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#EB0909] text-[10px] font-bold text-white leading-4 text-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
        <img
          src={safeAlertMark}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1 size-[70px] -translate-x-1/2 object-cover"
        />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-10 pb-4 space-y-6">
        <AuthErrorBanner message={errorMessage} />

        {isLoading && !inbox && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-[#3A67D5] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {inbox?.liveBanner && (
          <button
            type="button"
            onClick={() => onOpenLive(inbox.liveBanner!.alertId)}
            className="w-full text-left rounded-2xl px-4 py-4 text-white shadow-[0_8px_12px_rgba(220,38,38,0.35)] touch-manipulation"
            style={{ backgroundImage: 'linear-gradient(164deg, #DC2626 0%, #B91C1C 100%)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 pb-2">
                <span className="size-2 rounded-full bg-white/70" />
                <span className="text-xs font-bold text-white/90">{inbox.liveBanner.title}</span>
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                {inbox.liveBanner.cta}
              </span>
            </div>
            <p className="text-base font-black leading-6">{inbox.liveBanner.headline}</p>
            <p className="mt-1 text-xs text-white/80">{inbox.liveBanner.subtitle}</p>
          </button>
        )}

        <section className="space-y-3">
          <div className="flex h-12 items-start rounded-full bg-[#F5F5F5] p-1">
            <button
              type="button"
              onClick={() => handleTab('active')}
              className={`flex-1 h-10 rounded-full text-sm font-semibold touch-manipulation ${
                tab === 'active' ? 'bg-[#3A67D5] text-[#DBF5FF]' : 'text-[#888887]'
              }`}
            >
              {inbox?.tabs.find((item) => item.key === 'active')?.label || `Active(${activeCount})`}
            </button>
            <button
              type="button"
              onClick={() => handleTab('past')}
              className={`flex-1 h-10 rounded-full text-sm font-semibold touch-manipulation ${
                tab === 'past' ? 'bg-[#3A67D5] text-[#DBF5FF]' : 'text-[#888887]'
              }`}
            >
              Past alerts
            </button>
          </div>

          {tab === 'active' && inbox && inbox.active.length === 0 && (
            <div className="flex flex-col items-center py-4">
              <img src={noActiveAlert} alt="" className="size-[100px] object-contain" />
              <p className="text-sm font-medium text-[#09003B]">{inbox.emptyActive.title}</p>
            </div>
          )}

          {tab === 'active' &&
            inbox?.active.map((alert) => (
              <ActiveAlertCard
                key={alert.id}
                alert={alert}
                onOpen={() => onOpenLive(alert.id)}
                onJoinCall={() => onJoinCall(alert.id)}
                onMessage={() => onMessage(alert.id)}
              />
            ))}

          {tab === 'past' && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#30302F]">{inbox?.past.heading || 'Past 7 Days'}</p>
              {(inbox?.past.items ?? []).map((alert) => (
                <PastAlertCard key={alert.id} alert={alert} />
              ))}
              {(inbox?.past.items.length ?? 0) === 0 && (
                <p className="text-xs text-[#888887] py-6 text-center">No resolved alerts in the past 7 days.</p>
              )}
            </div>
          )}
        </section>

        {tab === 'active' && invitations.length > 0 && inbox && (
          <section className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-[#09003B] leading-8">{inbox.invitations.title}</h2>
              <p className="mt-1 text-sm text-[#30302F]">{inbox.invitations.subtitle}</p>
            </div>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div key={invite.id} className="rounded-2xl border border-[#E1E1E1] p-4">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-[#BCD9FF] flex items-center justify-center shrink-0">
                      <Users className="size-5 text-[#3A67D5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D1433]">{invite.groupName}</p>
                      <p className="text-xs text-[#888887]">{invite.invitedBy}</p>
                      <p className="text-xs text-[#888887]">{invite.timeLabel}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === invite.id}
                      onClick={() => handleInvite(invite.id, true)}
                      className="flex-1 h-9 rounded-lg bg-[#3A67D5] text-sm font-medium text-[#DBF5FF] disabled:opacity-50 touch-manipulation"
                    >
                      {inbox.invitations.acceptLabel}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === invite.id}
                      onClick={() => handleInvite(invite.id, false)}
                      className="flex-1 h-9 rounded-lg border border-[#E1E1E1] text-sm font-medium text-[#888887] disabled:opacity-50 touch-manipulation"
                    >
                      {inbox.invitations.declineLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSkipInvites(true)}
              className="w-full text-center text-sm text-[#888887] touch-manipulation"
            >
              {inbox.invitations.skipLabel}
            </button>
          </section>
        )}

        {tab === 'active' && (inbox?.myGroups.length ?? 0) > 0 && (
          <section className="space-y-2">
            <p className="text-xs font-semibold text-[#30302F]">MY GROUPS</p>
            <div className="space-y-3">
              {inbox?.myGroups.map((group) => (
                <div
                  key={group.id}
                  className="flex h-[72px] items-center justify-between rounded-2xl border border-[#E1E1E1] p-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-lg bg-[#BCD9FF] flex items-center justify-center shrink-0">
                      <Users className="size-5 text-[#3A67D5]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D1433] truncate">{group.name}</p>
                      <p className="text-xs text-[#888887]">{group.memberLabel}</p>
                    </div>
                  </div>
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      group.onlineCount > 0 ? 'bg-[#4ADE80]' : 'bg-[#CECECE]'
                    }`}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const ActiveAlertCard: React.FC<{
  alert: AlertInboxCard;
  onOpen: () => void;
  onJoinCall: () => void;
  onMessage: () => void;
}> = ({ alert, onOpen, onJoinCall, onMessage }) => (
  <div className="rounded-2xl border border-[#FFDACD] bg-white p-4">
    <button type="button" onClick={onOpen} className="w-full text-left touch-manipulation">
      <div className="flex gap-3">
        <div className="size-11 rounded-2xl bg-[#FEF2F2] flex items-center justify-center text-xl shrink-0">
          {alert.emoji || '🚨'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#09003B] truncate">{alert.userName}</p>
            <p className="text-xs font-bold text-[#EB0909] shrink-0">● {alert.statusLabel || 'LIVE'}</p>
          </div>
          <p className="text-xs text-[#EB0909] mt-0.5">{alert.headline}</p>
          <p className="text-xs text-[#888887] mt-1">{alert.subtitle}</p>
        </div>
      </div>
    </button>
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={onJoinCall}
        className="flex-1 h-10 rounded-2xl bg-[#3A67D5] text-white text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
      >
        <Video className="size-5" />
        {alert.joinCallLabel || 'Join Call'}
      </button>
      <button
        type="button"
        onClick={onMessage}
        className="flex-1 h-10 rounded-2xl bg-[#BCD9FF] text-[#1D49C2] text-xs font-semibold flex items-center justify-center gap-1.5 touch-manipulation"
      >
        <MessageCircle className="size-5" />
        {alert.messageLabel || 'Message'}
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="h-10 w-10 rounded-[18px] bg-[#EEF2FF] flex items-center justify-center touch-manipulation"
        aria-label="Open map"
      >
        <MapPin className="size-4 text-[#3A67D5]" />
      </button>
    </div>
  </div>
);

const PastAlertCard: React.FC<{ alert: AlertInboxCard }> = ({ alert }) => (
  <div className="flex h-[72px] items-center justify-between rounded-2xl border border-[#E1E1E1] p-3.5">
    <div className="flex items-center gap-3 min-w-0">
      <div className="size-10 rounded-lg bg-[#C3FFD0] flex items-center justify-center shrink-0">
        <CheckCircle className="size-5 text-[#00AA1D]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#0D1433] truncate">{alert.userName}</p>
        <p className="text-xs text-[#888887] truncate">{alert.subtitle}</p>
      </div>
    </div>
    <span className="rounded-full bg-[#C3FFD0] px-2.5 py-0.5 text-xs font-semibold text-[#00AA1D] shrink-0">
      {alert.statusLabel || 'Resolved'}
    </span>
  </div>
);

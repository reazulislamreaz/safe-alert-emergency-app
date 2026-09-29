import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { soundService } from '../services/sound';
import { CitizenNavBar, CitizenTab } from '../components/citizen/CitizenNavBar';
import { AlertsTabPage } from './citizen/AlertsTabPage';
import { LiveAlertPage } from './citizen/LiveAlertPage';
import { AlertChatSheet } from './citizen/AlertChatSheet';
import { AlertCallSheet } from './citizen/AlertCallSheet';
import { ContactsTabPage } from './citizen/ContactsTabPage';
import { InviteAcceptanceModal } from '../components/citizen/InviteAcceptanceModal';
import { authPrimaryBtnClass } from '../components/auth/AuthShell';
import { ChevronLeft, Gift, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface CitizenHomePageProps {
  user: User;
  onLogout: () => void;
  onOperatorLogin: () => void;
}

type Overlay =
  | { kind: 'live'; alertId: string }
  | { kind: 'chat'; alertId: string; from?: 'live' | 'alerts' }
  | { kind: 'call'; alertId: string; from?: 'live' | 'alerts' }
  | { kind: 'notify' };

export const CitizenHomePage: React.FC<CitizenHomePageProps> = ({
  user,
  onLogout,
  onOperatorLogin,
}) => {
  const [tab, setTab] = useState<CitizenTab>('alerts');
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [userTier, setUserTier] = useState<string>(user.subscriptionTier || 'FREE');
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(null);

  // Promo code redemption state
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isRedeemingPromo, setIsRedeemingPromo] = useState(false);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(null);
  const [promoErrorMsg, setPromoErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    socketService.connect({ token: api.getAuthToken(), asAdmin: false });
    return () => socketService.disconnect();
  }, []);

  // Check for deep link invite parameter or stored token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteFromQuery = params.get('invite');
    const inviteFromStorage = sessionStorage.getItem('pending_invite_token');
    const token = inviteFromQuery || inviteFromStorage;
    if (token) {
      setPendingInviteToken(token);
    }
  }, []);

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    setIsRedeemingPromo(true);
    setPromoErrorMsg(null);
    setPromoSuccessMsg(null);
    try {
      const res = await api.redeemPromoCode(code);
      setPromoSuccessMsg(res.message || `Code ${code} redeemed successfully! You have been upgraded to PREMIUM.`);
      setUserTier('PREMIUM');
      setPromoCodeInput('');
    } catch (err: unknown) {
      setPromoErrorMsg(err instanceof Error ? err.message : 'Invalid or expired promotional code');
    } finally {
      setIsRedeemingPromo(false);
    }
  };

  const showNav = overlay === null;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#F3F4F6] font-sans antialiased">
      <div className="flex min-h-screen min-h-[100dvh] justify-center [padding-top:env(safe-area-inset-top)] [padding-bottom:env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[390px] min-h-[100dvh] bg-white flex flex-col sm:my-8 sm:min-h-0 sm:max-h-[calc(100dvh-4rem)] sm:rounded-2xl sm:overflow-hidden sm:shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="flex-1 min-h-0 overflow-hidden">
            {overlay?.kind === 'live' && (
              <LiveAlertPage
                alertId={overlay.alertId}
                onBack={() => setOverlay(null)}
                onJoinCall={() => setOverlay({ kind: 'call', alertId: overlay.alertId, from: 'live' })}
                onMessage={() => setOverlay({ kind: 'chat', alertId: overlay.alertId, from: 'live' })}
              />
            )}
            {overlay?.kind === 'chat' && (
              <AlertChatSheet
                alertId={overlay.alertId}
                onBack={() =>
                  setOverlay(
                    overlay.from === 'live' ? { kind: 'live', alertId: overlay.alertId } : null,
                  )
                }
              />
            )}
            {overlay?.kind === 'call' && (
              <AlertCallSheet
                alertId={overlay.alertId}
                onBack={() =>
                  setOverlay(
                    overlay.from === 'live' ? { kind: 'live', alertId: overlay.alertId } : null,
                  )
                }
              />
            )}
            {overlay?.kind === 'notify' && (
              <NotificationsPane
                onBack={() => setOverlay(null)}
                onOpenLiveAlert={(alertId) => setOverlay({ kind: 'live', alertId })}
              />
            )}
            {!overlay && tab === 'alerts' && (
              <AlertsTabPage
                user={user}
                onOpenLive={(alertId) => setOverlay({ kind: 'live', alertId })}
                onJoinCall={(alertId) => setOverlay({ kind: 'call', alertId, from: 'alerts' })}
                onMessage={(alertId) => setOverlay({ kind: 'chat', alertId, from: 'alerts' })}
                onOpenNotifications={() => setOverlay({ kind: 'notify' })}
              />
            )}
            {!overlay && tab === 'home' && (
              <SimplePane
                title="Home"
                body={`${user.fullName} is signed in. Use Alerts to respond to circle emergencies.`}
              />
            )}
            {!overlay && tab === 'contacts' && <ContactsTabPage />}
            {!overlay && tab === 'journal' && (
              <SimplePane title="Journal" body="Incident journals will appear here after an alert is resolved." />
            )}
            {!overlay && tab === 'profile' && (
              <div className="h-full overflow-y-auto px-4 pt-6 pb-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-[#09003B]">Profile & Subscription</h2>
                  <p className="mt-1 text-sm font-semibold text-[#30302F]">{user.fullName}</p>
                  <p className="text-xs text-[#888887]">{user.email}</p>
                </div>

                {/* Subscription Tier Badge */}
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Plan</p>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{userTier} TIER</span>
                          {userTier === 'PREMIUM' && (
                            <span className="text-[10px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {userTier !== 'PREMIUM' && (
                      <span className="text-xs font-bold text-blue-600">Standard</span>
                    )}
                  </div>
                </div>

                {/* Feature 7: Promotional Code Redemption */}
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="size-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-[#09003B]">Redeem Access Code</h3>
                  </div>
                  <p className="text-xs text-[#888887]">
                    Have a 6-month or 12-month promotional partner code? Enter it below to activate Premium Safety Circle access.
                  </p>

                  {promoSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p>{promoSuccessMsg}</p>
                    </div>
                  )}

                  {promoErrorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                      {promoErrorMsg}
                    </div>
                  )}

                  <form onSubmit={handleRedeemPromo} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. SAFETY2026-6M"
                        className="flex-1 min-h-11 px-3.5 rounded-xl border border-gray-200 text-xs font-mono font-semibold tracking-wider text-gray-800 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={isRedeemingPromo || !promoCodeInput.trim()}
                        className="px-4 min-h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-50 touch-manipulation"
                      >
                        {isRedeemingPromo ? '...' : 'Redeem'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="space-y-3 pt-2">
                  <button type="button" onClick={onLogout} className={authPrimaryBtnClass}>
                    Log out
                  </button>
                  <button
                    type="button"
                    onClick={onOperatorLogin}
                    className="w-full min-h-12 h-12 rounded-full border border-[#3A67D5] text-[#3A67D5] text-sm font-medium touch-manipulation hover:bg-blue-50/50 transition-colors"
                  >
                    Super Admin / Command Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
          {showNav && <CitizenNavBar current={tab} onSelect={setTab} />}
        </div>
      </div>

      {/* Feature 1: Deep Link Invite Acceptance Modal */}
      {pendingInviteToken && (
        <InviteAcceptanceModal
          token={pendingInviteToken}
          isLoggedIn={true}
          onRequestAuth={() => {}}
          onClose={() => {
            setPendingInviteToken(null);
            sessionStorage.removeItem('pending_invite_token');
          }}
          onAccepted={() => {
            setPendingInviteToken(null);
            sessionStorage.removeItem('pending_invite_token');
            setTab('contacts');
          }}
        />
      )}
    </div>
  );
};

const SimplePane: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="h-full px-4 pt-6">
    <h2 className="text-lg font-bold text-[#09003B]">{title}</h2>
    <p className="mt-2 text-sm text-[#30302F]">{body}</p>
  </div>
);

const NotificationsPane: React.FC<{
  onBack: () => void;
  onOpenLiveAlert?: (alertId: string) => void;
}> = ({ onBack, onOpenLiveAlert }) => {
  const [items, setItems] = useState<
    { id: string; title: string; body?: string; isRead?: boolean; alertId?: string; type?: string }[]
  >([]);
  const [emptyTitle, setEmptyTitle] = useState('No Notification Yet');

  useEffect(() => {
    api
      .getNotifications()
      .then((data) => {
        setItems(data.items || data.notifications || []);
        if (data.emptyTitle) setEmptyTitle(data.emptyTitle);
      })
      .catch(() => undefined);
  }, []);

  // Listen for realtime push notifications and trigger distinct sound
  useEffect(() => {
    const off = socketService.on('notification:new', (notif: any) => {
      const isEmergency =
        notif.type === 'EMERGENCY_TRIGGER' ||
        notif.type === 'EMERGENCY_ALERT' ||
        notif.type === 'EMERGENCY_FOLLOW_UP' ||
        notif.title?.toLowerCase().includes('emergency') ||
        notif.title?.toLowerCase().includes('sos');

      soundService.playSound(isEmergency ? 'emergency_alert' : 'circle_notify');

      setItems((prev) => [
        {
          id: notif.id || String(Date.now()),
          title: notif.title,
          body: notif.body,
          alertId: notif.alertId,
          type: notif.type,
          isRead: false,
        },
        ...prev,
      ]);
    });

    return () => off();
  }, []);

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-4 flex items-center gap-2 border-b border-[#E1E1E1]">
        <button type="button" onClick={onBack} className="p-1 touch-manipulation" aria-label="Go back">
          <ChevronLeft className="size-6 text-[#09003B]" />
        </button>
        <h1 className="text-lg font-bold text-[#09003B]">Notifications</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-[#888887] text-center py-16">{emptyTitle}</p>
        )}
        {items.map((item) => {
          const isEmergency =
            item.type?.includes('EMERGENCY') ||
            item.title?.toLowerCase().includes('emergency') ||
            item.title?.toLowerCase().includes('sos');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                api.markNotificationRead(item.id).catch(() => undefined);
                if (item.alertId && onOpenLiveAlert) {
                  onOpenLiveAlert(item.alertId);
                }
              }}
              className={`w-full text-left rounded-2xl border p-4 touch-manipulation transition-colors ${
                isEmergency
                  ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                  : 'border-[#E1E1E1] bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <p
                  className={`text-sm font-semibold truncate ${
                    isEmergency ? 'text-red-700' : 'text-[#09003B]'
                  }`}
                >
                  {item.title}
                </p>
                {item.alertId && (
                  <span className="text-[10px] font-bold text-blue-600 shrink-0 ml-2">View Live →</span>
                )}
              </div>
              {item.body && <p className="text-xs text-[#888887] mt-1">{item.body}</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

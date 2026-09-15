import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { CitizenNavBar, CitizenTab } from '../components/citizen/CitizenNavBar';
import { AlertsTabPage } from './citizen/AlertsTabPage';
import { LiveAlertPage } from './citizen/LiveAlertPage';
import { AlertChatSheet } from './citizen/AlertChatSheet';
import { AlertCallSheet } from './citizen/AlertCallSheet';
import { ContactsTabPage } from './citizen/ContactsTabPage';
import { authPrimaryBtnClass } from '../components/auth/AuthShell';
import { ChevronLeft } from 'lucide-react';

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

  useEffect(() => {
    socketService.connect({ token: api.getAuthToken(), asAdmin: false });
    return () => socketService.disconnect();
  }, []);

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
              <NotificationsPane onBack={() => setOverlay(null)} />
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
              <div className="h-full px-4 pt-6">
                <h2 className="text-lg font-bold text-[#09003B]">Profile</h2>
                <p className="mt-2 text-sm text-[#30302F]">{user.fullName}</p>
                <p className="text-xs text-[#888887]">{user.email}</p>
                <div className="mt-8 space-y-3">
                  <button type="button" onClick={onLogout} className={authPrimaryBtnClass}>
                    Log out
                  </button>
                  <button
                    type="button"
                    onClick={onOperatorLogin}
                    className="w-full min-h-12 h-12 rounded-full border border-[#3A67D5] text-[#3A67D5] text-sm font-medium touch-manipulation"
                  >
                    Super Admin dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
          {showNav && <CitizenNavBar current={tab} onSelect={setTab} />}
        </div>
      </div>
    </div>
  );
};

const SimplePane: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="h-full px-4 pt-6">
    <h2 className="text-lg font-bold text-[#09003B]">{title}</h2>
    <p className="mt-2 text-sm text-[#30302F]">{body}</p>
  </div>
);

const NotificationsPane: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [items, setItems] = useState<{ id: string; title: string; body?: string; isRead?: boolean }[]>([]);
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

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-4 flex items-center gap-2 border-b border-[#E1E1E1]">
        <button type="button" onClick={onBack} className="p-1 touch-manipulation" aria-label="Go back">
          <ChevronLeft className="size-6 text-[#09003B]" />
        </button>
        <h1 className="text-lg text-[#09003B]">Notification</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-[#888887] text-center py-16">{emptyTitle}</p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => api.markNotificationRead(item.id).catch(() => undefined)}
            className="w-full text-left rounded-2xl border border-[#E1E1E1] p-4 touch-manipulation"
          >
            <p className="text-sm font-semibold text-[#09003B]">{item.title}</p>
            {item.body && <p className="text-xs text-[#888887] mt-1">{item.body}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { MapPin, Check, X, Clock, Navigation, Copy, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import { LocationRequestItem } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface LocationRequestsSheetProps {
  onBack: () => void;
}

export const LocationRequestsSheet: React.FC<LocationRequestsSheetProps> = ({ onBack }) => {
  const [requests, setRequests] = useState<LocationRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLocationRequestsInbox();
      setRequests(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load location requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRespond = async (request: LocationRequestItem, action: 'APPROVE' | 'DECLINE') => {
    setActingId(request.id);
    setError(null);

    if (action === 'DECLINE') {
      try {
        await api.respondLocationRequest(request.id, { action: 'DECLINE' });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not decline request.');
      } finally {
        setActingId(null);
      }
      return;
    }

    // Approve: get browser GPS position
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser/device.');
      setActingId(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const address = `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          await api.respondLocationRequest(request.id, {
            action: 'APPROVE',
            latitude,
            longitude,
            address,
          });
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not share location.');
        } finally {
          setActingId(null);
        }
      },
      (geoErr) => {
        setError(`Location access error: ${geoErr.message}`);
        setActingId(null);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleCopyLocation = async (req: LocationRequestItem) => {
    if (!req.latitude || !req.longitude) return;
    const text = req.shareableLocation?.copiedText || [
      req.address || `${req.targetName}'s location`,
      `GPS: ${req.latitude.toFixed(6)}, ${req.longitude.toFixed(6)}`,
      `https://maps.google.com/?q=${req.latitude},${req.longitude}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(req.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Failed to copy location to clipboard.');
    }
  };

  const incomingPending = requests.filter((r) => r.isIncoming && r.status === 'PENDING');
  const otherRequests = requests.filter((r) => !(r.isIncoming && r.status === 'PENDING'));

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="h-[60px] px-4 flex items-center gap-2 border-b border-[#E1E1E1] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="size-9 rounded-full flex items-center justify-center text-[#09003B] hover:bg-[#F5F5F5] touch-manipulation"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#09003B]">Location Requests</h2>
          <p className="text-[11px] text-[#64748B]">Family & Friends Safety Circle</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AuthErrorBanner message={error} />

        {loading ? (
          <div className="py-12 flex justify-center">
            <AuthSpinner />
          </div>
        ) : (
          <>
            {incomingPending.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3A67D5]">
                  Action Needed ({incomingPending.length})
                </h3>
                {incomingPending.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-[#F8FAFC] border-2 border-[#3A67D5]/30 rounded-2xl space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#09003B]">{req.requesterName}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          wants to request your location in <span className="font-semibold text-[#09003B]">{req.groupName}</span>
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold shrink-0">
                        Pending
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B]">
                      Approving will share your current location one time. No continuous tracking is granted.
                    </p>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={actingId === req.id}
                        onClick={() => handleRespond(req, 'APPROVE')}
                        className="flex-1 h-10 rounded-full bg-[#00AA1D] text-white text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation hover:bg-[#009218] disabled:opacity-50"
                      >
                        <Navigation className="size-3.5" />
                        {actingId === req.id ? 'Locating…' : 'Approve & Share'}
                      </button>
                      <button
                        type="button"
                        disabled={actingId === req.id}
                        onClick={() => handleRespond(req, 'DECLINE')}
                        className="flex-1 h-10 rounded-full border border-[#E1E1E1] text-[#888887] text-xs font-semibold hover:bg-white touch-manipulation disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">History & Status</h3>
              {otherRequests.length === 0 && incomingPending.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#888887]">
                  No location requests yet. You can request locations from members within your Family & Friends groups.
                </div>
              ) : (
                otherRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-white border border-[#E1E1E1] rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[#09003B] truncate">
                        {req.isIncoming
                          ? `Request from ${req.requesterName}`
                          : `Request to ${req.targetName}`}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          req.status === 'APPROVED'
                            ? 'bg-[#DCFCE7] text-[#15803D]'
                            : req.status === 'DECLINED'
                            ? 'bg-[#FEE2E2] text-[#DC2626]'
                            : 'bg-[#F1F5F9] text-[#64748B]'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B]">Circle: {req.groupName}</p>

                    {req.status === 'APPROVED' && req.latitude && req.longitude && (
                      <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] text-[#09003B] truncate flex items-center gap-1">
                            <MapPin className="size-3 text-[#3A67D5] shrink-0" />
                            {req.address || `${req.latitude.toFixed(5)}, ${req.longitude.toFixed(5)}`}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyLocation(req)}
                            className="px-2.5 py-1 rounded-lg bg-[#F1F5F9] text-[#09003B] text-[11px] font-semibold flex items-center gap-1 hover:bg-[#E2E8F0]"
                          >
                            <Copy className="size-3" />
                            {copiedId === req.id ? 'Copied' : 'Copy'}
                          </button>
                          <a
                            href={`https://maps.google.com/?q=${req.latitude},${req.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-[#3A67D5] text-white text-[11px] font-semibold hover:bg-[#2F54B5]"
                          >
                            Map
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

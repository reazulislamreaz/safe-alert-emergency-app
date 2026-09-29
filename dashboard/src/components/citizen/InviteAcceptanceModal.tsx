import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, AlertTriangle, XCircle, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';
import { ReferralResolution } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface InviteAcceptanceModalProps {
  token: string;
  isLoggedIn: boolean;
  onAccepted: (groupId: string) => void;
  onRequestAuth: (mode: 'login' | 'register', token: string) => void;
  onClose: () => void;
}

export const InviteAcceptanceModal: React.FC<InviteAcceptanceModalProps> = ({
  token,
  isLoggedIn,
  onAccepted,
  onRequestAuth,
  onClose,
}) => {
  const [data, setData] = useState<ReferralResolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .resolveReferralToken(token)
      .then((res: ReferralResolution) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not verify invitation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await api.claimReferralToken(token);
      setSuccess(true);
      setTimeout(() => {
        onAccepted(res?.groupId || data?.groupId || '');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E1E1E1] pb-3">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-[#3A67D5]" />
            <h3 className="text-base font-bold text-[#09003B]">Safety Circle Invite</h3>
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

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <AuthSpinner />
            <p className="text-xs text-[#888887]">Verifying invitation link…</p>
          </div>
        ) : success ? (
          <div className="py-8 text-center space-y-3">
            <div className="size-16 rounded-full bg-[#DCFCE7] text-[#15803D] mx-auto flex items-center justify-center">
              <CheckCircle className="size-8" />
            </div>
            <h4 className="text-base font-bold text-[#09003B]">Joined Safety Circle!</h4>
            <p className="text-xs text-[#64748B]">You are now connected with {data?.inviterName || 'your contact'}.</p>
          </div>
        ) : data?.status === 'valid' ? (
          <div className="space-y-4 text-center">
            <div className="size-16 rounded-full bg-[#EBF0FF] text-[#3A67D5] mx-auto flex items-center justify-center shadow-inner">
              <Users className="size-8" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-[#09003B]">{data.groupName || 'Safety Circle'}</h4>
              <p className="text-xs text-[#64748B] mt-1">
                <span className="font-semibold text-[#09003B]">{data.inviterName || 'A friend'}</span> invited you to join their trusted emergency group.
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left text-xs text-[#64748B] space-y-1">
              <p className="font-semibold text-[#09003B]">As a Safety Circle member, you can:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Receive immediate emergency alerts and live GPS</li>
                <li>Participate in emergency group chat and calls</li>
                <li>Help respond and keep each other safe</li>
              </ul>
            </div>

            {isLoggedIn ? (
              <button
                type="button"
                disabled={claiming}
                onClick={handleClaim}
                className="w-full h-12 rounded-full bg-[#3A67D5] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation hover:bg-[#2F54B5] disabled:opacity-50"
              >
                {claiming ? 'Joining Circle…' : 'Accept & Join Circle'}
                {!claiming && <ArrowRight className="size-4" />}
              </button>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onRequestAuth('register', token)}
                  className="w-full h-12 rounded-full bg-[#3A67D5] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation hover:bg-[#2F54B5]"
                >
                  Create Account to Join
                  <ArrowRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestAuth('login', token)}
                  className="w-full h-11 rounded-full border border-[#E1E1E1] text-[#3A67D5] text-xs font-semibold touch-manipulation hover:bg-[#F8FAFC]"
                >
                  Already have an account? Sign In
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <div className="size-14 rounded-full bg-[#FEF2F2] text-[#DC2626] mx-auto flex items-center justify-center">
              {data?.status === 'expired' ? <AlertTriangle className="size-7" /> : <XCircle className="size-7" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#09003B]">
                {data?.status === 'expired'
                  ? 'Invitation Link Expired'
                  : data?.status === 'already_used'
                  ? 'Invitation Already Used'
                  : 'Invitation Unavailable'}
              </h4>
              <p className="text-xs text-[#64748B] mt-1">{data?.message || 'This invitation is no longer active.'}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full h-11 rounded-full border border-[#E1E1E1] text-xs font-semibold text-[#09003B] hover:bg-[#F8FAFC]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

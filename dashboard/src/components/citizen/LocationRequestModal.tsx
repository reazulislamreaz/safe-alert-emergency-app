import React, { useState } from 'react';
import { MapPin, Navigation, X, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface LocationRequestModalProps {
  groupId: string;
  groupName: string;
  targetUserId: string;
  targetName: string;
  onClose: () => void;
  onRequestSent?: () => void;
}

export const LocationRequestModal: React.FC<LocationRequestModalProps> = ({
  groupId,
  groupName,
  targetUserId,
  targetName,
  onClose,
  onRequestSent,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.createLocationRequest(groupId, targetUserId);
      setSent(true);
      onRequestSent?.();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send location request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E1E1E1] pb-3">
          <div className="flex items-center gap-2">
            <Navigation className="size-5 text-[#3A67D5]" />
            <h3 className="text-base font-bold text-[#09003B]">Request Location</h3>
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

        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="size-16 rounded-full bg-[#DCFCE7] text-[#15803D] mx-auto flex items-center justify-center">
              <CheckCircle className="size-8" />
            </div>
            <h4 className="text-base font-bold text-[#09003B]">Location Request Sent!</h4>
            <p className="text-xs text-[#64748B]">
              Status: <span className="font-semibold text-[#D97706]">Pending</span>. {targetName} will receive a notification to approve sharing their location.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-2 space-y-1">
              <div className="size-14 rounded-full bg-[#EBF0FF] text-[#3A67D5] mx-auto flex items-center justify-center">
                <MapPin className="size-7" />
              </div>
              <h4 className="text-base font-bold text-[#09003B]">Request location from {targetName}?</h4>
              <p className="text-xs text-[#64748B]">
                In circle: <span className="font-semibold text-[#09003B]">{groupName}</span>
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs text-[#64748B] space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#09003B]">
                <ShieldAlert className="size-3.5 text-[#3A67D5]" />
                Privacy & Consent
              </div>
              <p className="text-[11px] leading-4">
                Location requests are only permitted within Family & Friends circles. {targetName} can choose to approve or decline. If approved, their location is shared one time only.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleSend}
                className="w-full h-12 rounded-full bg-[#3A67D5] hover:bg-[#2F54B5] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation shadow-md disabled:opacity-50"
              >
                {loading ? <AuthSpinner /> : <Navigation className="size-4" />}
                {loading ? 'Sending Request…' : 'Send Location Request'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-full border border-[#E1E1E1] text-xs font-semibold text-[#888887] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

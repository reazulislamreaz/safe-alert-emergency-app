import React, { useEffect, useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, Mail, PhoneCall } from 'lucide-react';
import { api } from '../../services/api';
import { ReferralPayload } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface InviteShareModalProps {
  onClose: () => void;
}

export const InviteShareModal: React.FC<InviteShareModalProps> = ({ onClose }) => {
  const [data, setData] = useState<ReferralPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingSms, setSendingSms] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getContactReferral()
      .then((res: ReferralPayload) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load referral details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCopy = async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareText || data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleNativeShare = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.shareText,
          url: data.shareUrl,
        });
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone.trim()) return;
    setSendingSms(true);
    setStatusMessage(null);
    setError(null);
    try {
      await api.sendReferralSms(smsPhone.trim());
      setStatusMessage(`SMS invitation sent to ${smsPhone.trim()}`);
      setSmsPhone('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send SMS invitation.');
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress.trim()) return;
    setSendingEmail(true);
    setStatusMessage(null);
    setError(null);
    try {
      await api.sendReferralEmail(emailAddress.trim());
      setStatusMessage(`Email invitation sent to ${emailAddress.trim()}`);
      setEmailAddress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send Email invitation.');
    } finally {
      setSendingEmail(false);
    }
  };

  const whatsappUrl = data?.shareText
    ? `https://api.whatsapp.com/send?text=${encodeURIComponent(data.shareText)}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E1E1E1] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#09003B]">Invite to Safety Circle</h3>
            <p className="text-xs text-[#888887]">Share your personal invite link with friends & family</p>
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
        {statusMessage && (
          <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-3 text-xs text-[#15803D] font-medium">
            {statusMessage}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex justify-center">
            <AuthSpinner />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">Invite Link</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.shareUrl}
                  className="flex-1 bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#09003B] truncate select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 bg-[#3A67D5] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 touch-manipulation hover:bg-[#2F54B5]"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleNativeShare}
                className="h-11 rounded-2xl bg-[#EBF0FF] text-[#3A67D5] font-semibold text-xs flex items-center justify-center gap-2 touch-manipulation hover:bg-[#DBE5FF]"
              >
                <Share2 className="size-4" />
                Native Share
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 rounded-2xl bg-[#DCFCE7] text-[#15803D] font-semibold text-xs flex items-center justify-center gap-2 touch-manipulation hover:bg-[#BBF7D0]"
              >
                <MessageSquare className="size-4" />
                WhatsApp
              </a>
            </div>

            {/* Send via SMS */}
            <form onSubmit={handleSendSms} className="p-3 bg-white border border-[#E1E1E1] rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-[#09003B] flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-[#3A67D5]" />
                Send via SMS
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="flex-1 bg-[#F5F5F5] border border-[#E1E1E1] rounded-xl px-3 py-1.5 text-xs text-[#09003B]"
                />
                <button
                  type="submit"
                  disabled={sendingSms || !smsPhone.trim()}
                  className="px-3 py-1.5 bg-[#3A67D5] text-white rounded-xl text-xs font-semibold disabled:opacity-50 touch-manipulation"
                >
                  {sendingSms ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>

            {/* Send via Email */}
            <form onSubmit={handleSendEmail} className="p-3 bg-white border border-[#E1E1E1] rounded-2xl space-y-2">
              <label className="text-xs font-semibold text-[#09003B] flex items-center gap-1.5">
                <Mail className="size-3.5 text-[#3A67D5]" />
                Send via Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="flex-1 bg-[#F5F5F5] border border-[#E1E1E1] rounded-xl px-3 py-1.5 text-xs text-[#09003B]"
                />
                <button
                  type="submit"
                  disabled={sendingEmail || !emailAddress.trim()}
                  className="px-3 py-1.5 bg-[#3A67D5] text-white rounded-xl text-xs font-semibold disabled:opacity-50 touch-manipulation"
                >
                  {sendingEmail ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
};

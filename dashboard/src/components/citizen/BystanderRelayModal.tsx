import React, { useEffect, useState } from 'react';
import { UserCheck, ShieldAlert, ArrowRight, CheckCircle, X, Send, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { ContactGroup, ContactMember, BystanderRelayResult } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../auth/AuthFeedback';

interface BystanderRelayModalProps {
  initialAlertId?: string;
  onClose: () => void;
  onRelaySent?: (result: BystanderRelayResult) => void;
}

export const BystanderRelayModal: React.FC<BystanderRelayModalProps> = ({
  initialAlertId,
  onClose,
  onRelaySent,
}) => {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<ContactMember | null>(null);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'compose' | 'review' | 'success'>('compose');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BystanderRelayResult | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getContactGroups()
      .then((data) => {
        if (!active) return;
        const groupList = Array.isArray(data) ? data : ((data as any)?.groups ?? []);
        setGroups(groupList);
        if (groupList.length > 0) {
          setSelectedGroupId(groupList[0].id);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load groups.');
      })
      .finally(() => {
        if (active) setLoadingGroups(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeGroup = groups.find((g) => g.id === selectedGroupId);
  const members = activeGroup?.members || [];

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setError('Please select a recipient contact from the Safety Circle.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }
    setError(null);
    setStep('review');
  };

  const handleSendRelay = async () => {
    if (!selectedGroupId || !selectedMember || !message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data: BystanderRelayResult = await api.sendBystanderRelay({
        groupId: selectedGroupId,
        targetMemberId: selectedMember.id,
        phone: selectedMember.phone,
        message: message.trim(),
        alertId: initialAlertId,
      });
      setResult(data);
      setStep('success');
      onRelaySent?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send bystander message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-[390px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E1E1E1] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="size-5 text-[#3A67D5]" />
            <div>
              <h3 className="text-base font-bold text-[#09003B]">Bystander Mode</h3>
              <p className="text-[11px] text-[#64748B]">Send a 1-time message on someone's behalf</p>
            </div>
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

        {loadingGroups ? (
          <div className="py-12 flex justify-center">
            <AuthSpinner />
          </div>
        ) : step === 'compose' ? (
          <form onSubmit={handleProceedToReview} className="space-y-4">
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl text-xs text-[#1E40AF] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Lock className="size-3.5 text-[#2563EB]" />
                Controlled One-Time Relay
              </div>
              <p className="text-[11px] leading-4 text-[#1E3A8A]">
                Help a person whose phone is damaged or who cannot communicate. You can send a single emergency relay message to one of their circle contacts.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09003B] mb-1">Select Safety Circle Group</label>
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedMember(null);
                }}
                className="w-full bg-[#F5F5F5] border border-[#E1E1E1] rounded-2xl px-3.5 py-2.5 text-xs text-[#09003B] focus:outline-none focus:border-[#3A67D5]"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.memberCount} members)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09003B] mb-1">
                Select Contact to Notify
              </label>
              {members.length === 0 ? (
                <p className="text-xs text-[#888887] py-2">No members found in this group.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {members.map((member) => {
                    const isSelected = selectedMember?.id === member.id;
                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#EBF0FF] border-[#3A67D5] text-[#09003B] font-semibold'
                            : 'bg-white border-[#E1E1E1] text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-[#09003B]">{member.name}</p>
                          <p className="text-[11px] text-[#888887]">{member.relationship || 'Member'}</p>
                        </div>
                        <span className="text-[11px] font-mono text-[#888887]">
                          {member.phone ? member.phone.slice(-4).padStart(member.phone.length, '•') : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#09003B] mb-1">
                Relay Message
              </label>
              <textarea
                rows={3}
                placeholder="Explain the situation (e.g. 'Miles is with me, his phone battery died. He is safe and at Central Station.')"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                className="w-full bg-[#F5F5F5] border border-[#E1E1E1] rounded-2xl p-3 text-xs text-[#09003B] placeholder-gray-400 focus:outline-none focus:border-[#3A67D5]"
              />
              <p className="text-[10px] text-right text-[#888887] mt-0.5">{message.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={!selectedMember || !message.trim()}
              className="w-full h-12 rounded-full bg-[#3A67D5] hover:bg-[#2F54B5] text-white text-sm font-bold flex items-center justify-center gap-2 touch-manipulation disabled:opacity-50 shadow-md"
            >
              Review Message
              <ArrowRight className="size-4" />
            </button>
          </form>
        ) : step === 'review' ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Confirm Relay</h4>
              <div>
                <span className="text-[11px] text-[#888887]">Recipient:</span>
                <p className="text-sm font-bold text-[#09003B]">{selectedMember?.name}</p>
                <p className="text-xs font-mono text-[#64748B]">
                  {selectedMember?.phone ? selectedMember.phone.slice(-4).padStart(selectedMember.phone.length, '•') : ''}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-[#888887]">Message to send:</span>
                <p className="text-xs text-[#09003B] bg-white p-3 rounded-xl border border-[#E2E8F0] mt-1 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl text-[11px] text-[#92400E] flex items-start gap-2">
              <ShieldAlert className="size-4 shrink-0 text-[#D97706] mt-0.5" />
              <p>
                This is a <span className="font-bold">one-time message</span>. No account access, continuous GPS tracking, or private conversations are shared.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep('compose')}
                className="flex-1 h-12 rounded-full border border-[#E1E1E1] text-xs font-semibold text-[#888887] hover:bg-[#F8FAFC]"
              >
                Back / Edit
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSendRelay}
                className="flex-1 h-12 rounded-full bg-[#00AA1D] hover:bg-[#009218] text-white text-xs font-bold flex items-center justify-center gap-1.5 touch-manipulation shadow-md disabled:opacity-50"
              >
                {loading ? <AuthSpinner /> : <Send className="size-4" />}
                {loading ? 'Sending…' : 'Send One-Time Message'}
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-[#DCFCE7] text-[#15803D] mx-auto flex items-center justify-center">
              <CheckCircle className="size-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#09003B]">Message Sent Successfully</h4>
              <p className="text-xs text-[#64748B] mt-1">
                {result?.note || 'The bystander message was recorded and sent to the contact.'}
              </p>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left text-xs text-[#64748B] space-y-1">
              <p className="font-semibold text-[#09003B]">Relay Record:</p>
              <p className="text-[11px]">Recipient: {result?.target.name} ({result?.target.phoneMasked})</p>
              <p className="text-[11px]">One-Time Completed: ✓</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-full bg-[#3A67D5] text-white text-xs font-bold hover:bg-[#2F54B5]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

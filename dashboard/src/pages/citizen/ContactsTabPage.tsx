import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X, MessageCircle, MapPin, Share2, Shield, Users } from 'lucide-react';
import { api } from '../../services/api';
import { AddressBookContact, ContactGroup } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from '../../components/auth/AuthShell';
import { InviteShareModal } from '../../components/citizen/InviteShareModal';
import { LocationRequestModal } from '../../components/citizen/LocationRequestModal';
import { BystanderRelayModal } from '../../components/citizen/BystanderRelayModal';
import { DirectChatSheet } from '../../components/citizen/DirectChatSheet';

type SearchUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  initials: string;
};

const AVATAR_COLORS = ['#3A67D5', '#00AA1D', '#F59E0B', '#8B5CF6', '#DC2626', '#0EA5E9'];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export const ContactsTabPage: React.FC = () => {
  const [tab, setTab] = useState<'contacts' | 'groups'>('contacts');
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [emptyTitle, setEmptyTitle] = useState('No contacts yet');
  const [emptyBody, setEmptyBody] = useState("Add people you trust. They'll be notified in emergencies.");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Modals state
  const [inviteModal, setInviteModal] = useState<{ isOpen: boolean; groupId?: string; groupName?: string }>({
    isOpen: false,
  });
  const [locReqTarget, setLocReqTarget] = useState<{ isOpen: boolean; user?: { id: string; name: string } }>({
    isOpen: false,
  });
  const [isBystanderOpen, setIsBystanderOpen] = useState(false);
  const [directChatTarget, setDirectChatTarget] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: '',
  });

  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getContacts();
      setContacts(data.contacts || []);
      if (data.emptyState?.title) setEmptyTitle(data.emptyState.title);
      if (data.emptyState?.body) setEmptyBody(data.emptyState.body);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load contacts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGroups = useCallback(async () => {
    try {
      const groupList = await api.getContactGroups();
      setGroups(groupList || []);
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    void loadContacts();
    void loadGroups();
  }, [loadContacts, loadGroups]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="relative px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#09003B]">Contacts & Circles</h1>
            <p className="text-[11px] text-[#888887]">Your trusted safety network</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInviteModal({ isOpen: true })}
              className="h-9 px-3 rounded-full bg-[#EBF1FD] text-[#3A67D5] hover:bg-[#DCE7FC] text-xs font-semibold flex items-center gap-1.5 touch-manipulation transition-colors shadow-sm"
              aria-label="Invite to circle"
            >
              <Share2 className="size-3.5" />
              <span>Invite</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="size-9 rounded-full bg-[#3A67D5] text-white flex items-center justify-center touch-manipulation shadow-sm hover:bg-[#2A55C0] transition-colors"
              aria-label="Add contact"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex rounded-full bg-[#F5F5F5] p-1">
          <button
            type="button"
            onClick={() => setTab('contacts')}
            className={`flex-1 h-9 rounded-full text-sm font-medium touch-manipulation transition-colors ${
              tab === 'contacts' ? 'bg-[#3A67D5] text-white shadow-sm' : 'text-[#888887]'
            }`}
          >
            All Contacts ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('groups')}
            className={`flex-1 h-9 rounded-full text-sm font-medium touch-manipulation transition-colors ${
              tab === 'groups' ? 'bg-[#3A67D5] text-white shadow-sm' : 'text-[#888887]'
            }`}
          >
            Safety Circles ({groups.length})
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AuthErrorBanner message={errorMessage} />

        {tab === 'groups' ? (
          <div className="space-y-3 pt-2">
            {groups.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Users className="size-10 text-[#888887] mx-auto opacity-40" />
                <p className="text-sm font-semibold text-[#09003B]">No safety circles yet</p>
                <p className="text-xs text-[#888887]">Circles alert groups of trusted contacts together.</p>
              </div>
            ) : (
              groups.map((grp) => (
                <div
                  key={grp.id}
                  className="rounded-2xl border border-[#EBEBEB] bg-gradient-to-br from-white to-[#F9FAFC] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: grp.color || '#3A67D5' }}
                      >
                        {grp.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#09003B]">{grp.name}</h3>
                        <p className="text-xs text-[#888887] flex items-center gap-1.5 mt-0.5">
                          <span>{grp.memberCount ?? 0} members</span>
                          {grp.isDefaultSOS && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#DC2626] bg-red-50 px-1.5 py-0.5 rounded-full">
                              <Shield className="size-2.5" /> SOS Default
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInviteModal({ isOpen: true, groupId: grp.id, groupName: grp.name })}
                      className="px-3 py-1.5 rounded-full bg-[#EBF1FD] text-[#3A67D5] hover:bg-[#DCE7FC] text-xs font-semibold flex items-center gap-1 touch-manipulation"
                    >
                      <Share2 className="size-3" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>
              ))
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsBystanderOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left hover:bg-amber-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    🤝
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">Bystander Emergency Relay</p>
                    <p className="text-[11px] text-amber-800">Send a one-time message for an incapacitated friend</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-700">Relay →</span>
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-[#3A67D5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm font-semibold text-[#09003B]">{emptyTitle}</p>
            <p className="text-xs text-[#888887]">{emptyBody}</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex min-h-10 px-5 rounded-full bg-[#3A67D5] text-white text-sm font-medium touch-manipulation shadow-sm"
              >
                Add contact
              </button>
              <button
                type="button"
                onClick={() => setInviteModal({ isOpen: true })}
                className="inline-flex min-h-10 px-4 rounded-full bg-[#EBF1FD] text-[#3A67D5] text-sm font-medium touch-manipulation"
              >
                Invite Non-Users
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {contacts.map((contact) => {
              const targetUserId = contact.userId || contact.id;
              return (
                <li key={contact.id} className="flex items-center justify-between py-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="size-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: colorForId(contact.id) }}
                    >
                      {contact.initials || contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#09003B] truncate">{contact.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-[#888887]">{contact.relationship || contact.status || 'Contact'}</span>
                        {contact.group?.tag && (
                          <span className="text-[10px] font-semibold text-[#3A67D5] bg-[#EBF1FD] px-1.5 py-0.5 rounded-full shrink-0">
                            {contact.group.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setDirectChatTarget({
                          isOpen: true,
                          userId: targetUserId,
                          userName: contact.name,
                        })
                      }
                      title="1-on-1 Chat with photo/video"
                      className="size-8 rounded-full bg-[#F5F7FA] text-[#3A67D5] hover:bg-[#EBF1FD] flex items-center justify-center touch-manipulation transition-colors"
                      aria-label={`Chat with ${contact.name}`}
                    >
                      <MessageCircle className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLocReqTarget({
                          isOpen: true,
                          user: { id: targetUserId, name: contact.name },
                        })
                      }
                      title="Request Location (Family & Friends)"
                      className="size-8 rounded-full bg-[#F5F7FA] text-emerald-600 hover:bg-emerald-50 flex items-center justify-center touch-manipulation transition-colors"
                      aria-label={`Request location from ${contact.name}`}
                    >
                      <MapPin className="size-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Feature 1 — Non-user invite share modal */}
      {inviteModal.isOpen && (
        <InviteShareModal
          onClose={() => setInviteModal({ isOpen: false })}
        />
      )}

      {/* Feature 6 — Location Request Modal */}
      {locReqTarget.isOpen && locReqTarget.user && (
        <LocationRequestModal
          groupId={groups[0]?.id || 'grp-family-01'}
          groupName={groups[0]?.name || 'Family & Friends'}
          targetUserId={locReqTarget.user.id}
          targetName={locReqTarget.user.name}
          onClose={() => setLocReqTarget({ isOpen: false })}
        />
      )}

      {/* Feature 10 — 1-to-1 Direct Chat Sheet with Photo/Video */}
      {directChatTarget.isOpen && (
        <DirectChatSheet
          peerUserId={directChatTarget.userId}
          peerName={directChatTarget.userName}
          onBack={() => setDirectChatTarget({ isOpen: false, userId: '', userName: '' })}
        />
      )}

      {/* Feature 11 — Bystander Mode Relay Modal */}
      {isBystanderOpen && (
        <BystanderRelayModal
          onClose={() => setIsBystanderOpen(false)}
        />
      )}

      {isAddOpen && (
        <AddContactModal
          onClose={() => setIsAddOpen(false)}
          onAdded={async () => {
            setIsAddOpen(false);
            await loadContacts();
          }}
        />
      )}
    </div>
  );
};

const AddContactModal: React.FC<{
  onClose: () => void;
  onAdded: () => Promise<void>;
}> = ({ onClose, onAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<SearchUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .getContactStatuses()
      .then((data) => {
        const list = Array.isArray(data?.statuses) ? data.statuses : [];
        setStatuses(list);
        if (list[0]) setStatus(list[0]);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selected) return;
    const q = searchQuery.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setErrorMessage(null);
      try {
        const data = await api.searchRegisteredUsers(q);
        if (!cancelled) setResults(data.users || []);
      } catch (err: unknown) {
        if (!cancelled) {
          setResults([]);
          setErrorMessage(err instanceof Error ? err.message : 'Search failed.');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, selected]);

  const canSubmit = Boolean(selected && status.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setErrorMessage('Search and select a registered user.');
      return;
    }
    if (!status.trim()) {
      setErrorMessage('Status is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.createContact({
        userId: selected.id,
        status: status.trim(),
        relationship: status.trim(),
      });
      await onAdded();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resultHint = useMemo(() => {
    if (selected) return null;
    if (searchQuery.trim().length < 2) return 'Type a name or email to find registered users.';
    if (isSearching) return 'Searching…';
    if (results.length === 0) return 'No matching verified users found.';
    return null;
  }, [selected, searchQuery, isSearching, results.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close overlay"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[340px] rounded-2xl bg-white shadow-xl border border-[#E1E1E1] p-5 animate-fadeIn">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#09003B]">Add Contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-[#888887] hover:bg-[#F5F5F5] touch-manipulation"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <AuthErrorBanner message={errorMessage} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contact-search" className={authLabelClass}>
              Search User
            </label>
            {selected ? (
              <div className="flex items-center gap-3 min-h-12 px-3 rounded-lg border border-[#3A67D5] bg-[#F4F7FC]">
                <div
                  className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: colorForId(selected.id) }}
                >
                  {selected.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#09003B] truncate">{selected.fullName}</p>
                  <p className="text-[11px] text-[#888887] truncate">{selected.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setSearchQuery('');
                    setResults([]);
                  }}
                  className="text-xs font-medium text-[#3A67D5] touch-manipulation"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="contact-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  autoComplete="off"
                  className={`${authInputClass} pr-11`}
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-[#888887]" />
              </div>
            )}

            {!selected && (
              <div className="mt-2">
                {resultHint && <p className="text-[11px] text-[#888887] px-0.5">{resultHint}</p>}
                {results.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#E1E1E1] divide-y divide-[#F0F0F0]">
                    {results.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(user);
                            setSearchQuery(user.fullName);
                            setResults([]);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F4F7FC] touch-manipulation"
                        >
                          <div
                            className="size-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: colorForId(user.id) }}
                          >
                            {user.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#09003B] truncate">{user.fullName}</p>
                            <p className="text-[11px] text-[#888887] truncate">{user.email}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="contact-status" className={authLabelClass}>
              Status
            </label>
            <select
              id="contact-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${authInputClass} appearance-none`}
              required
            >
              {statuses.length === 0 && <option value="">Loading…</option>}
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className={authPrimaryBtnClass}
          >
            {isSubmitting ? <AuthSpinner /> : 'Add Contact'}
          </button>
        </form>
      </div>
    </div>
  );
};

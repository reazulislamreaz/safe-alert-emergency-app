import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { api } from '../../services/api';
import { AddressBookContact } from '../../types';
import { AuthErrorBanner, AuthSpinner } from '../../components/auth/AuthFeedback';
import {
  authInputClass,
  authLabelClass,
  authPrimaryBtnClass,
} from '../../components/auth/AuthShell';

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
  const [emptyTitle, setEmptyTitle] = useState('No contacts yet');
  const [emptyBody, setEmptyBody] = useState("Add people you trust. They'll be notified in emergencies.");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="relative px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#09003B]">Contacts</h1>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="size-9 rounded-full bg-[#3A67D5] text-white flex items-center justify-center touch-manipulation shadow-sm"
            aria-label="Add contact"
          >
            <Plus className="size-5" />
          </button>
        </div>

        <div className="mt-4 flex rounded-full bg-[#F5F5F5] p-1">
          <button
            type="button"
            onClick={() => setTab('contacts')}
            className={`flex-1 h-9 rounded-full text-sm font-medium touch-manipulation ${
              tab === 'contacts' ? 'bg-[#3A67D5] text-white' : 'text-[#888887]'
            }`}
          >
            All Contacts
          </button>
          <button
            type="button"
            onClick={() => setTab('groups')}
            className={`flex-1 h-9 rounded-full text-sm font-medium touch-manipulation ${
              tab === 'groups' ? 'bg-[#3A67D5] text-white' : 'text-[#888887]'
            }`}
          >
            Groups
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <AuthErrorBanner message={errorMessage} />

        {tab === 'groups' ? (
          <p className="text-sm text-[#888887] text-center py-16">
            Your emergency groups are also listed on the Alerts tab under MY GROUPS.
          </p>
        ) : isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-[#3A67D5] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm font-semibold text-[#09003B]">{emptyTitle}</p>
            <p className="text-xs text-[#888887]">{emptyBody}</p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex min-h-10 px-5 rounded-full bg-[#3A67D5] text-white text-sm font-medium touch-manipulation"
            >
              Add contact
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex items-center gap-3 py-3">
                <div
                  className="size-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: colorForId(contact.id) }}
                >
                  {contact.initials || contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#09003B] truncate">{contact.name}</p>
                  <p className="text-xs text-[#888887]">{contact.relationship || contact.status}</p>
                </div>
                {contact.group?.tag && (
                  <span className="text-xs font-medium text-[#3A67D5] shrink-0">{contact.group.tag}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

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

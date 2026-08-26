import React, { useState } from 'react';
import { Search, MoreVertical, X, Check, Shield, MapPin, Mail, Phone, Calendar } from 'lucide-react';
import { UserItem } from '../types';

export const UserManagementPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const initialUsers: UserItem[] = [
    {
      id: 'usr-1',
      name: 'Sarah Mitchell',
      email: 'smitchell@example.com',
      initials: 'SM',
      avatarColor: '#2563EB',
      plan: 'Premium',
      status: 'Active',
      location: 'Austin, TX',
      joined: 'Jan 15, 2025',
      alerts: 1,
    },
    {
      id: 'usr-2',
      name: 'James Okafor',
      email: 'jokafor@example.com',
      initials: 'JO',
      avatarColor: '#2563EB',
      plan: 'Free',
      status: 'Active',
      location: 'Houston, TX',
      joined: 'Feb 3, 2025',
      alerts: 0,
    },
    {
      id: 'usr-3',
      name: 'Priya Sharma',
      email: 'psharma@example.com',
      initials: 'PS',
      avatarColor: '#2563EB',
      plan: 'Free',
      status: 'Active',
      location: 'Dallas, TX',
      joined: 'Mar 18, 2025',
      alerts: 1,
    },
    {
      id: 'usr-4',
      name: 'Carlos Rivera',
      email: 'crivera@example.com',
      initials: 'CR',
      avatarColor: '#2563EB',
      plan: 'Premium',
      status: 'Suspended',
      location: 'San Antonio, TX',
      joined: 'Nov 5, 2024',
      alerts: 4,
    },
    {
      id: 'usr-5',
      name: 'Emily Chen',
      email: 'echen@example.com',
      initials: 'EC',
      avatarColor: '#2563EB',
      plan: 'Premium',
      status: 'Active',
      location: 'Fort Worth, TX',
      joined: 'Apr 1, 2025',
      alerts: 0,
    },
    {
      id: 'usr-6',
      name: 'Marcus Webb',
      email: 'mwebb@example.com',
      initials: 'MW',
      avatarColor: '#2563EB',
      plan: 'Free',
      status: 'Active',
      location: 'El Paso, TX',
      joined: 'Dec 22, 2024',
      alerts: 0,
    },
    {
      id: 'usr-7',
      name: 'Aisha Johnson',
      email: 'ajohnson@example.com',
      initials: 'AJ',
      avatarColor: '#2563EB',
      plan: 'Premium',
      status: 'Active',
      location: 'Arlington, TX',
      joined: 'Jan 30, 2025',
      alerts: 1,
    },
    {
      id: 'usr-8',
      name: 'Ryan Park',
      email: 'rpark@example.com',
      initials: 'RP',
      avatarColor: '#2563EB',
      plan: 'Free',
      status: 'Active',
      location: 'Seattle, WA',
      joined: 'Feb 14, 2025',
      alerts: 0,
    },
  ];

  const filteredUsers = initialUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            User Management
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            48 registered users
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => setSelectedUser(user)}
            className="figma-card w-full p-4 text-left touch-manipulation"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-sm shrink-0"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  user.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {user.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
              <span className={user.plan === 'Premium' ? 'text-amber-500 font-semibold' : 'font-medium'}>
                {user.plan}
              </span>
              <span>{user.location}</span>
              <span>{user.joined}</span>
              <span className={user.alerts > 0 ? 'text-red-500 font-bold' : ''}>
                {user.alerts} alerts
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="figma-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 text-gray-400 uppercase text-[10px] tracking-wider font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Alerts</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50/70 transition-colors"
                >
                  {/* User Name & Initials Avatar */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{user.name}</p>
                        <p className="text-[11px] text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-3.5">
                    <span 
                      className={`font-semibold ${
                        user.plan === 'Premium' ? 'text-amber-500' : 'text-gray-500'
                      }`}
                    >
                      {user.plan}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-3.5 text-gray-600 font-medium">
                    {user.location}
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-3.5 text-gray-500">
                    {user.joined}
                  </td>

                  {/* Alerts Count */}
                  <td className="px-6 py-3.5">
                    <span className={`font-bold ${user.alerts > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {user.alerts}
                    </span>
                  </td>

                  {/* Actions (View Button) */}
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-y-auto max-h-[90dvh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white shadow-sm"
                  style={{ backgroundColor: selectedUser.avatarColor }}
                >
                  {selectedUser.initials}
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-900">{selectedUser.name}</h4>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Plan Tier:</span>
                  <span className="font-bold text-amber-600">{selectedUser.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Status:</span>
                  <span className="font-bold text-emerald-600">{selectedUser.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium text-gray-800">{selectedUser.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Joined Date:</span>
                  <span className="text-gray-800">{selectedUser.joined}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Alerts Broadcasted:</span>
                  <span className="font-bold text-red-500">{selectedUser.alerts}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

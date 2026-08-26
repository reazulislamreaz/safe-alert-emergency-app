import React, { useEffect, useState } from 'react';
import { Search, User as UserIcon, X } from 'lucide-react';
import { LiveTacticalMap } from '../components/common/LiveTacticalMap';
import { LiveGroupItem } from '../types';
import { api, LiveGroupCounts } from '../services/api';

const EMPTY_COUNTS: LiveGroupCounts = {
  all: 0,
  sos: 0,
  fire: 0,
  medical: 0,
  police: 0,
  natural: 0,
  idle: 0,
};

export const LiveGroupStatusPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<LiveGroupItem[]>([]);
  const [counts, setCounts] = useState<LiveGroupCounts>(EMPTY_COUNTS);
  const [selectedGroup, setSelectedGroup] = useState<LiveGroupItem | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPoints, setHistoryPoints] = useState<{
    id: string;
    latitude: number;
    longitude: number;
    timeAgo: string;
    address: string | null;
  }[]>([]);

  useEffect(() => {
    let cancelled = false;
    api.getLiveGroups()
      .then((data) => {
        if (cancelled) return;
        setGroups(data.groups);
        setCounts(data.counts);
        setSelectedGroup((prev) => {
          const still = prev ? data.groups.find((group) => group.id === prev.id) : undefined;
          return still ?? data.groups[0] ?? null;
        });
        setHistoryOpen(false);
        setHistoryPoints([]);
      })
      .catch(() => {
        if (cancelled) return;
        setGroups([]);
        setCounts(EMPTY_COUNTS);
        setSelectedGroup(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    { id: 'ALL', label: `All (${counts.all})` },
    { id: 'SOS', label: `🔴 SOS active (${counts.sos})` },
    { id: 'FIRE', label: 'Fire' },
    { id: 'MEDICAL', label: 'Medical' },
    { id: 'POLICE', label: 'Police / Security' },
    { id: 'NATURAL', label: 'Natural disaster' },
    { id: 'IDLE', label: 'Idle' },
  ];

  const filteredGroups = groups.filter((g) => {
    const searchMatch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (!searchMatch) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'SOS') return g.status === 'SOS active';
    if (selectedCategory === 'FIRE') return g.category === 'FIRE';
    if (selectedCategory === 'MEDICAL') return g.category === 'MEDICAL';
    if (selectedCategory === 'POLICE') return g.category === 'POLICE / SECURITY';
    if (selectedCategory === 'NATURAL') return g.category === 'NATURAL DISASTER';
    if (selectedCategory === 'IDLE') return g.status === 'Idle';
    return true;
  });

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'MEDICAL':
        return 'bg-blue-50 text-blue-600';
      case 'FIRE':
        return 'bg-red-50 text-red-500';
      case 'POLICE / SECURITY':
        return 'bg-amber-50 text-amber-600';
      case 'NATURAL DISASTER':
        return 'bg-emerald-50 text-emerald-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Rounded Pill Search Box */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by group name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full pl-5 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Filter Tabs / Rounded Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
          {categories.map((cat) => {
            const isAll = cat.id === 'ALL';
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? isAll
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-[#2563EB] text-white shadow-sm'
                    : isAll
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 Columns Layout Matching Figma */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Group Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3 max-h-[min(22rem,50vh)] lg:max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
          {filteredGroups.map((grp) => {
            const isSelected = selectedGroup?.id === grp.id;

            return (
              <div
                key={grp.id}
                onClick={() => {
                  setSelectedGroup(grp);
                  setHistoryOpen(false);
                }}
                className={`bg-white p-4 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/10'
                    : 'border border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Line 1: Title & Category Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-gray-900 min-w-0 pr-2">{grp.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${getCategoryBadgeClass(
                      grp.category
                    )}`}
                  >
                    {grp.category}
                  </span>
                </div>

                {/* Line 2: Members & Code */}
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  <span>{grp.membersCount} members</span>
                  <span className="mx-1 text-gray-300">|</span>
                  <span className="font-mono text-gray-400">{grp.code}</span>
                </div>

                {/* Line 3: Status & Time Ago */}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold flex items-center gap-1.5 ${
                      grp.status === 'SOS active'
                        ? 'text-red-500 font-bold'
                        : grp.status === 'Monitoring'
                        ? 'text-blue-600'
                        : (grp.status as any) === 'Resolved'
                        ? 'text-emerald-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {grp.status === 'SOS active' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                        <span className="text-red-500">● SOS active</span>
                      </>
                    ) : grp.status === 'Monitoring' ? (
                      <span>● Monitoring</span>
                    ) : (grp.status as any) === 'Resolved' ? (
                      <span>● Resolved</span>
                    ) : (
                      <span>● Idle</span>
                    )}
                  </span>
                  <span className="text-gray-400 text-[10px]">{grp.timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Group View & Dark Map & Member List (7 cols) */}
        <div className="lg:col-span-7">
          {selectedGroup && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 min-w-0">
            {/* Header Title & Badges */}
            <div>
              <h3 className="text-base font-bold text-gray-900">{selectedGroup.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${getCategoryBadgeClass(
                    selectedGroup.category
                  )}`}
                >
                  {selectedGroup.category}
                </span>
                <span className="text-xs text-gray-400 font-mono">{selectedGroup.code}</span>
                <span className="text-gray-300">•</span>
                <span className={`text-xs font-bold ${
                  selectedGroup.status === 'SOS active'
                    ? 'text-red-500'
                    : selectedGroup.status === 'Monitoring'
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}>
                  ● {selectedGroup.status}
                </span>
              </div>
            </div>

            {/* Robust Tactical Map */}
            <LiveTacticalMap
              lat={selectedGroup.lat}
              lng={selectedGroup.lng}
              groupName={selectedGroup.name}
              category={selectedGroup.category}
            />

            {/* Group Members Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2 gap-3">
                <h4 className="text-xs font-bold text-gray-900">
                  Group members ({selectedGroup.members.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedGroup) return;
                    api.getGroupLocationHistory(selectedGroup.id)
                      .then((data) => {
                        setHistoryPoints(data.points);
                        setHistoryOpen(true);
                      })
                      .catch(() => {
                        setHistoryPoints([]);
                        setHistoryOpen(true);
                      });
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0"
                >
                  View location history
                </button>
              </div>

              {/* Members List */}
              <div className="divide-y divide-gray-100">
                {selectedGroup.members.map((mem) => (
                  <div key={mem.id} className="py-3 flex items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: mem.color }}
                      >
                        {mem.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight truncate">{mem.name}</p>
                        <p className="text-[11px] text-gray-400">{mem.role}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold ${
                          mem.status === 'SOS triggered'
                            ? 'text-red-500'
                            : mem.status === 'Safe'
                            ? 'text-emerald-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {mem.status === 'SOS triggered'
                          ? '● SOS triggered'
                          : mem.status === 'Safe'
                          ? '● Safe'
                          : '● Last seen'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{mem.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {historyOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-y-auto max-h-[90dvh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Location history</h3>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500">{selectedGroup.name}</p>
              {historyPoints.length === 0 ? (
                <p className="text-xs text-gray-400">No location history for this group yet.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {historyPoints.map((point) => (
                    <div key={point.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 font-mono">
                          {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                        </p>
                        {point.address && (
                          <p className="text-[11px] text-gray-400 truncate">{point.address}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">{point.timeAgo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

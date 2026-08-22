import React, { useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { LiveTacticalMap } from '../components/common/LiveTacticalMap';
import { LiveGroupItem } from '../types';

export const LiveGroupStatusPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const groups: LiveGroupItem[] = [
    {
      id: 'grp-1',
      code: 'GRP-3391',
      name: 'Uttara Night Patrol',
      category: 'MEDICAL',
      membersCount: 8,
      timeAgo: '6 min ago',
      status: 'SOS active',
      lat: 23.8759,
      lng: 90.3795,
      members: [
        { id: 'm-1', name: 'Rafiq Ahmed', initials: 'RA', color: '#2563EB', role: 'Group Admin', status: 'SOS triggered', timeAgo: '6 min ago' },
        { id: 'm-2', name: 'Shirin Nahar', initials: 'SN', color: '#2563EB', role: 'Member', status: 'Safe', timeAgo: '1 min ago' },
        { id: 'm-3', name: 'Kamal Islam', initials: 'KI', color: '#2563EB', role: 'Member', status: 'Safe', timeAgo: '3 min ago' },
        { id: 'm-4', name: 'Farzana Haque', initials: 'FH', color: '#2563EB', role: 'Member', status: 'Last seen', timeAgo: '12 min ago' },
      ],
    },
    {
      id: 'grp-2',
      code: 'GRP-3388',
      name: 'Farmgate Response Team',
      category: 'FIRE',
      membersCount: 12,
      timeAgo: '41 min ago',
      status: 'SOS active',
      lat: 23.7561,
      lng: 90.3872,
      members: [
        { id: 'm-5', name: 'Kabir Hossain', initials: 'KH', color: '#2563EB', role: 'Group Admin', status: 'SOS triggered', timeAgo: '41 min ago' },
        { id: 'm-6', name: 'Fariha Yasmin', initials: 'FY', color: '#2563EB', role: 'Member', status: 'Safe', timeAgo: '42 min ago' },
      ],
    },
    {
      id: 'grp-3',
      code: 'GRP-3360',
      name: 'Gulshan Watch Circle',
      category: 'POLICE / SECURITY',
      membersCount: 5,
      timeAgo: '38 min ago',
      status: 'Idle',
      lat: 23.7925,
      lng: 90.4078,
      members: [
        { id: 'm-7', name: 'Tanvir Islam', initials: 'TI', color: '#2563EB', role: 'Group Admin', status: 'Safe', timeAgo: '38 min ago' },
      ],
    },
    {
      id: 'grp-4',
      code: 'GRP-3401',
      name: 'Riverside Watch',
      category: 'MEDICAL',
      membersCount: 6,
      timeAgo: '14 min ago',
      status: 'Monitoring',
      lat: 23.7104,
      lng: 90.4074,
      members: [
        { id: 'm-8', name: 'Farhan Zahed', initials: 'FZ', color: '#2563EB', role: 'Group Admin', status: 'Safe', timeAgo: '14 min ago' },
      ],
    },
    {
      id: 'grp-5',
      code: 'GRP-3355',
      name: 'Dhaka-04 Night Patrol',
      category: 'MEDICAL',
      membersCount: 9,
      timeAgo: '2 min ago',
      status: 'Resolved' as any,
      lat: 23.8103,
      lng: 90.4125,
      members: [
        { id: 'm-9', name: 'Mehedi Hasan', initials: 'MH', color: '#2563EB', role: 'Group Admin', status: 'Safe', timeAgo: '2 min ago' },
      ],
    },
    {
      id: 'grp-6',
      code: 'GRP-3299',
      name: 'Mirpur Coastal Watch',
      category: 'NATURAL DISASTER',
      membersCount: 15,
      timeAgo: '1 hr ago',
      status: 'Monitoring',
      lat: 23.8223,
      lng: 90.3654,
      members: [
        { id: 'm-10', name: 'Zubair Alom', initials: 'ZA', color: '#2563EB', role: 'Group Admin', status: 'Safe', timeAgo: '1 hr ago' },
      ],
    },
  ];

  const [selectedGroup, setSelectedGroup] = useState<LiveGroupItem>(groups[0]);

  const categories = [
    { id: 'ALL', label: 'All (98)' },
    { id: 'SOS', label: '🔴 SOS active (3)' },
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
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
        <div className="lg:col-span-5 space-y-3 max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
          {filteredGroups.map((grp) => {
            const isSelected = selectedGroup.id === grp.id;

            return (
              <div
                key={grp.id}
                onClick={() => setSelectedGroup(grp)}
                className={`bg-white p-4 rounded-2xl cursor-pointer transition-all ${
                  isSelected
                    ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/10'
                    : 'border border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                {/* Line 1: Title & Category Badge */}
                <div className="flex items-start justify-between">
                  <h4 className="text-xs font-bold text-gray-900">{grp.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${getCategoryBadgeClass(
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
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header Title & Badges */}
            <div>
              <h3 className="text-base font-bold text-gray-900">{selectedGroup.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${getCategoryBadgeClass(
                    selectedGroup.category
                  )}`}
                >
                  {selectedGroup.category}
                </span>
                <span className="text-xs text-gray-400 font-mono">{selectedGroup.code}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-bold text-red-500">
                  ● SOS active
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
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                <h4 className="text-xs font-bold text-gray-900">
                  Group members ({selectedGroup.members.length})
                </h4>
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                  View location history
                </button>
              </div>

              {/* Members List */}
              <div className="divide-y divide-gray-100">
                {selectedGroup.members.map((mem) => (
                  <div key={mem.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0"
                        style={{ backgroundColor: mem.color }}
                      >
                        {mem.initials}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 leading-tight">{mem.name}</p>
                        <p className="text-[11px] text-gray-400">{mem.role}</p>
                      </div>
                    </div>

                    <div className="text-right">
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
        </div>
      </div>
    </div>
  );
};

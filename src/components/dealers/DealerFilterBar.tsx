'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface ZoneStat {
  zone: string;
  total_ro: number;
  audited_ro: number;
  avg_score: number | null;
}

interface DealerFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  selectedZone: string;
  setSelectedZone: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  zoneStats: ZoneStat[];
}

export function DealerFilterBar({
  search,
  setSearch,
  selectedZone,
  setSelectedZone,
  statusFilter,
  setStatusFilter,
  zoneStats
}: DealerFilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
      <div className="flex-1 min-w-[240px] relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by RO Name, CMS Code, Dealer, or Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#002855]"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002855]"
        >
          <option value="All">All Operating Zones</option>
          {zoneStats.map((z) => (
            <option key={z.zone} value={z.zone}>
              {z.zone} Zone ({z.total_ro} ROs)
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#002855]"
        >
          <option value="">All Submission Statuses</option>
          <option value="REUPLOAD_PENDING">📷 Re-upload Pending from Dealer</option>
          <option value="REUPLOAD_DONE">✨ Re-upload Done • Needs Review</option>
          <option value="AWAITING_APPROVAL">⏳ Awaiting Approval</option>
          <option value="APPROVED">✓ Certified &amp; Approved</option>
          <option value="PENDING_ENTRY">Awaiting Dealer Entry</option>
        </select>
      </div>
    </div>
  );
}

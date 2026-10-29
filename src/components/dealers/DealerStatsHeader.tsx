'use client';

import React from 'react';
import { Building2, CheckCircle2, Clock, Camera } from 'lucide-react';

interface ZoneStat {
  zone: string;
  total_ro: number;
  audited_ro: number;
  avg_score: number | null;
}

interface DealerStatsHeaderProps {
  totalOutlets: number;
  certifiedCount: number;
  pendingApprovalCount: number;
  reuploadPendingCount: number;
  reuploadDoneCount: number;
}

export function DealerStatsHeader({
  totalOutlets,
  certifiedCount,
  pendingApprovalCount,
  reuploadPendingCount,
  reuploadDoneCount
}: DealerStatsHeaderProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Total Outlets</div>
          <div className="text-xl font-bold text-slate-900">{totalOutlets}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Certified / Approved</div>
          <div className="text-xl font-bold text-emerald-700">{certifiedCount}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Awaiting Approval</div>
          <div className="text-xl font-bold text-amber-700">{pendingApprovalCount}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Photo Re-uploads</div>
          <div className="text-xs font-bold text-slate-800">
            <span className="text-amber-700 font-bold">{reuploadPendingCount} Pending</span>
            {reuploadDoneCount > 0 && <span className="text-indigo-700 font-bold ml-1.5">• {reuploadDoneCount} Done</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

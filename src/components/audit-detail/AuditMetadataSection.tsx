'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AuditMetadataSectionProps {
  audit: any;
}

export function AuditMetadataSection({ audit }: AuditMetadataSectionProps) {
  return (
    <div className="space-y-6">
      {/* Action Directives Required */}
      {audit.action_items && audit.action_items.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 sm:p-5 rounded-r-lg">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>TSM DIRECTIVES &amp; CRITICAL ACTION ITEMS REQUIRED</span>
          </div>
          <ul className="list-disc pl-5 text-xs md:text-sm text-rose-950 space-y-1">
            {audit.action_items.map((item: string, idx: number) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </ul>
        </div>
      )}

      {/* Outlet & Assessment Meta-Data */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
          1. Outlet &amp; Assessment Meta-Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Representative Name:</span>
            <strong className="text-slate-900">{audit.rep_name}</strong>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Mobile Number:</span>
            <strong className="text-slate-900">{audit.rep_mobile}</strong>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Staffing in Shift:</span>
            <strong className="text-slate-900">Total: {audit.fsm_total} (M: {audit.fsm_male} / F: {audit.fsm_female})</strong>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Last CRA Date:</span>
            <strong className="text-slate-900">{audit.last_cra_date ? new Date(audit.last_cra_date).toLocaleDateString('en-IN') : 'N/A'} ({audit.days_since_cra} days)</strong>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100 md:col-span-2">
            <span className="text-slate-500">Physical Address Stamped:</span>
            <strong className="text-slate-900 text-right">{audit.gps_address || 'Address Unavailable'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface StatutoryComplianceTableProps {
  statutory: any[];
  isAdmin: boolean;
  statReuseApprovals: Record<string, boolean>;
  setStatReuseApprovals: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  reuploadRequests: any[];
  onRequestReupload: (modalData: { targetId: string; category: 'STATUTORY'; title: string; url: string; reason: string }) => void;
  onOpenPhotoModal: (title: string, url: string) => void;
}

export function StatutoryComplianceTable({
  statutory,
  isAdmin,
  statReuseApprovals,
  setStatReuseApprovals,
  reuploadRequests,
  onRequestReupload,
  onOpenPhotoModal
}: StatutoryComplianceTableProps) {
  if (!statutory || statutory.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
        2. Critical Statutory Compliance Audit
      </h2>
      <div className="overflow-x-auto border border-slate-200 rounded-lg -mx-1 sm:mx-0">
        <table className="w-full min-w-[500px] text-left text-xs md:text-sm">
          <thead className="bg-[#002855] text-white font-semibold">
            <tr>
              <th className="p-2.5 sm:p-3">Statutory Requirement</th>
              <th className="p-2.5 sm:p-3">Status</th>
              <th className="p-2.5 sm:p-3">Validity / Certificate</th>
              <th className="p-2.5 sm:p-3 text-right">Evidence Photo</th>
              {isAdmin && <th className="p-2.5 sm:p-3 text-center no-print">Doc Reuse Approval</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {statutory.map((s: any, idx: number) => {
              const hasCert = Boolean(s.date_val && s.photo_data);
              const isAllowed = statReuseApprovals[s.id] !== undefined ? statReuseApprovals[s.id] : (s.is_approved_for_reuse !== 0);
              const pendingReq = reuploadRequests.find((r: any) => 
                (r.target_id === s.id || r.photo_title === s.key_name.replace(/_/g, ' ')) && r.status === 'PENDING'
              );

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800">{s.key_name.replace(/_/g, ' ')}</td>
                  <td className="p-2.5 sm:p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      s.status_text === 'Yes' || s.status_text === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {s.status_text}
                    </span>
                  </td>
                  <td className="p-2.5 sm:p-3 text-slate-600">{s.date_val || '-'}</td>
                  <td className="p-2.5 sm:p-3 text-right">
                    {s.photo_data ? (
                      <div className="flex flex-col items-end space-y-1.5">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => onOpenPhotoModal(s.key_name.replace(/_/g, ' '), s.photo_data)}
                            className="group relative cursor-pointer"
                            title="Click to view full-resolution certificate"
                          >
                            <img src={s.photo_data} alt={s.key_name} className={`h-10 sm:h-12 w-14 sm:w-16 object-cover rounded border ${pendingReq ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200'} group-hover:opacity-80 transition`} />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 rounded text-[10px] text-white font-bold transition">
                              Zoom
                            </span>
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => onRequestReupload({
                                targetId: s.id,
                                category: 'STATUTORY',
                                title: s.key_name.replace(/_/g, ' '),
                                url: s.photo_data,
                                reason: pendingReq ? pendingReq.reason : ''
                              })}
                              title={pendingReq ? "Edit re-upload request" : "Request dealer to retake/re-upload this certificate"}
                              className={`px-2 py-1 rounded text-[10px] font-bold no-print flex items-center space-x-1 transition cursor-pointer ${
                                pendingReq 
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs' 
                                  : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900'
                              }`}
                            >
                              <Camera className="w-3 h-3 text-current" />
                              <span>{pendingReq ? 'Re-requested ✎' : 'Request Re-upload'}</span>
                            </button>
                          )}
                        </div>

                        {pendingReq && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-1 text-[10px] text-amber-900 max-w-[180px] text-left">
                            <span className="font-bold">⚠️ Reason:</span> {pendingReq.reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No Certificate Uploaded</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="p-2.5 sm:p-3 text-center no-print">
                      {hasCert ? (
                        <label className="inline-flex items-center space-x-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setStatReuseApprovals((prev: Record<string, boolean>) => ({
                                ...prev,
                                [s.id]: checked
                              }));
                            }}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={`text-[11px] font-bold ${isAllowed ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {isAllowed ? '✓ Valid (Auto-reuse)' : '✗ Re-upload Required'}
                          </span>
                        </label>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Physical Check</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

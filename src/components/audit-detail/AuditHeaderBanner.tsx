'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Camera, AlertCircle, Clock } from 'lucide-react';

interface AuditHeaderBannerProps {
  audit: any;
  isAdmin: boolean;
  reuploadRequests: any[];
  adminRemarks: string;
  setAdminRemarks: (val: string) => void;
  confirmIncrement: boolean;
  setConfirmIncrement: (val: boolean) => void;
  approvalLoading: boolean;
  approvalMessage: string;
  onApprovalAction: (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => void;
}

export function AuditHeaderBanner({
  audit,
  isAdmin,
  reuploadRequests,
  adminRemarks,
  setAdminRemarks,
  confirmIncrement,
  setConfirmIncrement,
  approvalLoading,
  approvalMessage,
  onApprovalAction
}: AuditHeaderBannerProps) {
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT': return 'bg-emerald-600 text-white';
      case 'VERY GOOD': return 'bg-[#002855] text-white';
      case 'GOOD': return 'bg-blue-600 text-white';
      case 'AVERAGE': return 'bg-amber-500 text-slate-900';
      default: return 'bg-rose-600 text-white';
    }
  };

  const pendingReuploads = reuploadRequests.filter((r: any) => r.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Formal Header Banner */}
      <div className="border-b-2 border-[#002855] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-block bg-[#002855] text-white text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wider mb-2">
            Official Franchisee Self Assessment Report
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#002855] tracking-tight bg-transparent p-0 m-0">
            {audit.ro_name}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            CMS Code: <strong className="text-slate-800">{audit.cms_code}</strong> | Brand: <strong className="text-slate-800">{audit.brand_type}</strong> | TSM: <strong className="text-slate-800">{audit.tsm_name}</strong>
          </p>
        </div>

        <div className="text-left md:text-right">
          <div className="text-xs text-slate-400 font-medium">Audit Timestamp</div>
          <div className="text-sm font-bold text-slate-800">
            {new Date(audit.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date(audit.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{audit.gps_coords}</div>
        </div>
      </div>

      {/* Admin Review / Dealer Status Notice */}
      <div className="rounded-xl border-2 overflow-hidden shadow-xs no-print">
        {!isAdmin ? (
          <div className={`p-4 sm:p-5 ${
            audit.approval_status === 'APPROVED' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : audit.approval_status === 'REVISION_REQUIRED'
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : audit.approval_status === 'REJECTED'
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}>
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold ${
                audit.approval_status === 'APPROVED' ? 'bg-emerald-600' :
                audit.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-600' :
                audit.approval_status === 'REJECTED' ? 'bg-rose-600' : 'bg-blue-600'
              }`}>
                {audit.approval_status === 'APPROVED' ? <CheckCircle2 className="w-5 h-5" /> :
                 audit.approval_status === 'REVISION_REQUIRED' ? <Camera className="w-5 h-5" /> :
                 audit.approval_status === 'REJECTED' ? <AlertCircle className="w-5 h-5" /> :
                 <Clock className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                    audit.approval_status === 'APPROVED' ? 'bg-emerald-600' :
                    audit.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-600' :
                    audit.approval_status === 'REJECTED' ? 'bg-rose-600' : 'bg-blue-600'
                  }`}>
                    {audit.approval_status === 'APPROVED' ? 'Approved' :
                     audit.approval_status === 'REVISION_REQUIRED' ? 'Photo Revision Required' :
                     audit.approval_status === 'REJECTED' ? 'Audit Rejected' : 'Submitted & Under Review'}
                  </span>
                  {audit.approval_status === 'REVISION_REQUIRED' && pendingReuploads.length > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                      {pendingReuploads.length} Pending Re-upload(s)
                    </span>
                  )}
                  {audit.increment_confirmed === 1 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      ⭐ Monthly Bonus Increment Confirmed
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {audit.approval_status === 'APPROVED'
                    ? `Assessment Approved by ${audit.approved_by || 'Operations HQ'}`
                    : audit.approval_status === 'REVISION_REQUIRED'
                    ? 'Operations HQ has requested replacement evidence photos'
                    : audit.approval_status === 'REJECTED'
                    ? 'Assessment flagged for correction'
                    : 'Self-Assessment Submitted — Under Operations Review'}
                </h3>
                {audit.admin_remarks && (
                  <p className="text-xs text-slate-700 mt-0.5">
                    <strong>Remarks:</strong> &ldquo;{audit.admin_remarks}&rdquo;
                  </p>
                )}
                {audit.approval_status === 'REVISION_REQUIRED' && (
                  <div className="mt-3">
                    <Link
                      href="/audit-form"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Capture &amp; Upload Replacement Photos</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Admin Review Controls */
          <div className="bg-slate-50 border-slate-300 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-extrabold text-[#002855] uppercase tracking-wider">
                  Admin Assessment Review &amp; Certification
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded text-white ${
                  audit.approval_status === 'APPROVED' ? 'bg-emerald-600' :
                  audit.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-600' :
                  audit.approval_status === 'REJECTED' ? 'bg-rose-600' : 'bg-blue-600'
                }`}>
                  Current: {audit.approval_status || 'PENDING'}
                </span>
              </div>
              {approvalMessage && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                  {approvalMessage}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TSM / Operations HQ Review Remarks:
                </label>
                <textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Enter feedback, verification observations, or reasons for requested photo revisions..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002855] bg-white text-slate-900"
                  rows={2}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={confirmIncrement}
                    onChange={(e) => setConfirmIncrement(e.target.checked)}
                    className="w-4 h-4 text-[#002855] rounded border-slate-300 focus:ring-[#002855]"
                  />
                  <span>Authorize dealer bonus commission / incentive increment for this month</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={approvalLoading}
                    onClick={() => onApprovalAction('APPROVE')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{approvalLoading ? 'Processing...' : 'Approve Assessment'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={approvalLoading}
                    onClick={() => onApprovalAction('REQUEST_REVISION')}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Request Photo Revision</span>
                  </button>

                  <button
                    type="button"
                    disabled={approvalLoading}
                    onClick={() => onApprovalAction('REJECT')}
                    className="px-3 py-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Score Card Banner */}
      <div className="border-2 border-[#002855] rounded-xl p-4 sm:p-6 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider bg-transparent p-0 m-0">
            Assessment Performance Rating
          </h3>
          <div className="text-3xl sm:text-5xl font-extrabold text-[#002855]">
            {audit.percentage}%
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Total Score: <strong className="text-slate-900">{audit.total_score}</strong> out of <strong className="text-slate-900">{audit.max_possible}</strong> Points
          </p>
        </div>

        <div className="flex flex-col items-center sm:items-end">
          <span className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-black tracking-wide uppercase shadow-xs ${getGradeBadge(audit.grade)}`}>
            {audit.grade}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 sm:mt-2">Compliance Classification</span>
        </div>
      </div>
    </div>
  );
}

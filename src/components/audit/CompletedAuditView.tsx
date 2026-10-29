'use client';

import React from 'react';
import { FileText, ExternalLink, CheckCircle2, Camera } from 'lucide-react';
import ReuploadSection, { PendingReuploadItem } from './ReuploadSection';

interface CompletedAuditViewProps {
  completedAudit: {
    id: string;
    approval_status?: string;
    audit_month?: string;
    total_score: number;
    percentage: number;
    grade: string;
    created_at: string;
  };
  pendingReuploads: PendingReuploadItem[];
  uploadingPhoto: boolean;
  onReplacementCapture: (reqItem: PendingReuploadItem, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewOriginal: (reqItem: PendingReuploadItem) => void;
}

export default function CompletedAuditView({
  completedAudit,
  pendingReuploads,
  uploadingPhoto,
  onReplacementCapture,
  onViewOriginal
}: CompletedAuditViewProps) {
  const isApproved = completedAudit.approval_status === 'APPROVED';
  const isRevision = completedAudit.approval_status === 'REVISION_REQUIRED' || pendingReuploads.length > 0;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header Status Card */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
          isApproved
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : isRevision
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-blue-50 border-blue-200 text-blue-950'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
              isApproved ? 'bg-emerald-600' : isRevision ? 'bg-amber-600' : 'bg-blue-600'
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isRevision ? (
              <Camera className="w-8 h-8" />
            ) : (
              <CheckCircle2 className="w-8 h-8" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded text-white ${
                  isApproved ? 'bg-emerald-600' : isRevision ? 'bg-amber-600' : 'bg-blue-600'
                }`}
              >
                {isApproved ? 'Approved' : isRevision ? 'Photo Revision Required' : 'Submitted & Under Review'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Cycle: {completedAudit.audit_month || 'Current Month'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
              {isApproved
                ? 'Monthly Self-Assessment Approved'
                : isRevision
                ? 'Replacement Photos Requested by Operations'
                : 'Monthly Self-Assessment Complete & Under Review'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Total Score: <strong>{completedAudit.total_score}</strong> ({completedAudit.percentage}%) &bull; Rating:{' '}
              <strong>{completedAudit.grade}</strong> &bull; Submitted on{' '}
              {new Date(completedAudit.created_at).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* View Submitted Report & Start New Audit Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {!isRevision && (
            <a
              href={`/audits/${completedAudit.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition space-x-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>View Report</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Do you want to start a new assessment for this outlet? This will open a fresh audit form.')) {
                window.location.href = window.location.pathname + '?forceNew=true';
              }
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#002855] hover:bg-[#001e40] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition space-x-1.5 cursor-pointer"
          >
            <span>+ Start New Audit</span>
          </button>
        </div>
      </div>

      {/* Dedicated Replacement Photos Section */}
      <ReuploadSection
        pendingReuploads={pendingReuploads}
        uploadingPhoto={uploadingPhoto}
        onReplacementCapture={onReplacementCapture}
        onViewOriginal={onViewOriginal}
      />

      {pendingReuploads.length === 0 && (
        <div className="text-center py-10 sm:py-12 bg-white border border-dashed border-slate-200 rounded-2xl space-y-3 p-4 sm:p-6">
          <CheckCircle2 className="w-10 sm:w-12 h-10 sm:h-12 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">All Monthly Evidence Complete</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your monthly audit has been fully recorded with zero pending re-upload requests. You can view or download
            the complete assessment report above.
          </p>
        </div>
      )}
    </main>
  );
}

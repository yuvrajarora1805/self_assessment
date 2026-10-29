'use client';

import React from 'react';
import { Camera } from 'lucide-react';

export interface PendingReuploadItem {
  id: string;
  audit_id: string;
  target_id: string;
  category: string;
  photo_title: string;
  current_photo_url?: string;
  reason: string;
  status: string;
}

interface ReuploadSectionProps {
  pendingReuploads: PendingReuploadItem[];
  uploadingPhoto: boolean;
  onReplacementCapture: (reqItem: PendingReuploadItem, e: React.ChangeEvent<HTMLInputElement>) => void;
  onViewOriginal: (reqItem: PendingReuploadItem) => void;
}

export default function ReuploadSection({
  pendingReuploads,
  uploadingPhoto,
  onReplacementCapture,
  onViewOriginal
}: ReuploadSectionProps) {
  if (!pendingReuploads || pendingReuploads.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-300 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="border-b border-amber-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Specific Replacement Photos Required ({pendingReuploads.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your assessment form is already submitted. You do <strong>not</strong> need to refill the entire form. Please re-take the specific images requested below:
          </p>
        </div>
        <span className="self-start sm:self-auto text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
          {pendingReuploads.length} Action{pendingReuploads.length > 1 ? 's' : ''} Needed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingReuploads.map((req) => (
          <div key={req.id} className="border-2 border-amber-300 bg-amber-50/50 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3.5 shadow-xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug break-words">{req.photo_title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded uppercase tracking-wider shrink-0">{req.category}</span>
              </div>
              <div className="mt-2.5 p-3 bg-white border border-amber-200 rounded-lg text-xs text-amber-950 font-medium leading-relaxed">
                <strong className="text-amber-800">HQ Reviewer Note:</strong> &ldquo;{req.reason}&rdquo;
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <label className="flex-1 min-h-[44px] py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-sm transition">
                <Camera className="w-4 h-4 shrink-0" />
                <span className="truncate">{uploadingPhoto ? 'Processing photo...' : 'Capture & Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={uploadingPhoto}
                  className="hidden"
                  onChange={(e) => onReplacementCapture(req, e)}
                />
              </label>
              {req.current_photo_url && (
                <button
                  type="button"
                  onClick={() => onViewOriginal(req)}
                  className="min-h-[44px] px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition shrink-0 flex items-center justify-center space-x-1"
                  title="View previously uploaded photo"
                >
                  <span>View Original</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

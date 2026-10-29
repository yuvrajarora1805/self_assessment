'use client';

import React from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DraftStatusProps {
  progressPercent: number;
  lastSavedAt: string | null;
  isSaving: boolean;
  onSaveManual: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export default function DraftStatusBar({
  progressPercent,
  lastSavedAt,
  isSaving,
  onSaveManual,
  onSubmit,
  submitting
}: DraftStatusProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-30 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Progress details */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-600 flex items-center justify-center font-extrabold text-xs text-blue-900 shrink-0">
            {progressPercent}%
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-900">
              {progressPercent === 100 ? 'Audit Form Ready for Submission' : 'Form Completion Progress'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
              <span>{isSaving ? 'Autosaving...' : lastSavedAt ? `Autosaved at ${lastSavedAt}` : 'Autosave active'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onSaveManual}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            {submitting ? (
              <span>Generating Assessment Report...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span>Generate Final Assessment Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Camera, X } from 'lucide-react';

interface ReuploadModalProps {
  modalData: {
    targetId: string;
    category: 'STATUTORY' | 'PHOTO' | 'TANK';
    title: string;
    url: string;
    reason: string;
  };
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function ReuploadModal({
  modalData,
  submitting,
  onClose,
  onSubmit
}: ReuploadModalProps) {
  const [reason, setReason] = React.useState(modalData.reason);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Request Photo Re-upload</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-slate-500 font-medium">Target Item:</div>
          <div className="text-sm font-bold text-[#002855]">{modalData.title}</div>
          {modalData.url && (
            <img 
              src={modalData.url} 
              alt="Current Submission" 
              className="h-28 w-full object-cover rounded-lg border border-slate-200 mt-2" 
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Reason / Instructions for Dealer:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Photo is blurry, document validity date expired, gauge reading not clearly legible..."
            rows={3}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#002855] text-slate-900"
          />
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmit(reason)}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Send Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

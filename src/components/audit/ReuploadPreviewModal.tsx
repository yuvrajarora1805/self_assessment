'use client';

import React from 'react';
import { PendingReuploadItem } from './ReuploadSection';

interface ReuploadPreviewModalProps {
  item: PendingReuploadItem | null;
  onClose: () => void;
}

export default function ReuploadPreviewModal({ item, onClose }: ReuploadPreviewModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-[#002855] text-white px-4 py-3 flex items-center justify-between shrink-0">
          <h4 className="text-xs sm:text-sm font-bold text-white m-0 truncate pr-2">{item.photo_title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 text-base font-bold leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-3 bg-slate-950 flex items-center justify-center flex-1 min-h-[160px] max-h-[50dvh] overflow-hidden">
          <img
            src={item.current_photo_url}
            alt={item.photo_title}
            className="max-h-full w-auto max-w-full object-contain rounded"
          />
        </div>
        <div className="p-3.5 bg-amber-50 border-t border-amber-200 shrink-0">
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">HQ Reviewer Remark:</div>
          <p className="text-xs text-amber-900 mt-1 leading-relaxed">&ldquo;{item.reason}&rdquo;</p>
        </div>
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

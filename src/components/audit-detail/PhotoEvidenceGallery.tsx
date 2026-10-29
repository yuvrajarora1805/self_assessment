'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface PhotoEvidenceGalleryProps {
  photos: any[];
  isAdmin: boolean;
  reuploadRequests: any[];
  onRequestReupload: (modalData: { targetId: string; category: 'PHOTO'; title: string; url: string; reason: string }) => void;
  onOpenPhotoModal: (title: string, url: string) => void;
}

export function PhotoEvidenceGallery({
  photos,
  isAdmin,
  reuploadRequests,
  onRequestReupload,
  onOpenPhotoModal
}: PhotoEvidenceGalleryProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
        5. Mandatory Photographic Evidence ({photos.length} Captured)
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {photos.map((p: any, i: number) => {
          const pendingReq = reuploadRequests.find((r: any) => 
            (r.target_id === p.id || r.photo_title === p.title) && r.status === 'PENDING'
          );
          const resolvedReq = reuploadRequests.find((r: any) => 
            (r.target_id === p.id || r.photo_title === p.title) && r.status === 'RESOLVED'
          );

          return (
            <div 
              key={i} 
              className={`border rounded-lg p-2.5 flex flex-col justify-between transition ${
                pendingReq 
                  ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-300' 
                  : resolvedReq
                  ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-300'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-slate-800 truncate pr-1" title={p.title}>
                    {p.title}
                  </div>
                  {pendingReq ? (
                    <span className="shrink-0 text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Re-upload Req
                    </span>
                  ) : resolvedReq ? (
                    <span className="shrink-0 text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                      ✓ Replaced
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPhotoModal(p.title, p.photo_data)}
                  className="w-full relative group cursor-pointer"
                >
                  <img src={p.photo_data} alt={p.title} className="w-full h-28 object-cover rounded border border-slate-200 group-hover:opacity-90 transition" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 rounded text-xs text-white font-bold transition">
                    View
                  </span>
                </button>
              </div>

              <div className="mt-2 space-y-1.5">
                {pendingReq && (
                  <div className="bg-amber-100 border border-amber-300 rounded p-1 text-[10.5px] text-amber-950 text-left">
                    <div className="font-bold text-amber-800">⚠️ Re-upload Requested</div>
                    <div className="italic text-slate-700 line-clamp-2">&ldquo;{pendingReq.reason}&rdquo;</div>
                  </div>
                )}

                {resolvedReq && (
                  <div className="bg-indigo-100 border border-indigo-300 rounded p-1 text-[10.5px] text-indigo-950 text-left">
                    <div className="font-bold text-indigo-800">✨ Replacement Photo Uploaded</div>
                    <div className="text-slate-600">Dealer uploaded new photo. Review and approve.</div>
                  </div>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onRequestReupload({
                      targetId: p.id,
                      category: 'PHOTO',
                      title: p.title,
                      url: p.photo_data,
                      reason: pendingReq ? pendingReq.reason : ''
                    })}
                    className={`w-full py-1 px-1.5 rounded text-[10px] font-bold no-print flex items-center justify-center space-x-1 transition cursor-pointer ${
                      pendingReq 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : resolvedReq
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900'
                    }`}
                  >
                    <Camera className="w-3 h-3 text-current" />
                    <span>{pendingReq ? 'Edit Re-upload ✎' : resolvedReq ? 'Re-review / Request Again' : 'Request Re-upload'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import PhotoLightboxModal from '@/components/audit/PhotoLightboxModal';

export interface ReuploadAlertItem {
  request_id: string;
  audit_id: string;
  cms_code: string;
  category: string;
  photo_title: string;
  reason: string;
  replacement_photo_url: string;
  resolved_at: string;
  status: string;
  ro_name: string;
  grade: string;
  percentage: number;
}

interface ReuploadAlertsCardProps {
  alerts: ReuploadAlertItem[];
  onRefresh?: () => void;
}

export default function ReuploadAlertsCard({ alerts, onRefresh }: ReuploadAlertsCardProps) {
  const [activePhoto, setActivePhoto] = useState<{ title: string; url: string } | null>(null);

  if (!alerts || alerts.length === 0) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50 border-2 border-amber-400 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-extrabold text-amber-950 m-0">
                  Dealer Re-Uploaded Photos Awaiting Admin Sign-off
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  {alerts.length} Action{alerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Dealers have captured replacement evidence photos for requested audit revisions.
              </p>
            </div>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 px-2.5 py-1 rounded bg-amber-200/70 hover:bg-amber-200 transition self-start sm:self-auto cursor-pointer"
            >
              Refresh
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {alerts.map((item) => (
            <div
              key={item.request_id}
              className="bg-white rounded-xl border border-amber-300 p-3.5 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-900 truncate m-0">{item.ro_name}</h3>
                    <div className="text-[11px] text-slate-500 font-mono">CMS: {item.cms_code}</div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded uppercase shrink-0">
                    {item.category}
                  </span>
                </div>

                <div className="mt-2.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800">
                  <span className="font-bold text-amber-900">{item.photo_title}</span>
                  <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">&ldquo;{item.reason}&rdquo;</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {item.replacement_photo_url && (
                  <button
                    type="button"
                    onClick={() => setActivePhoto({ title: item.photo_title, url: item.replacement_photo_url })}
                    className="flex-1 py-1.5 px-2 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    View New Image
                  </button>
                )}
                <Link
                  href={`/audits/${item.audit_id}`}
                  className="py-1.5 px-3 bg-[#002855] hover:bg-[#003875] text-white text-xs font-bold rounded-lg transition inline-flex items-center space-x-1"
                >
                  <span>Review Audit</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activePhoto && (
        <PhotoLightboxModal
          title={activePhoto.title}
          imageUrl={activePhoto.url}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </>
  );
}

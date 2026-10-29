'use client';

import React from 'react';
import { Camera } from 'lucide-react';

interface TankCalibrationSectionProps {
  tanks: any[];
  isAdmin: boolean;
  isApproved?: boolean;
  reuploadRequests: any[];
  onRequestReupload: (modalData: { targetId: string; category: 'TANK'; title: string; url: string; reason: string }) => void;
  onOpenPhotoModal: (title: string, url: string) => void;
}

export function TankCalibrationSection({
  tanks,
  isAdmin,
  isApproved = false,
  reuploadRequests,
  onRequestReupload,
  onOpenPhotoModal
}: TankCalibrationSectionProps) {
  if (!tanks || tanks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
        3. Underground Tank Dip vs Automation Analysis
      </h2>
      <div className="overflow-x-auto border border-slate-200 rounded-lg -mx-1 sm:mx-0">
        <table className="w-full min-w-[500px] text-left text-xs md:text-sm">
          <thead className="bg-[#002855] text-white font-semibold">
            <tr>
              <th className="p-2.5 sm:p-3">Tank Name</th>
              <th className="p-2.5 sm:p-3">Capacity (KL)</th>
              <th className="p-2.5 sm:p-3">Manual Dip (mm)</th>
              <th className="p-2.5 sm:p-3">Auto Dip (mm)</th>
              <th className="p-2.5 sm:p-3">Delta (mm)</th>
              <th className="p-2.5 sm:p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tanks.map((t: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-2.5 sm:p-3 font-semibold">{t.product} - TANK-{t.tank_index}</td>
                <td className="p-2.5 sm:p-3">{t.capacity}</td>
                <td className="p-2.5 sm:p-3">{t.manual_dip}</td>
                <td className="p-2.5 sm:p-3">{t.auto_dip}</td>
                <td className="p-2.5 sm:p-3 font-bold">{t.delta}</td>
                <td className="p-2.5 sm:p-3">
                  {t.is_compliant ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">COMPLIANT</span>
                  ) : (
                    <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">NON-COMPLIANT</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
        {tanks.filter((t: any) => t.photo_data).map((t: any, i: number) => {
          const title = `${t.product} TANK-${t.tank_index} Dip Gauge Photo`;
          const pendingReq = reuploadRequests.find((r: any) => 
            (r.target_id === t.id || r.photo_title === title) && r.status === 'PENDING'
          );

          return (
            <div 
              key={i} 
              className={`border rounded-lg p-2.5 flex flex-col justify-between transition ${
                pendingReq 
                  ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-300' 
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-semibold text-slate-800 truncate pr-1">{t.product} - T-{t.tank_index}</div>
                  {pendingReq && (
                    <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                      Re-upload Req
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPhotoModal(title, t.photo_data)}
                  className="w-full relative group cursor-pointer"
                >
                  <img src={t.photo_data} alt="Tank Dip" className="w-full h-24 object-cover rounded border border-slate-200 group-hover:opacity-90 transition" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 rounded text-xs text-white font-bold transition">
                    View
                  </span>
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {pendingReq && (
                  <div className="bg-amber-100 border border-amber-300 rounded p-1 text-[10.5px] text-amber-950 text-left">
                    <div className="font-bold text-amber-800">⚠️ Re-upload Requested</div>
                    <div className="italic text-slate-700 line-clamp-2">&ldquo;{pendingReq.reason}&rdquo;</div>
                  </div>
                )}

                {isAdmin && !isApproved && (
                  <button
                    type="button"
                    onClick={() => onRequestReupload({
                      targetId: t.id,
                      category: 'TANK',
                      title,
                      url: t.photo_data,
                      reason: pendingReq ? pendingReq.reason : ''
                    })}
                    className={`w-full py-1 px-1.5 rounded text-[10px] font-bold no-print flex items-center justify-center space-x-1 transition cursor-pointer ${
                      pendingReq 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900'
                    }`}
                  >
                    <Camera className="w-3 h-3 text-current" />
                    <span>{pendingReq ? 'Edit Re-upload ✎' : 'Request Re-upload'}</span>
                  </button>
                )}

                {isApproved && (
                  <div className="w-full py-0.5 px-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center flex items-center justify-center space-x-1">
                    <span>✓ Verified &amp; Approved</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

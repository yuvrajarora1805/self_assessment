'use client';

import React, { useState } from 'react';
import { ShieldCheck, Camera, ZoomIn, RotateCcw, CheckCircle2, Calendar } from 'lucide-react';
import PhotoLightboxModal from './PhotoLightboxModal';

interface StatutoryProps {
  statutory: {
    cc_esd: string;
    cc_petro: string;
    cc_earthing: string;
    cc_earthing_date: string;
    cc_water: string;
    cc_water_date: string;
    cc_dssr: string;
    cc_fa: string;
    cc_peso: string;
    cc_fire: string;
    cc_fire_date: string;
    cc_wm: string;
    wm_du_count: number;
    wm_du_dates: Record<number, string>;
    wm_jar_date: string;
  };
  photos: Record<string, string>;
  onStatutoryChange: (field: string, value: any) => void;
  onPhotoUpload: (key: string, file: File) => void;
  gpsCoords?: string;
  gpsAddress?: string;
  viewOnly?: boolean;
}

export default function StatutorySection({
  statutory,
  photos,
  onStatutoryChange,
  onPhotoUpload,
  gpsCoords = '',
  gpsAddress = '',
  viewOnly = false
}: StatutoryProps) {
  const [activeModal, setActiveModal] = useState<{ title: string; url: string } | null>(null);

  const handleCapture = (key: string, e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          onPhotoUpload(key, file);
          return;
        }

        const maxW = 960;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark Banner
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        const bannerHeight = 65;
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        const now = new Date().toLocaleString('en-IN');
        ctx.fillText(`📍 GPS: ${gpsCoords || 'GPS NOT LOCKED'} | ⏰ ${now}`, 15, canvas.height - 40);

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#93c5fd';
        const addrText = (gpsAddress || 'Nayara Retail Station').substring(0, 110);
        ctx.fillText(`${label} • ${addrText}`, 15, canvas.height - 18);

        const watermarked = canvas.toDataURL('image/jpeg', 0.70);
        // Call synthetic upload or store directly via custom photo event
        fetch(watermarked)
          .then((res) => res.blob())
          .then((blob) => {
            const watermarkedFile = new File([blob], `${key}.jpg`, { type: 'image/jpeg' });
            onPhotoUpload(key, watermarkedFile);
          })
          .catch(() => onPhotoUpload(key, file));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const renderCertCard = (
    title: string,
    key: string,
    dateField: string,
    dateValue: string,
    onDateChange: (val: string) => void
  ) => {
    const photoUrl = photos[key];

    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800">{title} *</label>
          <div className="mt-1">
            <input
              type="date"
              value={dateValue || ''}
              disabled={viewOnly}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Certificate Photo / Capture Slot */}
        <div className="mt-1">
          {photoUrl ? (
            <div className="space-y-1.5">
              <div className="relative rounded-lg overflow-hidden border border-emerald-400 bg-slate-900 flex items-center justify-center">
                <img src={photoUrl} alt={title} className="w-full h-24 object-contain bg-black/40" />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveModal({ title, url: photoUrl })}
                  className={`py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition ${
                    viewOnly ? 'w-full' : 'flex-1 min-w-0'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Enlarge</span>
                </button>
                {!viewOnly && (
                  <label className="flex-1 min-w-0 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Retake</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleCapture(key, e, title)}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            !viewOnly && (
              <label className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer transition text-slate-600 hover:text-blue-600">
                <Camera className="w-4 h-4 mb-0.5 text-slate-400" />
                <span className="text-[11px] font-bold">Capture Certificate</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleCapture(key, e, title)}
                />
              </label>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h2 className="font-extrabold text-slate-900 text-base">
          3. Critical Statutory Compliances
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Provision of Min. 2 pts ESD */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Provision of Min. 2 pts of ESD *
          </label>
          <select
            value={statutory.cc_esd}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_esd', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="Yes">Yes (Compliant)</option>
            <option value="No">No (Non-Compliant)</option>
          </select>
        </div>

        {/* Petroleum Rules Abstract */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Abstract of Petroleum Rules, 2002 Displayed *
          </label>
          <select
            value={statutory.cc_petro}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_petro', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="Yes">Yes (Displayed)</option>
            <option value="No">No (Missing)</option>
          </select>
        </div>

        {/* DSSR Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            DSSR Register Status *
          </label>
          <select
            value={statutory.cc_dssr}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_dssr', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="NO OVERWRITING">NO OVERWRITING (Valid)</option>
            <option value="CORRECTED WITH ONLY CUT">CORRECTED WITH ONLY CUT</option>
            <option value="OVER WRITING">OVER WRITING (Flagged)</option>
          </select>
        </div>

        {/* Electrical Earthing Certificate Card */}
        {renderCertCard(
          'Electrical Earthing Certificate',
          'cert_earthing',
          'cc_earthing_date',
          statutory.cc_earthing_date,
          (val) => onStatutoryChange('cc_earthing_date', val)
        )}

        {/* Water Certificate Card */}
        {renderCertCard(
          'Valid Water Certificate',
          'cert_water',
          'cc_water_date',
          statutory.cc_water_date,
          (val) => onStatutoryChange('cc_water_date', val)
        )}

        {/* Fire Extinguisher Certificate Card */}
        {renderCertCard(
          'Fire Extinguisher Certificate',
          'cert_fire',
          'cc_fire_date',
          statutory.cc_fire_date,
          (val) => onStatutoryChange('cc_fire_date', val)
        )}

        {/* First Aid Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            First Aid Box Maintained *
          </label>
          <select
            value={statutory.cc_fa}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_fa', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="Yes">Yes (Available)</option>
            <option value="No">No (Unavailable)</option>
          </select>
        </div>

        {/* PESO Drawing Displayed */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            PESO Approved Drawing Displayed *
          </label>
          <select
            value={statutory.cc_peso}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_peso', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* W&M License */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            W&M DU License *
          </label>
          <select
            value={statutory.cc_wm}
            disabled={viewOnly}
            onChange={(e) => onStatutoryChange('cc_wm', e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-100"
          >
            <option value="Yes">Yes (Valid License Available)</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* 5 Ltr Jar Certificate Card */}
        {renderCertCard(
          '5 Ltr Jar Certificate',
          'cert_wm_jar',
          'wm_jar_date',
          statutory.wm_jar_date,
          (val) => onStatutoryChange('wm_jar_date', val)
        )}
      </div>

      {/* Lightbox Modal */}
      {activeModal && (
        <PhotoLightboxModal
          title={activeModal.title}
          imageUrl={activeModal.url}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

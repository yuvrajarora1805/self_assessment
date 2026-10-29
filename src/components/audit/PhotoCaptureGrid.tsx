'use client';

import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Plus, ZoomIn, RotateCcw } from 'lucide-react';
import { defaultPhotoRequirements, photoRequirementsDict } from '@/data/photo-requirements';
import PhotoLightboxModal from './PhotoLightboxModal';

interface PhotoGridProps {
  photos: Record<string, string>;
  customPhotoNames: Record<number, string>;
  selectedLanguage: string;
  gpsCoords: string;
  gpsAddress: string;
  onPhotoCapture: (key: string, base64: string) => void;
  onAddCustomSlot: () => void;
  onCustomNameChange: (slotIndex: number, name: string) => void;
  customSlotsCount: number;
  viewOnly?: boolean;
}

export default function PhotoCaptureGrid({
  photos,
  customPhotoNames,
  selectedLanguage,
  gpsCoords,
  gpsAddress,
  onPhotoCapture,
  onAddCustomSlot,
  onCustomNameChange,
  customSlotsCount,
  viewOnly = false
}: PhotoGridProps) {
  const [activeModal, setActiveModal] = useState<{ title: string; url: string } | null>(null);
  const langCode = selectedLanguage !== 'en' ? selectedLanguage.split('-')[1] : null;

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>, label: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

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
        onPhotoCapture(key, watermarked);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>2. Mandatory Photographic Evidence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Photos are dynamically watermarked with live GPS coordinates, date & time stamp.
          </p>
        </div>
        <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
          {Object.keys(photos).length} / {12 + customSlotsCount} Photos Captured
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {defaultPhotoRequirements.map((req) => {
          const photoData = photos[req.key];
          let translatedLabel = null;
          if (langCode && photoRequirementsDict[req.label]?.[langCode]) {
            translatedLabel = photoRequirementsDict[req.label][langCode];
          }

          return (
            <div
              key={req.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition ${
                photoData ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-800 leading-snug">
                  {req.label}
                </label>
                {translatedLabel && (
                  <span className="block text-[10px] text-blue-700 font-semibold mt-0.5">
                    ({translatedLabel})
                  </span>
                )}
              </div>

              <div className="mt-2.5">
                {photoData ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-emerald-400 bg-slate-900 flex items-center justify-center">
                      <img
                        src={photoData}
                        alt={req.label}
                        className="w-full h-32 object-contain bg-black/40"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveModal({ title: req.label, url: photoData })}
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
                            onChange={(e) => handleFileChange(req.key, e, req.label)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer transition text-slate-600 hover:text-blue-600">
                    <Camera className="w-5 h-5 mb-1 text-slate-400" />
                    <span className="text-[11px] font-bold">Capture Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(req.key, e, req.label)}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}

        {/* Custom Photo Slots */}
        {Array.from({ length: customSlotsCount }).map((_, idx) => {
          const slotIndex = 12 + idx;
          const key = `custom_${slotIndex}`;
          const photoData = photos[key];
          const name = customPhotoNames[slotIndex] || `Custom Photo ${idx + 1}`;

          return (
            <div
              key={key}
              className="rounded-xl border p-3 flex flex-col justify-between bg-purple-50/40 border-purple-200"
            >
              <input
                type="text"
                value={customPhotoNames[slotIndex] || ''}
                onChange={(e) => onCustomNameChange(slotIndex, e.target.value)}
                placeholder={`Custom Photo ${idx + 1}`}
                className="w-full text-xs font-bold text-purple-950 bg-white border border-purple-200 rounded px-2 py-1 mb-2"
              />

              <div className="mt-1">
                {photoData ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-purple-400 bg-slate-900 flex items-center justify-center">
                      <img src={photoData} alt={name} className="w-full h-32 object-contain bg-black/40" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveModal({ title: name, url: photoData })}
                        className={`py-1.5 px-2 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold rounded flex items-center justify-center gap-1 transition ${
                          viewOnly ? 'w-full' : 'flex-1 min-w-0'
                        }`}
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">Enlarge</span>
                      </button>
                      {!viewOnly && (
                        <label className="flex-1 min-w-0 py-1.5 px-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer">
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Retake</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleFileChange(key, e, name)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-3.5 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-lg bg-white flex flex-col items-center justify-center cursor-pointer transition text-purple-700">
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[11px] font-bold">Capture Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(key, e, name)}
                    />
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {customSlotsCount < 4 && (
        <button
          type="button"
          onClick={onAddCustomSlot}
          className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Add Custom Photo Slot (Max 16)</span>
        </button>
      )}

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

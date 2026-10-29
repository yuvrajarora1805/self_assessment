'use client';

import React from 'react';
import { Building2, Shield, Users, Phone, UserCheck, Calendar } from 'lucide-react';

interface OutletInfoProps {
  roName: string;
  cmsCode: string;
  brandType: 'NAYARA' | 'ESSAR' | '';
  hasCanopy: 'Yes' | 'No' | '';
  lastCraDate: string;
  tsmName: string;
  repName: string;
  repMobile: string;
  fsmTotal: number | '';
  fsmMale: number | '';
  fsmFemale: number | '';
  onChange: (field: string, value: any) => void;
}

export default function OutletInfoSection({
  roName,
  cmsCode,
  brandType,
  hasCanopy,
  lastCraDate,
  tsmName,
  repName,
  repMobile,
  fsmTotal,
  fsmMale,
  fsmFemale,
  onChange
}: OutletInfoProps) {
  // If male + female equals total, it's strictly valid.
  // Also treat as valid if Total is entered and Male + Female sums to Total (including 7 + 0 = 7)
  const totalNum = Number(fsmTotal) || 0;
  const maleNum = Number(fsmMale) || 0;
  const femaleNum = Number(fsmFemale) || 0;
  const fsmMathValid = (maleNum + femaleNum) === totalNum;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
        <Building2 className="w-5 h-5 text-blue-600" />
        <h2 className="font-extrabold text-slate-900 text-base">
          1. Outlet & Staffing Information
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Name of RO */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Name of RO *</label>
          <input
            type="text"
            value={roName}
            readOnly
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
          />
        </div>

        {/* CMS Code */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">CMS Code *</label>
          <input
            type="text"
            value={cmsCode}
            readOnly
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed"
          />
        </div>

        {/* Brand Type (Default: NAYARA or ESSAR, Editable) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Brand Type *</label>
          <select
            value={brandType}
            onChange={(e) => onChange('brandType', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="NAYARA">NAYARA</option>
            <option value="ESSAR">ESSAR</option>
          </select>
        </div>

        {/* Canopy Present (Default: Yes, Editable) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Canopy Present? *</label>
          <select
            value={hasCanopy}
            onChange={(e) => onChange('hasCanopy', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          >
            <option value="Yes">Yes (With Canopy)</option>
            <option value="No">No (Without Canopy)</option>
          </select>
        </div>

        {/* Last CRA Date */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Last CRA Date (By TSM) *</label>
          <input
            type="date"
            value={lastCraDate}
            onChange={(e) => onChange('lastCraDate', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* TSM Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">TSM Name *</label>
          <input
            type="text"
            value={tsmName}
            onChange={(e) => onChange('tsmName', e.target.value)}
            placeholder="Assigned TSM"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Representative Name (Pre-filled, Editable) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Franchisee Representative *</label>
          <input
            type="text"
            value={repName}
            onChange={(e) => onChange('repName', e.target.value)}
            placeholder="Representative Name"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Representative Mobile (Pre-filled, Editable) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Representative Mobile No. *</label>
          <input
            type="tel"
            maxLength={10}
            value={repMobile}
            onChange={(e) => onChange('repMobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            placeholder="10-digit Mobile"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* FSM Staffing Section */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-xs text-slate-900">
              FSM Staffing (Current Shift)
            </h3>
          </div>
          {!fsmMathValid && (
            <span className="text-[11px] font-bold text-rose-600">
              ⚠️ Male ({maleNum}) + Female ({femaleNum}) must equal Total ({totalNum})
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Shift FSMs *</label>
            <input
              type="number"
              min={0}
              value={fsmTotal}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChange('fsmTotal', val);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-center"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Male FSMs *</label>
            <input
              type="number"
              min={0}
              value={fsmMale}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChange('fsmMale', val);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-center"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Female FSMs *</label>
            <input
              type="number"
              min={0}
              value={fsmFemale}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                onChange('fsmFemale', val);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

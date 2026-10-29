'use client';

import React from 'react';
import { X } from 'lucide-react';

interface AddDealerModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddDealerModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit
}: AddDealerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="bg-[#002855] text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-sm bg-transparent p-0 m-0 text-white">Register New RO Dealer Outlet</h3>
          <button type="button" onClick={onClose} className="text-blue-100 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CMS Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. 10999"
                value={formData.cmsCode}
                onChange={e => setFormData({ ...formData, cmsCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RO Outlet Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. CITY EXPRESS FUELS"
                value={formData.roName}
                onChange={e => setFormData({ ...formData, roName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dealer Name *</label>
              <input
                type="text"
                required
                placeholder="Full name"
                value={formData.dealerName}
                onChange={e => setFormData({ ...formData, dealerName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dealer Mobile *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={formData.dealerMobile}
                onChange={e => setFormData({ ...formData, dealerMobile: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Zone *</label>
              <select
                value={formData.zone}
                onChange={e => setFormData({ ...formData, zone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50"
              >
                <option value="North">North Zone</option>
                <option value="West">West Zone</option>
                <option value="South">South Zone</option>
                <option value="East">East Zone</option>
                <option value="Central">Central Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sales Area *</label>
              <input
                type="text"
                required
                placeholder="e.g. Delhi NCR"
                value={formData.salesArea}
                onChange={e => setFormData({ ...formData, salesArea: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#002855] hover:bg-[#001e40] text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Create Outlet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

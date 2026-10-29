'use client';

import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface FixedTank {
  tank_index: number;
  product: 'MS' | 'HSD';
  capacity_kl: number;
}

interface DealerTanksTabProps {
  cmsCode: string;
  tanks: FixedTank[];
  onTanksUpdated?: (updated: FixedTank[]) => void;
}

export function DealerTanksTab({ cmsCode, tanks: initialTanks, onTanksUpdated }: DealerTanksTabProps) {
  const [tanks, setTanks] = useState<FixedTank[]>(initialTanks || []);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddTank = () => {
    const nextIndex = tanks.length > 0 ? Math.max(...tanks.map(t => t.tank_index)) + 1 : 1;
    setTanks([...tanks, { tank_index: nextIndex, product: 'MS', capacity_kl: 20 }]);
  };

  const handleRemoveTank = (idx: number) => {
    setTanks(tanks.filter((_, i) => i !== idx));
  };

  const handleUpdateTank = (idx: number, field: keyof FixedTank, value: any) => {
    const copy = [...tanks];
    copy[idx] = { ...copy[idx], [field]: value };
    setTanks(copy);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/dealer/fixed-tanks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmsCode, tanks })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditing(false);
        setMessage('✅ Tank master saved successfully!');
        if (onTanksUpdated) onTanksUpdated(data.tanks || tanks);
      } else {
        alert('Failed to save tanks: ' + data.error);
      }
    } catch (e: any) {
      alert('Error saving: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Fixed Tank Master Configuration
          </h4>
          <p className="text-[11px] text-slate-500">
            Pre-calibrated tanks for this outlet. Once approved, the monthly audit only requires entering manual &amp; auto dip (mm).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {message && <span className="text-xs text-emerald-700 font-bold">{message}</span>}
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-[#002855] text-white rounded-lg text-xs font-bold hover:bg-[#001e40] transition cursor-pointer"
            >
              Edit Tanks
            </button>
          ) : (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  setTanks(initialTanks || []);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#002855] text-white">
            <tr>
              <th className="p-2.5 w-24">Tank No.</th>
              <th className="p-2.5">Product Type</th>
              <th className="p-2.5">Safe Capacity (KL)</th>
              {isEditing && <th className="p-2.5 w-16 text-center">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tanks.length > 0 ? (
              tanks.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={t.tank_index}
                        onChange={(e) => handleUpdateTank(idx, 'tank_index', Number(e.target.value))}
                        className="w-16 p-1 border rounded text-xs"
                      />
                    ) : (
                      `TANK-${t.tank_index}`
                    )}
                  </td>
                  <td className="p-2.5">
                    {isEditing ? (
                      <select
                        value={t.product}
                        onChange={(e) => handleUpdateTank(idx, 'product', e.target.value)}
                        className="p-1 border rounded text-xs bg-white"
                      >
                        <option value="MS">Motor Spirit (MS)</option>
                        <option value="HSD">High Speed Diesel (HSD)</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${t.product === 'MS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.product === 'MS' ? 'Motor Spirit (MS)' : 'High Speed Diesel (HSD)'}
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-700">
                    {isEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          step="0.5"
                          min="5"
                          max="100"
                          value={t.capacity_kl}
                          onChange={(e) => handleUpdateTank(idx, 'capacity_kl', Number(e.target.value))}
                          className="w-20 p-1 border rounded text-xs"
                        />
                        <span>KL</span>
                      </div>
                    ) : (
                      `${t.capacity_kl} KL`
                    )}
                  </td>
                  {isEditing && (
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveTank(idx)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Remove tank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="p-4 text-center text-slate-400">
                  No tanks configured. Click &quot;Edit Tanks&quot; to configure.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <button
          type="button"
          onClick={handleAddTank}
          className="inline-flex items-center px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
          <span>Add Tank</span>
        </button>
      )}
    </div>
  );
}

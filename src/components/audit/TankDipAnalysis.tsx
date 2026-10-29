'use client';

import React from 'react';
import { Fuel, Camera, AlertCircle, CheckCircle2, Plus, Trash2, Settings2 } from 'lucide-react';
import { TankDipRecord } from '@/types/audit';

interface TankDipProps {
  tanks: TankDipRecord[];
  onDipChange: (tankId: string, field: 'manualDip' | 'autoDip', val: number | null) => void;
  onCapacityChange?: (tankId: string, capacityKl: number | '') => void;
  onProductChange?: (tankId: string, product: 'MS' | 'HSD') => void;
  onAddTank?: (product: 'MS' | 'HSD') => void;
  onRemoveTank?: (tankId: string) => void;
  onTankPhoto: (tankId: string, file: File) => void;
  viewOnly?: boolean;
}

export default function TankDipAnalysis({
  tanks,
  onDipChange,
  onCapacityChange,
  onProductChange,
  onAddTank,
  onRemoveTank,
  onTankPhoto,
  viewOnly = false
}: TankDipProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <Fuel className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="font-extrabold text-slate-900 text-base leading-tight">
              4. Underground Storage Tank (UST) Automation Dip vs Manual Dip
            </h2>
            <p className="text-xs text-slate-500">
              Tolerance threshold &plusmn;3.0 mm. Automatic flagging for delta calibration discrepancy.
            </p>
          </div>
        </div>

        {!viewOnly && onAddTank && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onAddTank('MS')}
              className="inline-flex items-center text-xs font-bold px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add MS Tank</span>
            </button>
            <button
              type="button"
              onClick={() => onAddTank('HSD')}
              className="inline-flex items-center text-xs font-bold px-2.5 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add HSD Tank</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tanks.map((tank) => {
          const delta =
            tank.manualDip !== null && tank.autoDip !== null
              ? Math.abs(Number((tank.autoDip - tank.manualDip).toFixed(1)))
              : null;
          const isCompliant = delta !== null ? delta <= 3.0 : null;

          return (
            <div
              key={tank.tankId}
              className={`rounded-2xl border p-4 space-y-3 relative ${
                tank.product === 'MS'
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-blue-50/30 border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!viewOnly && onProductChange ? (
                    <select
                      value={tank.product}
                      onChange={(e) => onProductChange(tank.tankId, e.target.value as 'MS' | 'HSD')}
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border cursor-pointer ${
                        tank.product === 'MS'
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-blue-100 border-blue-300 text-blue-900'
                      }`}
                    >
                      <option value="MS">MS (Petrol)</option>
                      <option value="HSD">HSD (Diesel)</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        tank.product === 'MS'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-blue-100 text-blue-900'
                      }`}
                    >
                      {tank.product}
                    </span>
                  )}

                  <span className="text-xs font-bold text-slate-800">
                    TANK-{tank.tankIndex}
                  </span>

                  {/* Editable Capacity in KL */}
                  <div className="flex items-center text-xs text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                    <span className="font-semibold mr-1">Cap:</span>
                    {!viewOnly && onCapacityChange ? (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={tank.capacityKl === '' ? '' : tank.capacityKl}
                        placeholder="30"
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          if (raw === '') {
                            onCapacityChange(tank.tankId, '');
                          } else {
                            const parsed = parseInt(raw, 10);
                            onCapacityChange(tank.tankId, isNaN(parsed) ? '' : parsed);
                          }
                        }}
                        onBlur={() => {
                          if (tank.capacityKl === '' || Number(tank.capacityKl) <= 0) {
                            onCapacityChange(tank.tankId, tank.product === 'MS' ? 30 : 40);
                          }
                        }}
                        className="w-12 text-center text-xs font-bold text-slate-900 bg-transparent border-b border-slate-400 focus:outline-none"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">{tank.capacityKl || 0}</span>
                    )}
                    <span className="font-bold text-slate-700 ml-0.5">KL</span>
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({(Number(tank.capacityKl) || 0) * 1000}L)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {delta !== null && (
                    <span
                      className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isCompliant
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCompliant ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-0.5" />
                          <span>Delta {delta}mm</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 mr-0.5" />
                          <span>Delta {delta}mm (&gt;3mm)</span>
                        </>
                      )}
                    </span>
                  )}

                  {!viewOnly && onRemoveTank && tanks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveTank(tank.tankId)}
                      title="Remove this tank"
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Manual Dip (mm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={viewOnly}
                    value={tank.manualDip ?? ''}
                    onChange={(e) =>
                      onDipChange(
                        tank.tankId,
                        'manualDip',
                        e.target.value === '' ? null : parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="e.g. 1420.5"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Automation Dip (mm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    disabled={viewOnly}
                    value={tank.autoDip ?? ''}
                    onChange={(e) =>
                      onDipChange(
                        tank.tankId,
                        'autoDip',
                        e.target.value === '' ? null : parseFloat(e.target.value) || 0
                      )
                    }
                    placeholder="e.g. 1421.2"
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Tank Automation Photo Proof */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Automation Screen Photo:</span>
                <label className={`font-bold text-blue-600 hover:text-blue-800 ${viewOnly ? 'pointer-events-none' : 'cursor-pointer'}`}>
                  {tank.photoData ? '✓ Photo Attached' : '📷 Capture Auto Dip'}
                  {!viewOnly && (
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onTankPhoto(tank.tankId, f);
                      }}
                    />
                  )}
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

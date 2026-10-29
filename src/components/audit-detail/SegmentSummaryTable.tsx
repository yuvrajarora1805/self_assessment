'use client';

import React from 'react';

interface SegmentSummaryTableProps {
  segmentSummary: Record<string, { max: number; earned: number }>;
  grandTotal: { max: number; total: number; percentage: number };
}

export function SegmentSummaryTable({ segmentSummary, grandTotal }: SegmentSummaryTableProps) {
  if (!segmentSummary || Object.keys(segmentSummary).length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
        Segment Summary Report
      </h2>
      <div className="overflow-x-auto border border-slate-200 rounded-lg -mx-1 sm:mx-0">
        <table className="w-full min-w-[440px] text-left text-xs md:text-sm">
          <thead className="bg-[#002855] text-white font-semibold">
            <tr>
              <th className="p-2.5 sm:p-3 w-12 sm:w-16">Sr No</th>
              <th className="p-2.5 sm:p-3">Category / Segment</th>
              <th className="p-2.5 sm:p-3 w-20 sm:w-28 text-center">Max Points</th>
              <th className="p-2.5 sm:p-3 w-20 sm:w-28 text-center">Achieved</th>
              <th className="p-2.5 sm:p-3 w-24 sm:w-32 text-center">Compliance %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Object.entries(segmentSummary).map(([seg, val], idx) => {
              const segPercent = val.max > 0 ? Math.round((val.earned / val.max) * 100) : 0;
              const percentColor = val.max === 0 ? 'text-slate-400' : segPercent === 100 ? 'text-emerald-700' : segPercent >= 80 ? 'text-amber-600' : 'text-rose-600';
              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 sm:p-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="p-2.5 sm:p-3 font-bold text-slate-800">{seg}</td>
                  <td className="p-2.5 sm:p-3 text-center text-slate-700">{val.max}</td>
                  <td className="p-2.5 sm:p-3 text-center font-bold text-slate-900">{val.earned}</td>
                  <td className={`p-2.5 sm:p-3 text-center font-black ${percentColor}`}>
                    {val.max === 0 ? 'N/A' : `${segPercent}%`}
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <td colSpan={2} className="p-2.5 sm:p-3 text-right uppercase text-slate-700">Grand Total</td>
              <td className="p-2.5 sm:p-3 text-center text-slate-800">{grandTotal.max}</td>
              <td className="p-2.5 sm:p-3 text-center text-slate-900">{grandTotal.total}</td>
              <td className="p-2.5 sm:p-3 text-center font-extrabold text-[#002855]">{grandTotal.percentage}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

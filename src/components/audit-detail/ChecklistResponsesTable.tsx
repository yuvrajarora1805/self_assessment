'use client';

import React from 'react';

interface ChecklistResponsesTableProps {
  responses: any[];
}

export function ChecklistResponsesTable({ responses }: ChecklistResponsesTableProps) {
  if (!responses || responses.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-[#002855] uppercase tracking-wider bg-transparent p-0 m-0 border-b border-slate-200 pb-2">
        4. Visual Checklist Detailed Responses ({responses.length} Items)
      </h2>
      <div className="overflow-x-auto max-h-[600px] border border-slate-200 rounded-lg -mx-1 sm:mx-0">
        <table className="w-full min-w-[500px] text-left text-xs md:text-sm">
          <thead className="bg-[#002855] text-white sticky top-0 font-semibold z-10">
            <tr>
              <th className="p-2.5 sm:p-3 w-10 sm:w-12">#</th>
              <th className="p-2.5 sm:p-3 w-28 sm:w-36">Segment</th>
              <th className="p-2.5 sm:p-3">Parameter Description</th>
              <th className="p-2.5 sm:p-3 w-20 sm:w-24">Recorded</th>
              <th className="p-2.5 sm:p-3 w-20 sm:w-24">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {responses.map((r: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-2.5 sm:p-3 text-slate-400 font-mono">{idx + 1}</td>
                <td className="p-2.5 sm:p-3 font-semibold text-slate-800">{r.segment}</td>
                <td className="p-2.5 sm:p-3 text-slate-700">{r.question_text}</td>
                <td className="p-2.5 sm:p-3 font-bold">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    r.response === 'Yes' ? 'bg-emerald-100 text-emerald-800' :
                    r.response === 'No' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {r.response}
                  </span>
                </td>
                <td className="p-2.5 sm:p-3 font-semibold text-slate-900">
                  {r.earned_score} / {r.response === 'NA' ? 0 : r.max_score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

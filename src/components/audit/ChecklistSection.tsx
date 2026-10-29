'use client';

import React from 'react';
import { ClipboardList, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { ChecklistQuestion } from '@/types/audit';

interface ChecklistProps {
  questions: ChecklistQuestion[];
  answers: Record<number, 'Yes' | 'No' | 'NA'>;
  hasCanopy: 'Yes' | 'No' | '';
  selectedLanguage: string;
  onAnswerChange: (questionId: number, value: 'Yes' | 'No' | 'NA') => void;
}

export default function ChecklistSection({
  questions,
  answers,
  hasCanopy,
  selectedLanguage,
  onAnswerChange
}: ChecklistProps) {
  const langCode = selectedLanguage !== 'en' ? selectedLanguage.split('-')[1] : null;

  // Filter out Canopy segment if outlet has no canopy
  const activeQuestions = questions.filter(
    (q) => !(hasCanopy === 'No' && q.segment.toUpperCase().includes('CANOPY'))
  );

  const answeredCount = Object.keys(answers).length;
  const totalCount = activeQuestions.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>5. Visual Assessment Checklist</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Answer all parameter items. Canopy items are conditionally managed.
          </p>
        </div>
        <div className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
          Answered: {answeredCount} / {totalCount}
        </div>
      </div>

      <div className="space-y-3">
        {activeQuestions.map((q, idx) => {
          const selected = answers[q.id];
          const translatedText = langCode && q.trans?.[langCode] ? q.trans[langCode] : null;

          return (
            <div
              key={q.id}
              id={`qc-${q.id}`}
              className={`p-3.5 rounded-xl border transition ${
                selected
                  ? 'bg-white border-slate-200'
                  : 'bg-amber-50/20 border-amber-200/70'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-2xl">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {q.segment}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">Score: {q.maxScore}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 leading-snug pt-1">
                    {idx + 1}. {q.text}
                  </p>
                  {translatedText && (
                    <p className="text-xs font-medium text-blue-700 leading-snug">
                      ({translatedText})
                    </p>
                  )}
                </div>

                {/* Radio Options */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAnswerChange(q.id, 'Yes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      selected === 'Yes'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>YES</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAnswerChange(q.id, 'No')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      selected === 'No'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>NO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAnswerChange(q.id, 'NA')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      selected === 'NA'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>N/A</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

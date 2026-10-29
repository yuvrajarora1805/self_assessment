'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Eye, Activity, ChevronDown, ChevronUp, FileText, CheckCircle, AlertCircle, ZoomIn, Trash2 } from 'lucide-react';
import PhotoLightboxModal from '@/components/audit/PhotoLightboxModal';

export interface ActiveDraftItem {
  cms_code: string;
  ro_name: string;
  progress_percent: number;
  draft_data?: string;
  updated_at: string;
}

interface ActiveDraftsCardProps {
  drafts: ActiveDraftItem[];
  onRefresh?: () => void;
}

export default function ActiveDraftsCard({ drafts, onRefresh }: ActiveDraftsCardProps) {
  const [expandedCms, setExpandedCms] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<{ title: string; url: string } | null>(null);
  const [discardingCms, setDiscardingCms] = useState<string | null>(null);

  const handleDiscardDraft = async (cmsCode: string) => {
    if (!confirm(`Discard inactive/stale draft for CMS ${cmsCode}?`)) return;
    setDiscardingCms(cmsCode);
    try {
      const res = await fetch(`/api/audits/draft?cmsCode=${encodeURIComponent(cmsCode)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success && onRefresh) {
        onRefresh();
      }
    } catch (e) {
      console.error('Failed to discard draft:', e);
    } finally {
      setDiscardingCms(null);
    }
  };

  if (!drafts || drafts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <h2 className="text-sm font-bold text-slate-900 m-0">Live Active Dealer Form Drafts</h2>
          </div>
          <span className="text-xs text-slate-400">0 active right now</span>
        </div>
        <p className="text-xs text-slate-400 py-3 text-center">
          No dealers are currently actively filling a draft form.
        </p>
      </div>
    );
  }

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.max(0, Math.floor(diffMs / 60000));
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} mins ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    } catch (e) {
      return dateStr;
    }
  };

  const parseDraftDetails = (draftDataRaw?: string) => {
    if (!draftDataRaw) return null;
    try {
      return typeof draftDataRaw === 'object' ? draftDataRaw : JSON.parse(draftDataRaw);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 border-t-4 border-t-indigo-600 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-sm font-bold text-slate-900 m-0">
            Live Dealer Filling in Progress ({drafts.length})
          </h2>
        </div>
        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" /> Auto-syncing live
        </span>
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => {
          const percent = Math.min(100, Math.max(0, draft.progress_percent || 0));
          const colorClass =
            percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-blue-500' : 'bg-amber-500';
          const isExpanded = expandedCms === draft.cms_code;
          const parsed = parseDraftDetails(draft.draft_data);
          const answeredCount = parsed?.answers ? Object.keys(parsed.answers).length : 0;
          const photosCount = parsed?.photos ? Object.keys(parsed.photos).length : 0;

          return (
            <div
              key={draft.cms_code}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-bold text-xs text-slate-900">{draft.ro_name || 'Retail Outlet'}</span>
                  <span className="text-[11px] text-slate-500 font-mono ml-2">CMS: {draft.cms_code}</span>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatTimeAgo(draft.updated_at)}
                  </span>
                  <button
                    onClick={() => setExpandedCms(isExpanded ? null : draft.cms_code)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide Draft Data' : 'Inspect Live Draft'}
                  </button>
                  <Link
                    href={`/audit-form?cmsCode=${encodeURIComponent(draft.cms_code)}&viewOnly=true`}
                    target="_blank"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded"
                  >
                    <Eye className="w-3 h-3" /> View Only Form
                  </Link>
                  <button
                    type="button"
                    disabled={discardingCms === draft.cms_code}
                    onClick={() => handleDiscardDraft(draft.cms_code)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50"
                    title="Discard inactive draft"
                  >
                    <Trash2 className="w-3 h-3" /> Discard
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Draft Progress: {answeredCount} Questions Answered • {photosCount} Photos Captured</span>
                  <span className="font-bold text-slate-800">{percent}% Completed</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Collapsible live-filling data inspector */}
              {isExpanded && (
                <div className="mt-2 pt-3 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded border border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-600" /> Representative & Staff
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>Name: <strong className="text-slate-800">{parsed?.repName || 'Not entered yet'}</strong></div>
                        <div>Mobile: <strong className="text-slate-800">{parsed?.repMobile || 'Not entered yet'}</strong></div>
                        <div>FSM Staff: <strong className="text-slate-800">{parsed?.fsmTotal || 4} ({parsed?.fsmMale || 3}M / {parsed?.fsmFemale || 1}F)</strong></div>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> Statutory & Tanks
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>Brand: <strong className="text-slate-800">{parsed?.brandType || 'NAYARA'}</strong></div>
                        <div>Canopy: <strong className="text-slate-800">{parsed?.hasCanopy || 'Yes'}</strong></div>
                        <div>Tanks Configured: <strong className="text-slate-800">{parsed?.tanks?.length || 4} tanks</strong></div>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-200">
                      <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" /> Verification Status
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>GPS Locked: <strong className="text-slate-800">{parsed?.gpsCoords ? 'Yes' : 'Pending'}</strong></div>
                        <div>Signature: <strong className="text-slate-800">{parsed?.signatureData ? 'Signed' : 'Pending'}</strong></div>
                        <div>Last sync: <strong className="text-slate-800">{formatTimeAgo(draft.updated_at)}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Live Captured Photos Preview */}
                  {parsed?.photos && Object.keys(parsed.photos).length > 0 && (
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <div className="font-semibold text-xs text-slate-800 mb-2 flex items-center gap-1">
                        <span>📸 Live Captured Photos ({Object.keys(parsed.photos).length}) — Click any photo to enlarge</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {Object.entries(parsed.photos).map(([key, b64]: [string, any]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActivePhoto({ title: `Photo Slot: ${key} (${draft.ro_name})`, url: b64 })}
                            className="border border-slate-200 rounded p-1 bg-slate-50 text-center hover:border-indigo-400 group relative block transition cursor-pointer"
                          >
                            <span className="text-[9px] font-mono text-slate-500 block truncate mb-1">Slot: {key}</span>
                            <div className="relative rounded overflow-hidden">
                              <img src={b64} alt={key} className="w-full h-16 object-cover rounded" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                                <ZoomIn className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Photo Lightbox Modal */}
      {activePhoto && (
        <PhotoLightboxModal
          title={activePhoto.title}
          imageUrl={activePhoto.url}
          onClose={() => setActivePhoto(null)}
        />
      )}
    </div>
  );
}

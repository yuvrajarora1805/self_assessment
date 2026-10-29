'use client';

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  History, 
  ShieldCheck, 
  Building2, 
  Image as ImageIcon, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock 
} from 'lucide-react';
import { DealerItem } from './DealerTable';
import { DealerTanksTab } from './DealerTanksTab';

interface DealerDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealer: DealerItem | null;
  detailTab: 'submissions' | 'documents' | 'profile';
  setDetailTab: (tab: 'submissions' | 'documents' | 'profile') => void;
  dealerSubmissions: any[];
  dealerProfileData: any;
  loadingDetails: boolean;
  onPreviewPhoto: (photo: { title: string; url: string }) => void;
  onTanksUpdated?: (tanks: any[]) => void;
}

export function DealerDrawerModal({
  isOpen,
  onClose,
  dealer,
  detailTab,
  setDetailTab,
  dealerSubmissions,
  dealerProfileData,
  loadingDetails,
  onPreviewPhoto,
  onTanksUpdated
}: DealerDrawerModalProps) {
  if (!isOpen || !dealer) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 bg-[#002855] text-white flex items-center justify-between shrink-0">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Franchisee RO Master Intelligence
            </div>
            <h3 className="text-lg font-extrabold text-white">{dealer.ro_name}</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              CMS: <span className="font-mono font-bold text-white">{dealer.cms_code}</span> | {dealer.zone} Zone | TSM: {dealer.tsm_name || 'Unassigned'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 shrink-0">
          <button
            type="button"
            onClick={() => setDetailTab('submissions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition cursor-pointer ${
              detailTab === 'submissions'
                ? 'border-[#002855] text-[#002855] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Monthly Submissions ({dealerSubmissions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setDetailTab('documents')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition cursor-pointer ${
              detailTab === 'documents'
                ? 'border-[#002855] text-[#002855] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approved Statutory Docs</span>
          </button>
          <button
            type="button"
            onClick={() => setDetailTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition cursor-pointer ${
              detailTab === 'profile'
                ? 'border-[#002855] text-[#002855] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Outlet Profile &amp; Tanks</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loadingDetails ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Fetching complete audit records and approved documentation...
            </div>
          ) : (
            <>
              {/* TAB 1: Submissions */}
              {detailTab === 'submissions' && (
                <div className="space-y-3">
                  {dealerSubmissions.length > 0 ? (
                    dealerSubmissions.map((sub: any) => (
                      <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-800">
                              {new Date(sub.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} Self-Assessment
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sub.approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                              sub.approval_status === 'REVISION_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                              sub.approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {sub.approval_status || 'PENDING'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Score: <strong className="text-slate-800">{sub.percentage}%</strong> ({sub.grade}) • Total {sub.total_score}/{sub.max_possible} Pts
                          </div>
                        </div>
                        <Link
                          href={`/audits/${sub.id}`}
                          className="px-3 py-1.5 bg-[#002855] text-white text-xs font-bold rounded-lg hover:bg-[#001e40] transition flex items-center space-x-1"
                        >
                          <span>View Report</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                      No self-assessment audits submitted by this dealer yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Documents */}
              {detailTab === 'documents' && (
                <div className="space-y-3">
                  {dealerProfileData?.certificates ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'earthing', name: '1. Earthing Test Certificate' },
                        { key: 'water', name: '2. Water Test Certificate' },
                        { key: 'fire', name: '3. Fire Extinguisher Test' },
                        { key: 'wm_jar', name: '4. W&M Conical Jar Stamp' }
                      ].map(({ key, name }) => {
                        const cert = dealerProfileData.certificates[key];
                        return (
                          <div key={key} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">{name}</span>
                              {cert?.isStillValid ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  Valid &amp; Approved
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                  Expired / Renewal Needed
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600">
                              Expiry Date: <strong>{cert?.date || 'Not Uploaded'}</strong>
                            </div>
                            {cert?.photo ? (
                              <button
                                type="button"
                                onClick={() => onPreviewPhoto({ title: name, url: cert.photo })}
                                className="inline-flex items-center text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
                              >
                                <ImageIcon className="w-3.5 h-3.5 mr-1" /> View Approved Photo
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">No document attached</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                      No approved documents on record yet.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Profile & Tanks */}
              {detailTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block">Dealer Name</span>
                      <strong className="text-slate-800">{dealer.dealer_name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Mobile Phone</span>
                      <strong className="text-slate-800">{dealer.dealer_mobile}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Brand Format</span>
                      <strong className="text-slate-800">{dealer.brand_type}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">GPS Coordinates</span>
                      <strong className="text-slate-800">{dealer.latitude}, {dealer.longitude}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Canopy Installed</span>
                      <strong className="text-slate-800">{dealer.has_canopy}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Sales Area</span>
                      <strong className="text-slate-800">{dealer.sales_area}</strong>
                    </div>
                  </div>

                  {/* Fixed Tank Master Configuration Component */}
                  <DealerTanksTab
                    cmsCode={dealer.cms_code}
                    tanks={dealerProfileData?.tanks || []}
                    onTanksUpdated={onTanksUpdated}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Nayara Energy RO Self-Assessment &amp; Compliance Hub
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

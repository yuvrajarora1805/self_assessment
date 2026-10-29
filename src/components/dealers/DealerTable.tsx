'use client';

import React from 'react';
import Link from 'next/link';
import {
  History,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Camera,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Settings
} from 'lucide-react';

export interface DealerItem {
  id: string;
  cms_code: string;
  ro_name: string;
  dealer_name: string;
  dealer_mobile: string;
  zone: string;
  sales_area: string;
  latitude: number;
  longitude: number;
  address: string;
  brand_type: string;
  has_canopy: string;
  tsm_name: string;
  latest_audit_id: string | null;
  total_score: number | null;
  percentage: number | null;
  grade: string | null;
  audit_date: string | null;
  approval_status?: string | null;
  pending_reuploads?: number;
  resolved_reuploads?: number;
  rep_mobile?: string | null;
  rep_name?: string | null;
  draft_progress?: number | null;
  draft_updated_at?: string | null;
}

interface DealerTableProps {
  dealers: DealerItem[];
  onOpenDetails: (dealer: DealerItem, tab: 'submissions' | 'documents' | 'profile') => void;
}

export function DealerTable({ dealers, onOpenDetails }: DealerTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#002855] text-white">
            <tr>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Submission Status</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Retail Outlet / CMS</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Territory &amp; Area</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Franchisee Contact</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Assigned TSM</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase">Assessment Rating</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-center">WhatsApp Alert</th>
              <th className="px-5 py-3 font-semibold text-xs tracking-wider uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dealers.map((d) => {
              const isAudited = Boolean(d.latest_audit_id);
              const isApproved = d.approval_status === 'APPROVED';
              const isPendingApproval = isAudited && !isApproved && d.approval_status !== 'REJECTED' && d.approval_status !== 'REVISION_REQUIRED';
              const isRejected = d.approval_status === 'REJECTED';
              const hasPendingReuploads = (d.pending_reuploads || 0) > 0;
              const hasResolvedReuploads = (d.resolved_reuploads || 0) > 0;

              // Effective phone resolution (dealer_mobile or rep_mobile)
              const rawPhone = (d.dealer_mobile && d.dealer_mobile !== 'Not Specified')
                ? d.dealer_mobile
                : (d.rep_mobile || '');
              const cleanDigits = rawPhone.replace(/\D/g, '');
              const effectivePhone = cleanDigits.length >= 10 ? cleanDigits : '';
              const waPhone = effectivePhone.length === 10 ? `91${effectivePhone}` : effectivePhone;

              // Build status-based prefilled WhatsApp text
              let waText = '';
              let waLabel = 'Send WA';
              let waBgClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
              let waTooltip = 'Send WhatsApp alert';

              if (hasPendingReuploads) {
                waText = `*Action Required: FuelAudit Photo Re-upload*\n\nDear Partner (${d.ro_name} / CMS: ${d.cms_code}),\n\nOperations HQ has requested replacement photo evidence for your monthly audit. Please open your portal and upload the clear images:\nhttps://self.yarora.dev/audit-form?cmsCode=${encodeURIComponent(d.cms_code)}`;
                waLabel = 'Request Re-upload';
                waBgClass = 'bg-amber-600 hover:bg-amber-700 text-white';
                waTooltip = 'Send photo re-upload reminder to dealer';
              } else if (isApproved) {
                waText = `*Congratulations! Monthly Audit Certified*\n\nDear Partner (${d.ro_name} / CMS: ${d.cms_code}),\n\nYour monthly self-assessment has been reviewed and *APPROVED* by Operations HQ with score ${d.percentage}% (Grade: ${d.grade}).\n\nView certified report: https://self.yarora.dev/audits/${d.latest_audit_id}`;
                waLabel = 'Send Cert Link';
                waBgClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                waTooltip = 'Send approval & report certificate link';
              } else if (isPendingApproval) {
                waText = `*Audit Received & In Review*\n\nDear Partner (${d.ro_name} / CMS: ${d.cms_code}),\n\nYour monthly self-assessment submission has been received and is currently under review by Operations HQ. Score: ${d.percentage}%.`;
                waLabel = 'Send Review Update';
                waBgClass = 'bg-blue-600 hover:bg-blue-700 text-white';
                waTooltip = 'Send submission acknowledgement';
              } else {
                waText = `*Reminder: Monthly Self-Assessment Pending*\n\nDear Partner (${d.ro_name} / CMS: ${d.cms_code}),\n\nYour monthly retail outlet self-assessment audit is currently pending submission. Please complete your checklist and tank dip measurements:\nhttps://self.yarora.dev/audit-form?cmsCode=${encodeURIComponent(d.cms_code)}`;
                waLabel = 'Send Audit Link';
                waBgClass = 'bg-[#25D366] hover:bg-[#1ebc59] text-white';
                waTooltip = 'Send audit form link to dealer';
              }

              const waLink = waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}` : null;

              return (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    {isApproved ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Approved &amp; Certified
                      </span>
                    ) : hasPendingReuploads ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Camera className="w-3.5 h-3.5 mr-1 text-amber-700 animate-pulse" />
                        Re-upload Pending
                      </span>
                    ) : hasResolvedReuploads ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
                        <Camera className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Re-upload Done
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                        Revision Required
                      </span>
                    ) : isPendingApproval ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Awaiting Approval
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                        <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span>
                        Pending Dealer Entry
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(d, 'submissions')}
                      className="text-left group cursor-pointer"
                    >
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center">
                        {d.ro_name}
                        <History className="w-3.5 h-3.5 ml-1.5 opacity-0 group-hover:opacity-100 text-blue-500 transition" />
                      </div>
                      <div className="font-mono text-xs text-blue-700 font-semibold flex items-center">
                        CMS: {d.cms_code}
                      </div>
                    </button>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-800">{d.zone} Zone</div>
                    <div className="text-xs text-slate-500">{d.sales_area}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{d.rep_name || d.dealer_name}</div>
                    <div className="text-xs text-slate-500 flex items-center mt-0.5">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {effectivePhone || <span className="text-slate-400 italic">Not Specified</span>}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs font-medium text-slate-700">
                    {d.tsm_name || 'Unassigned'}
                  </td>

                  <td className="px-5 py-4">
                    {isAudited ? (
                      <div>
                        <span className="font-bold text-slate-900">{d.percentage}%</span>
                        <span className="text-xs text-slate-500 ml-1.5">({d.grade})</span>
                        <div className="text-[11px] text-slate-400">
                          {new Date(d.audit_date!).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Awaiting Submission</span>
                    )}
                  </td>

                  {/* WhatsApp Pre-filled Notification Action */}
                  <td className="px-5 py-4 text-center whitespace-nowrap">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${waBgClass}`}
                        title={waTooltip}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        <span>{waLabel}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const manualNum = window.prompt(`Enter WhatsApp Mobile Number for ${d.ro_name} (CMS: ${d.cms_code}):`);
                          if (manualNum && manualNum.trim()) {
                            const cleaned = manualNum.replace(/\D/g, '');
                            const finalNumber = cleaned.length === 10 ? `91${cleaned}` : cleaned;
                            const url = `https://wa.me/${finalNumber}?text=${encodeURIComponent(waText)}`;
                            window.open(url, '_blank');
                          }
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-medium transition cursor-pointer"
                        title="No mobile saved on file — click to enter number and send"
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>Send WhatsApp</span>
                      </button>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/dealers/${encodeURIComponent(d.cms_code)}`}
                      className="inline-flex items-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                      title="View & Edit Dealership Master Details"
                    >
                      <Settings className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Edit RO
                    </Link>

                    {isAudited ? (
                      <Link
                        href={`/audits/${d.latest_audit_id}`}
                        className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg transition shadow-xs ${isApproved ? 'bg-[#002855] hover:bg-[#001e40] text-white' :
                            hasResolvedReuploads ? 'bg-indigo-600 hover:bg-indigo-700 text-white' :
                              hasPendingReuploads || isPendingApproval ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                                'bg-rose-600 hover:bg-rose-700 text-white'
                          }`}
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    ) : (
                      <Link
                        href={`/audit-form?cmsCode=${encodeURIComponent(d.cms_code)}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-lg transition"
                      >
                        Enter Audit
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

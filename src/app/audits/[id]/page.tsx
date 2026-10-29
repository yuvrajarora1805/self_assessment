'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { X } from 'lucide-react';
import { exportAuditToExcel } from '@/components/audit-detail/audit-excel-export';
import { AuditDetailNavbar } from '@/components/audit-detail/AuditDetailNavbar';
import { AuditHeaderBanner } from '@/components/audit-detail/AuditHeaderBanner';
import { AuditMetadataSection } from '@/components/audit-detail/AuditMetadataSection';
import { SegmentSummaryTable } from '@/components/audit-detail/SegmentSummaryTable';
import { StatutoryComplianceTable } from '@/components/audit-detail/StatutoryComplianceTable';
import { TankCalibrationSection } from '@/components/audit-detail/TankCalibrationSection';
import { ChecklistResponsesTable } from '@/components/audit-detail/ChecklistResponsesTable';
import { PhotoEvidenceGallery } from '@/components/audit-detail/PhotoEvidenceGallery';
import { ReuploadModal } from '@/components/audit-detail/ReuploadModal';

function AuditReportContent() {
  const params = useParams();
  const id = params?.id as string;
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const isAdmin = userLoaded && (currentUser?.role === 'ADMIN' || currentUser?.role === 'TSM' || currentUser?.role === 'AUDITOR');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [confirmIncrement, setConfirmIncrement] = useState(true);
  const [statReuseApprovals, setStatReuseApprovals] = useState<Record<string, boolean>>({});
  const [approvalMessage, setApprovalMessage] = useState('');
  const [reuploadRequests, setReuploadRequests] = useState<any[]>([]);
  const [reuploadModal, setReuploadModal] = useState<{
    targetId: string;
    category: 'STATUTORY' | 'PHOTO' | 'TANK';
    title: string;
    url: string;
    reason: string;
  } | null>(null);
  const [reuploadSubmitting, setReuploadSubmitting] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<{ title: string; url: string } | null>(null);

  const handleRequestReupload = async (reasonText: string) => {
    if (!reuploadModal || !reasonText.trim()) {
      alert('Please state a reason for requesting re-upload.');
      return;
    }
    setReuploadSubmitting(true);
    try {
      const res = await fetch(`/api/audits/${id}/reupload-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: reuploadModal.category,
          targetId: reuploadModal.targetId,
          photoTitle: reuploadModal.title,
          currentPhotoUrl: reuploadModal.url,
          reason: reasonText
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Re-upload requested from dealer for "${reuploadModal.title}".`);
        const newReq = {
          id: data.requestId || 'REQ_' + Date.now(),
          audit_id: id,
          target_id: reuploadModal.targetId,
          category: reuploadModal.category,
          photo_title: reuploadModal.title,
          current_photo_url: reuploadModal.url,
          reason: reasonText,
          status: 'PENDING',
          requested_at: new Date().toISOString()
        };
        setReuploadRequests(prev => [newReq, ...prev.filter(r => r.target_id !== reuploadModal.targetId)]);
        setReuploadModal(null);
        setAudit((prev: any) => ({ ...prev, approval_status: 'REVISION_REQUIRED' }));
      } else {
        alert('Failed to request re-upload: ' + data.error);
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setReuploadSubmitting(false);
    }
  };

  const handleApprovalAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    if (!id) return;
    setApprovalLoading(true);
    setApprovalMessage('');
    try {
      const res = await fetch(`/api/audits/${id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          remarks: adminRemarks,
          incrementConfirmed: confirmIncrement,
          approvedBy: 'Operations HQ',
          statutoryDocApprovals: statReuseApprovals
        })
      });
      const data = await res.json();
      if (data.success) {
        setAudit((prev: any) => ({
          ...prev,
          approval_status: data.approvalStatus,
          increment_confirmed: data.incrementConfirmed ? 1 : 0,
          approved_by: data.approvedBy,
          approved_at: data.approvedAt,
          admin_remarks: data.remarks
        }));
        setApprovalMessage(action === 'APPROVE' ? '✅ Assessment approved and monthly increment confirmed!' : '⚠️ Assessment status updated.');
      } else {
        alert('Error updating approval: ' + data.error);
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const rawUser = localStorage.getItem('fuel_user');
        if (rawUser) setCurrentUser(JSON.parse(rawUser));
      } catch (e) {}
      try {
        const r = await fetch('/api/auth/me');
        const d = await r.json();
        if (d.authenticated && d.user) setCurrentUser(d.user);
      } catch (err) {
        console.error('Failed to verify user session:', err);
      } finally {
        setUserLoaded(true);
      }
    };
    loadUser();

    if (!id) return;
    fetch(`/api/audits/${id}`)
      .then(async res => {
        if (!res.ok) return { success: false, error: 'Failed to fetch audit' };
        return res.json();
      })
      .then(data => {
        if (data.success) {
          setAudit(data.audit);
          if (Array.isArray(data.audit.reupload_requests)) setReuploadRequests(data.audit.reupload_requests);
          if (data.audit.admin_remarks) setAdminRemarks(data.audit.admin_remarks);
          if (data.audit.increment_confirmed !== undefined) setConfirmIncrement(data.audit.increment_confirmed === 1);
          if (Array.isArray(data.audit.statutory)) {
            const initialMap: Record<string, boolean> = {};
            data.audit.statutory.forEach((s: any) => {
              if (s.date_val && s.photo_data) initialMap[s.id] = s.is_approved_for_reuse !== 0;
            });
            setStatReuseApprovals(initialMap);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !userLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading complete audit record...</div>;
  }

  if (!audit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-4">
        <h2 className="text-xl font-bold">Report Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested audit ID does not exist in the database.</p>
        <Link href="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      <AuditDetailNavbar isAdmin={isAdmin} onExportExcel={() => exportAuditToExcel(audit)} />

      <div className="max-w-5xl mx-auto px-2 sm:px-4 mt-3 sm:mt-6">
        <div className="bg-white shadow-xl rounded-xl border border-slate-200 p-3.5 sm:p-6 md:p-10 space-y-6 sm:space-y-8 overflow-hidden">
          <AuditHeaderBanner
            audit={audit}
            isAdmin={isAdmin}
            reuploadRequests={reuploadRequests}
            adminRemarks={adminRemarks}
            setAdminRemarks={setAdminRemarks}
            confirmIncrement={confirmIncrement}
            setConfirmIncrement={setConfirmIncrement}
            approvalLoading={approvalLoading}
            approvalMessage={approvalMessage}
            onApprovalAction={handleApprovalAction}
          />

          <AuditMetadataSection audit={audit} />

          <SegmentSummaryTable
            segmentSummary={audit.segment_summary}
            grandTotal={{ max: audit.max_possible, total: audit.total_score, percentage: audit.percentage }}
          />

          <StatutoryComplianceTable
            statutory={audit.statutory}
            isAdmin={isAdmin}
            statReuseApprovals={statReuseApprovals}
            setStatReuseApprovals={setStatReuseApprovals}
            reuploadRequests={reuploadRequests}
            onRequestReupload={(data) => setReuploadModal(data)}
            onOpenPhotoModal={(title, url) => setActivePhotoModal({ title, url })}
          />

          <TankCalibrationSection
            tanks={audit.tanks}
            isAdmin={isAdmin}
            isApproved={audit.approval_status === 'APPROVED'}
            reuploadRequests={reuploadRequests}
            onRequestReupload={(data) => setReuploadModal(data)}
            onOpenPhotoModal={(title, url) => setActivePhotoModal({ title, url })}
          />

          <ChecklistResponsesTable responses={audit.responses} />

          <PhotoEvidenceGallery
            photos={audit.photos}
            isAdmin={isAdmin}
            isApproved={audit.approval_status === 'APPROVED'}
            reuploadRequests={reuploadRequests}
            onRequestReupload={(data) => setReuploadModal(data)}
            onOpenPhotoModal={(title, url) => setActivePhotoModal({ title, url })}
          />
        </div>
      </div>

      {/* Full Resolution Photo Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm truncate">{activePhotoModal.title}</h3>
              <button 
                type="button"
                onClick={() => setActivePhotoModal(null)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center max-h-[75vh] overflow-hidden bg-slate-900 rounded-lg">
              <img src={activePhotoModal.url} alt={activePhotoModal.title} className="max-h-[75vh] max-w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Re-upload Request Modal */}
      {reuploadModal && (
        <ReuploadModal
          modalData={reuploadModal}
          submitting={reuploadSubmitting}
          onClose={() => setReuploadModal(null)}
          onSubmit={handleRequestReupload}
        />
      )}
    </div>
  );
}

export default function AuditReportDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading audit report...</div>}>
      <AuditReportContent />
    </Suspense>
  );
}

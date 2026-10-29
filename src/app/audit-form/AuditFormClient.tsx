'use client';

import React, { useState, useEffect } from 'react';
import AuditHeader from '@/components/audit/AuditHeader';
import GpsVerificationBox from '@/components/audit/GpsVerificationBox';
import OutletInfoSection from '@/components/audit/OutletInfoSection';
import PhotoCaptureGrid from '@/components/audit/PhotoCaptureGrid';
import StatutorySection from '@/components/audit/StatutorySection';
import TankDipAnalysis from '@/components/audit/TankDipAnalysis';
import ChecklistSection from '@/components/audit/ChecklistSection';
import SignaturePadModal from '@/components/audit/SignaturePadModal';
import DraftStatusBar from '@/components/audit/DraftStatusBar';
import CompletedAuditView from '@/components/audit/CompletedAuditView';
import ReuploadPreviewModal from '@/components/audit/ReuploadPreviewModal';
import ReuploadSection, { PendingReuploadItem } from '@/components/audit/ReuploadSection';

import { AuditFormData } from '@/types/audit';
import { auditQuestions } from '@/data/audit-questions';
import { buildAuditSubmissionPayload } from '@/lib/audit-submission';
import { saveLocalDraft, watermarkAndCompressImage } from '@/lib/audit-helpers';
import { fetchInitialAuditData, mergeProfileAndDraft } from '@/lib/audit-loader';

interface AuditClientProps {
  initialCmsCode?: string;
  initialRoName?: string;
  initialBrand?: string;
  initialCanopy?: string;
  initialTsm?: string;
  viewOnly?: boolean;
  forceNew?: boolean;
}

export default function AuditFormClient({
  initialCmsCode = '',
  initialRoName = '',
  initialBrand = 'NAYARA',
  initialCanopy = 'Yes',
  initialTsm = '',
  viewOnly = false,
  forceNew = false
}: AuditClientProps) {
  const [formData, setFormData] = useState<AuditFormData>({
    roName: initialRoName,
    cmsCode: initialCmsCode,
    brandType: (initialBrand.toUpperCase().includes('ESSAR') ? 'ESSAR' : 'NAYARA') as any,
    hasCanopy: (initialCanopy || 'Yes') as any,
    lastCraDate: new Date().toISOString().split('T')[0],
    tsmName: initialTsm,
    repName: '',
    repMobile: '',
    fsmTotal: 4,
    fsmMale: 3,
    fsmFemale: 1,
    assessmentLanguage: 'en',
    gpsCoords: '',
    gpsAddress: '',
    gpsAccuracy: null,
    answers: {},
    photos: {},
    customPhotoNames: {},
    statutory: {
      cc_esd: 'Yes',
      cc_petro: 'Yes',
      cc_earthing: 'Yes',
      cc_earthing_date: '2027-04-15',
      cc_water: 'Yes',
      cc_water_date: '2026-12-31',
      cc_dssr: 'NO OVERWRITING',
      cc_fa: 'Yes',
      cc_peso: 'Yes',
      cc_fire: 'Yes',
      cc_fire_date: '2027-01-15',
      cc_wm: 'Yes',
      wm_du_count: 2,
      wm_du_dates: { 1: '2027-03-31', 2: '2027-03-31' },
      wm_jar_date: '2027-03-31'
    },
    tanks: [
      { tankId: 'MS_1', product: 'MS', tankIndex: 1, capacityKl: 20, manualDip: 1420, autoDip: 1420.5, delta: 0.5, isCompliant: true },
      { tankId: 'MS_2', product: 'MS', tankIndex: 2, capacityKl: 20, manualDip: 1380, autoDip: 1381.0, delta: 1.0, isCompliant: true },
      { tankId: 'HSD_1', product: 'HSD', tankIndex: 1, capacityKl: 20, manualDip: 1510, autoDip: 1511.2, delta: 1.2, isCompliant: true },
      { tankId: 'HSD_2', product: 'HSD', tankIndex: 2, capacityKl: 20, manualDip: 1495, autoDip: 1495.8, delta: 0.8, isCompliant: true }
    ],
    signatureData: ''
  });

  const [customSlotsCount, setCustomSlotsCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [completedAudit, setCompletedAudit] = useState<any | null>(null);
  const [pendingReuploads, setPendingReuploads] = useState<PendingReuploadItem[]>([]);
  const [activeUploadModal, setActiveUploadModal] = useState<PendingReuploadItem | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    fetchInitialAuditData(initialCmsCode)
      .then((res) => {
        if (!res || isCancelled) return;
        if (!forceNew && res.completedAudit) setCompletedAudit(res.completedAudit);
        if (res.pendingReuploads) setPendingReuploads(res.pendingReuploads);
        if (!forceNew && res.draftTime) setLastSaved(res.draftTime);
        setFormData((prev) => mergeProfileAndDraft(prev, res));
        setDraftRestored(true);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => { isCancelled = true; };
  }, [initialCmsCode, forceNew]);

  useEffect(() => {
    if (viewOnly || !formData.cmsCode || !draftRestored || completedAudit) return;
    const timer = setTimeout(() => {
      saveLocalDraft(formData.cmsCode, formData);
      setLastSaved(new Date().toLocaleTimeString());
      fetch('/api/audits/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmsCode: formData.cmsCode,
          roName: formData.roName,
          progressPercent: calculateProgress(),
          data: formData
        })
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData]);

  const updateField = (field: string, val: any) => setFormData((prev) => ({ ...prev, [field]: val }));

  const calculateProgress = () => {
    const totalQ = auditQuestions.length;
    const answeredQ = Object.keys(formData.answers).length;
    const photosCount = Object.keys(formData.photos).length;
    const hasSig = formData.signatureData ? 1 : 0;
    return Math.min(100, Math.round((answeredQ / totalQ) * 60 + (photosCount / 12) * 30 + hasSig * 10));
  };

  const handleReplacementCapture = async (reqItem: PendingReuploadItem, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const watermarked = await watermarkAndCompressImage(
        file,
        reqItem.photo_title,
        formData.gpsCoords,
        formData.gpsAddress || formData.roName
      );

      const res = await fetch(`/api/audits/${reqItem.audit_id}/resubmit-photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: reqItem.id,
          targetId: reqItem.target_id,
          category: reqItem.category,
          newPhotoData: watermarked
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Replacement photo for "${reqItem.photo_title}" uploaded successfully!`);
        setPendingReuploads((prev) => prev.filter((p) => p.id !== reqItem.id));
        setActiveUploadModal(null);
      } else {
        alert('Upload failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error processing photo: ' + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.repName) return alert('Please provide Franchisee Representative Name.');
    if (!formData.repMobile || formData.repMobile.length < 10) return alert('Please provide 10-digit Representative Mobile.');
    if (Number(formData.fsmMale) + Number(formData.fsmFemale) !== Number(formData.fsmTotal)) {
      return alert(`Staffing Math Error: Male (${formData.fsmMale}) + Female (${formData.fsmFemale}) must equal Total (${formData.fsmTotal}).`);
    }

    for (const q of auditQuestions) {
      if (formData.hasCanopy === 'No' && q.segment.toUpperCase().includes('CANOPY')) continue;
      if (!formData.answers[q.id]) {
        const el = document.getElementById(`qc-${q.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return alert(`Mandatory Question Unanswered: [${q.segment}] ${q.text}`);
      }
    }

    if (!formData.signatureData) {
      const sigEl = document.getElementById('signature-container');
      if (sigEl) sigEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return alert('Please provide your signature before generating the report.');
    }

    setSubmitting(true);
    try {
      const finalPayload = buildAuditSubmissionPayload(formData);
      const res = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });
      const data = await res.json();
      if (data.success) {
        try { localStorage.removeItem(`draft_${formData.cmsCode}`); } catch (e) {}
        alert('✅ Assessment submitted successfully! Redirecting to report...');
        window.location.replace(`/audits/${data.auditId}`);
      } else {
        alert('Submission failed: ' + (data.error || 'Server error'));
        setSubmitting(false);
      }
    } catch (err: any) {
      alert('Submission error: ' + err.message);
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of your session?')) {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
      try {
        localStorage.removeItem('fuel_user');
        localStorage.removeItem('session_token');
        document.cookie = 'session_token=; path=/; max-age=0;';
        document.cookie = 'fuel_role=; path=/; max-age=0;';
        document.cookie = 'fuel_user=; path=/; max-age=0;';
      } catch (e) {}
      window.location.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-32">
      <AuditHeader
        roName={formData.roName}
        cmsCode={formData.cmsCode}
        selectedLanguage={formData.assessmentLanguage}
        onLanguageChange={(lang) => updateField('assessmentLanguage', lang)}
        onLogout={handleLogout}
      />

      {mounted && viewOnly && (
        <div className="sticky top-16 z-40 bg-amber-500 text-slate-900 font-bold px-4 py-2.5 text-center text-xs shadow-md">
          <span>👁️ ADMIN VIEW-ONLY MODE: Inspecting dealer draft progress in real-time. Form editing is disabled.</span>
        </div>
      )}

      {isLoading ? (
        <div className="max-w-md mx-auto my-20 p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Verifying Assessment Status</h3>
          <p className="text-xs text-slate-500">Checking for submitted audits and photo re-upload requests...</p>
        </div>
      ) : !viewOnly && completedAudit ? (
        <CompletedAuditView
          completedAudit={completedAudit}
          pendingReuploads={pendingReuploads}
          uploadingPhoto={uploadingPhoto}
          onReplacementCapture={handleReplacementCapture}
          onViewOriginal={setActiveUploadModal}
        />
      ) : (
        <main className={`max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 sm:space-y-6 ${mounted && viewOnly ? 'pointer-events-none opacity-90' : ''}`}>
          {pendingReuploads.length > 0 && (
            <ReuploadSection
              pendingReuploads={pendingReuploads}
              uploadingPhoto={uploadingPhoto}
              onReplacementCapture={handleReplacementCapture}
              onViewOriginal={setActiveUploadModal}
            />
          )}

          <GpsVerificationBox
            gpsCoords={formData.gpsCoords}
            gpsAddress={formData.gpsAddress}
            gpsAccuracy={formData.gpsAccuracy}
            onGpsUpdate={(coords, addr, acc) =>
              setFormData((prev) => ({ ...prev, gpsCoords: coords, gpsAddress: addr, gpsAccuracy: acc }))
            }
          />

          <OutletInfoSection
            roName={formData.roName}
            cmsCode={formData.cmsCode}
            brandType={formData.brandType}
            hasCanopy={formData.hasCanopy}
            lastCraDate={formData.lastCraDate}
            tsmName={formData.tsmName}
            repName={formData.repName}
            repMobile={formData.repMobile}
            fsmTotal={formData.fsmTotal}
            fsmMale={formData.fsmMale}
            fsmFemale={formData.fsmFemale}
            onChange={updateField}
          />

          <PhotoCaptureGrid
            photos={formData.photos}
            customPhotoNames={formData.customPhotoNames}
            selectedLanguage={formData.assessmentLanguage}
            gpsCoords={formData.gpsCoords}
            gpsAddress={formData.gpsAddress}
            onPhotoCapture={(key, b64) =>
              setFormData((prev) => ({ ...prev, photos: { ...prev.photos, [key]: b64 } }))
            }
            onAddCustomSlot={() => setCustomSlotsCount((prev) => Math.min(4, prev + 1))}
            onCustomNameChange={(slot, name) =>
              setFormData((prev) => ({
                ...prev,
                customPhotoNames: { ...prev.customPhotoNames, [slot]: name }
              }))
            }
            customSlotsCount={customSlotsCount}
            viewOnly={viewOnly}
          />

          <StatutorySection
            statutory={formData.statutory}
            photos={formData.photos}
            onStatutoryChange={(f, v) =>
              setFormData((prev) => ({ ...prev, statutory: { ...prev.statutory, [f]: v } }))
            }
            onPhotoUpload={(key, file) => {
              const r = new FileReader();
              r.onload = () =>
                setFormData((prev) => ({
                  ...prev,
                  photos: { ...prev.photos, [key]: r.result as string }
                }));
              r.readAsDataURL(file);
            }}
            gpsCoords={formData.gpsCoords}
            gpsAddress={formData.gpsAddress}
            viewOnly={viewOnly}
          />

          <TankDipAnalysis
            tanks={formData.tanks}
            onDipChange={(tId, field, val) =>
              setFormData((prev) => ({
                ...prev,
                tanks: prev.tanks.map((t) => (t.tankId === tId ? { ...t, [field]: val } : t))
              }))
            }
            onCapacityChange={(tId, capacityKl) =>
              setFormData((prev) => ({
                ...prev,
                tanks: prev.tanks.map((t) => (t.tankId === tId ? { ...t, capacityKl } : t))
              }))
            }
            onProductChange={(tId, product) =>
              setFormData((prev) => ({
                ...prev,
                tanks: prev.tanks.map((t) => (t.tankId === tId ? { ...t, product } : t))
              }))
            }
            onAddTank={(product) => {
              setFormData((prev) => {
                const currentSameProd = prev.tanks.filter((t) => t.product === product);
                const nextIndex = currentSameProd.length + 1;
                const newTankId = `${product}_${Date.now()}`;
                const defaultCap = product === 'MS' ? 30 : 40;
                return {
                  ...prev,
                  tanks: [
                    ...prev.tanks,
                    {
                      tankId: newTankId,
                      product,
                      tankIndex: nextIndex,
                      capacityKl: defaultCap,
                      manualDip: 0,
                      autoDip: 0,
                      delta: 0,
                      isCompliant: true
                    }
                  ]
                };
              });
            }}
            onRemoveTank={(tId: string) => {
              setFormData((prev) => ({
                ...prev,
                tanks: prev.tanks.filter((t) => t.tankId !== tId)
              }));
            }}
            onTankPhoto={(tId: string, file: File) => {
              const r = new FileReader();
              r.onload = () =>
                setFormData((prev) => ({
                  ...prev,
                  tanks: prev.tanks.map((t) =>
                    t.tankId === tId ? { ...t, photoData: r.result as string } : t
                  )
                }));
              r.readAsDataURL(file);
            }}
            viewOnly={viewOnly}
          />

          <ChecklistSection
            questions={auditQuestions}
            answers={formData.answers}
            hasCanopy={formData.hasCanopy}
            selectedLanguage={formData.assessmentLanguage}
            onAnswerChange={(qid, val) =>
              setFormData((prev) => ({ ...prev, answers: { ...prev.answers, [qid]: val } }))
            }
          />

          <SignaturePadModal
            signatureData={formData.signatureData}
            onSaveSignature={(b64) => updateField('signatureData', b64)}
          />
        </main>
      )}

      {!viewOnly && !completedAudit && (
        <DraftStatusBar
          progressPercent={calculateProgress()}
          lastSavedAt={lastSaved}
          isSaving={isSaving}
          onSaveManual={async () => {
            setIsSaving(true);
            saveLocalDraft(formData.cmsCode, formData);
            setLastSaved(new Date().toLocaleTimeString());
            try {
              const res = await fetch('/api/audits/draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  cmsCode: formData.cmsCode,
                  roName: formData.roName,
                  progressPercent: calculateProgress(),
                  data: formData
                })
              });
              const resData = await res.json();
              if (resData.success) alert('Draft progress synced successfully!');
            } catch (err) {
              alert('Draft saved locally on device.');
            } finally {
              setIsSaving(false);
            }
          }}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      <ReuploadPreviewModal
        item={activeUploadModal}
        onClose={() => setActiveUploadModal(null)}
      />
    </div>
  );
}

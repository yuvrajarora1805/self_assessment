import { AuditFormData } from '@/types/audit';

export interface ProfileLoadResult {
  completedAudit: any | null;
  pendingReuploads: any[];
  restoredDraft: any | null;
  draftTime: string | null;
  profileRo: any | null;
  profileCerts: any | null;
  targetCms: string;
}

export async function fetchInitialAuditData(initialCmsCode: string): Promise<ProfileLoadResult | null> {
  let targetCms = initialCmsCode;
  if (!targetCms) {
    try {
      const rawUser = localStorage.getItem('fuel_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.username) targetCms = u.username;
      }
    } catch (e) {}
  }

  if (!targetCms) {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.authenticated && meData.user?.username) targetCms = meData.user.username;
    } catch (e) {}
  }

  if (!targetCms) return null;

  let profileRo: any = null;
  let profileCerts: any = null;
  let completedAudit: any = null;
  let pendingReuploads: any[] = [];
  try {
    const pRes = await fetch(`/api/dealer/monthly-profile?cmsCode=${encodeURIComponent(targetCms)}`);
    if (pRes.ok) {
      const pData = await pRes.json();
      if (pData.success && pData.profile) {
        profileRo = pData.profile.ro;
        profileCerts = pData.profile.certificates;
        if (pData.profile.completedAudit) completedAudit = pData.profile.completedAudit;
        if (pData.profile.pendingReuploadRequests) pendingReuploads = pData.profile.pendingReuploadRequests;
      }
    }
  } catch (e) {
    console.warn('Profile load notice:', e);
  }

  let restoredDraft: any = null;
  let draftTime: string | null = null;
  try {
    const dRes = await fetch(`/api/audits/draft?cmsCode=${encodeURIComponent(targetCms)}`);
    if (dRes.ok) {
      const dData = await dRes.json();
      if (dData.success && dData.draft?.data) {
        restoredDraft = dData.draft.data;
        draftTime = dData.draft.updatedAt ? new Date(dData.draft.updatedAt).toLocaleTimeString() : null;
      }
    }
  } catch (e) {}

  if (!restoredDraft) {
    try {
      const raw = localStorage.getItem(`draft_${targetCms}`);
      if (raw) restoredDraft = JSON.parse(raw);
    } catch (e) {}
  }

  return {
    targetCms,
    completedAudit,
    pendingReuploads,
    restoredDraft,
    draftTime,
    profileRo,
    profileCerts
  };
}

export function mergeProfileAndDraft(
  base: AuditFormData,
  res: ProfileLoadResult
): AuditFormData {
  const merged: AuditFormData = {
    ...base,
    cmsCode: res.targetCms
  };

  if (res.profileRo) {
    merged.roName = res.profileRo.ro_name || merged.roName;
    merged.repName = merged.repName || res.profileRo.dealer_name || '';
    merged.repMobile = merged.repMobile || res.profileRo.dealer_mobile || '';
    merged.tsmName = merged.tsmName || res.profileRo.tsm_name || '';
    merged.brandType = (res.profileRo.brand_type?.toUpperCase().includes('ESSAR') ? 'ESSAR' : 'NAYARA') as any;
    merged.hasCanopy = (res.profileRo.has_canopy || 'Yes') as any;
  }

  if (res.profileCerts) {
    if (res.profileCerts.earthing?.validUntil) merged.statutory.cc_earthing_date = res.profileCerts.earthing.validUntil;
    if (res.profileCerts.water?.validUntil) merged.statutory.cc_water_date = res.profileCerts.water.validUntil;
    if (res.profileCerts.fire?.validUntil) merged.statutory.cc_fire_date = res.profileCerts.fire.validUntil;
    if (res.profileCerts.wm_jar?.validUntil) merged.statutory.wm_jar_date = res.profileCerts.wm_jar.validUntil;
  }

  if (res.restoredDraft) {
    return {
      ...merged,
      ...res.restoredDraft,
      fsmTotal: res.restoredDraft.fsmTotal ?? merged.fsmTotal,
      fsmMale: res.restoredDraft.fsmMale ?? merged.fsmMale,
      fsmFemale: res.restoredDraft.fsmFemale ?? merged.fsmFemale,
      signatureData: res.restoredDraft.signatureData || merged.signatureData,
      customPhotoNames: { ...merged.customPhotoNames, ...(res.restoredDraft.customPhotoNames || {}) },
      answers: { ...merged.answers, ...(res.restoredDraft.answers || {}) },
      photos: { ...merged.photos, ...(res.restoredDraft.photos || {}) },
      statutory: { ...merged.statutory, ...(res.restoredDraft.statutory || {}) },
      tanks: (res.restoredDraft.tanks && res.restoredDraft.tanks.length > 0) ? res.restoredDraft.tanks : merged.tanks
    };
  }

  return merged;
}

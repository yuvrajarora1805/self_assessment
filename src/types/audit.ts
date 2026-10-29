export interface AuditFormData {
  // 1. Outlet & Auditor Information
  roName: string;
  cmsCode: string;
  brandType: 'NAYARA' | 'ESSAR' | '';
  hasCanopy: 'Yes' | 'No' | '';
  lastCraDate: string;
  daysSinceCra?: number;
  tsmName: string;
  repName: string;
  repMobile: string;
  fsmTotal: number | '';
  fsmMale: number | '';
  fsmFemale: number | '';
  assessmentLanguage: string;

  // 2. Location Stamp
  gpsCoords: string;
  gpsAddress: string;
  gpsAccuracy: number | null;

  // 3. Question Responses: map of questionId -> 'Yes' | 'No' | 'NA'
  answers: Record<number, 'Yes' | 'No' | 'NA'>;

  // 4. Photos: map of photoId/name -> Base64 Data URL
  photos: Record<string, string>;
  customPhotoNames: Record<number, string>;

  // 5. Statutory Compliance
  statutory: {
    cc_esd: string;
    cc_petro: string;
    cc_earthing: string;
    cc_earthing_date: string;
    cc_water: string;
    cc_water_date: string;
    cc_dssr: string;
    cc_fa: string;
    cc_peso: string;
    cc_fire: string;
    cc_fire_date: string;
    cc_wm: string;
    wm_du_count: number;
    wm_du_dates: Record<number, string>;
    wm_jar_date: string;
  };

  // 6. Tank Dips
  tanks: TankDipRecord[];

  // 7. Signature
  signatureData: string;
}

export interface TankDipRecord {
  tankId: string;
  product: 'MS' | 'HSD';
  tankIndex: number;
  capacityKl: number | '';
  manualDip: number | null;
  autoDip: number | null;
  delta: number | null;
  isCompliant: boolean | null;
  photoData?: string;
}

export interface ChecklistQuestion {
  id: number;
  segment: string;
  text: string;
  maxScore: number;
  negative?: boolean;
  trans?: Record<string, string>;
}

export interface SegmentScore {
  segment: string;
  maxScore: number;
  earnedScore: number;
  percentage: number;
}

export interface AuditDraft {
  cmsCode: string;
  data: Partial<AuditFormData>;
  updatedAt: string;
  progressPercent: number;
}

# Modular TSX Audit Architecture & Refactoring Plan

## 1. Overview & Motivation
The self-assessment tool currently resides inside a 3,500-line monolithic HTML file (`public/legacy/index.html`). This structure has caused silent validation failures (hidden inputs with `required` blocking submit with no user feedback), difficult debugging, and maintenance friction.

This document outlines the complete migration into modular, strongly-typed **Next.js React (TSX)** components following clean software engineering principles. **No file will exceed 200–250 lines.**

---

## 2. Architecture & File Structure

```
src/
├── types/
│   └── audit.ts                          # Strict TypeScript interfaces (<120 lines)
├── data/
│   ├── audit-questions.ts                # 70+ categorized audit questions (<250 lines)
│   ├── audit-translations.ts             # 11 Indian regional language mappings (<250 lines)
│   └── photo-requirements.ts             # Default & custom photographic evidence keys (<100 lines)
├── components/
│   └── audit/
│       ├── AuditHeader.tsx               # Sticky outlet banner & language switcher (<140 lines)
│       ├── GpsVerificationBox.tsx        # High-accuracy geolocation stamp & reverse geocode (<160 lines)
│       ├── OutletInfoSection.tsx         # Pre-filled RO, Brand, Canopy, Staffing (<180 lines)
│       ├── PhotoCaptureGrid.tsx          # 12-16 photo slots with canvas watermark (<240 lines)
│       ├── StatutorySection.tsx          # Critical compliances: Earthing, Water, DSSR, etc. (<240 lines)
│       ├── TankDipAnalysis.tsx           # UST automated vs manual dip analysis (<230 lines)
│       ├── ChecklistSection.tsx          # Segmented YES/NO/NA questions (<210 lines)
│       ├── SignaturePadModal.tsx         # HTML5 canvas signature pad (<170 lines)
│       ├── AssessmentReportModal.tsx     # Printable report & submission confirmation (<250 lines)
│       └── DraftStatusBar.tsx            # Floating autosave & completion % tracker (<120 lines)
└── app/
    └── audit-form/
        ├── page.tsx                      # Page wrapper with Suspense (<80 lines)
        └── AuditFormClient.tsx           # Central form state manager (<240 lines)
```

---

## 3. Implementation Checklist (Steps 1 to 5)

### Step 1: Type Definitions (`src/types/audit.ts`)
- [ ] Define `AuditFormData` interface (outlet metadata, staffing, answers, photos, statutory).
- [ ] Define `ChecklistQuestion` & `SegmentScore` models.
- [ ] Define `TankDipRecord` & `StatutoryCert` models.
- [ ] Define `DraftState` with timestamp & completion percentage.

### Step 2: Data Assets (`src/data/`)
- [ ] Extract checklist questions cleanly into `audit-questions.ts`.
- [ ] Extract multi-language dictionaries into `audit-translations.ts`.
- [ ] Extract photo slot definitions into `photo-requirements.ts`.

### Step 3: Modular UI Components (`src/components/audit/`)
- [ ] Build `AuditHeader`: Displays dealer CMS/Name, monthly cycle badge, and regional language dropdown.
- [ ] Build `GpsVerificationBox`: GPS location sensor hook, accuracy verification, and location address.
- [ ] Build `OutletInfoSection`: Pre-fills defaults (Brand: NAYARA/ESSAR, Canopy: Yes, Staffing: 4 Total = 3 Male + 1 Female, Rep Name & Mobile), all completely editable.
- [ ] Build `PhotoCaptureGrid`: Camera capture with real-time watermark overlay (Timestamp, Lat/Long, Address).
- [ ] Build `StatutorySection`: Earthing, Water, DSSR, First Aid, PESO, Fire Extinguisher, and W&M certificates.
- [ ] Build `TankDipAnalysis`: Dynamic UST rows, delta tolerance calculation (&plusmn;3mm alert), and tank automation photo.
- [ ] Build `ChecklistSection`: Segment accordion, dynamic Canopy question filtering, and instant answer progress.
- [ ] Build `SignaturePadModal`: Touch/mouse signature pad with clear, preview, and base64 export.
- [ ] Build `DraftStatusBar`: Persistent local autosave indicator and missing items drawer.

### Step 4: Form Orchestrator & Submission Engine (`src/app/audit-form/`)
- [ ] Create `AuditFormClient.tsx`:
  - Centralized React state.
  - Periodic autosave to `localStorage` and draft API.
  - Smart validation: smooth scrolls directly to any missing field or unanswered question with clear highlights.
  - Final score computation and submit to `POST /api/audits`.

### Step 5: Route Forwarding & Validation
- [ ] Update `dealer-gateway.js` and `dealer-portal` to link to `/audit-form`.
- [ ] Test end-to-end report generation and validation.

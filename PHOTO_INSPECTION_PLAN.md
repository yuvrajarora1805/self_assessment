# Plan: Full Image Inspection (Lightbox Modal) & Seamless Dealer Retake / Preview

## Current Situation
1. **Admin View (Dashboard & Draft Inspector)**:
   - In `ActiveDraftsCard.tsx`, photos are shown as small `h-16` thumbnails without click-to-enlarge lightbox modal.
   - Admin cannot inspect full-resolution evidence images, watermarks, GPS stamps, or dates.
2. **Dealer View (Audit Form)**:
   - In `PhotoCaptureGrid.tsx`, images are constrained to `h-24 object-cover` (aspect ratio flattened like wide ribbons).
   - The "Retake" button only appears on hover (`opacity-0 group-hover:opacity-100`), which fails or is difficult on mobile/touch screens.
   - There is no "Enlarge / View Image" button for the dealer to inspect whether their photo is clear or blurry before submitting.

---

## Action Plan

### Step 1: Create a Reusable Lightbox Modal Component
- Create `src/components/audit/PhotoLightboxModal.tsx` (< 100 lines):
  - Displays full-screen backdrop with blurred overlay.
  - Image rendered at natural aspect ratio with `max-h-[85vh]` and `max-w-[90vw]`.
  - Shows image title/slot name, zoom controls, and close button (ESC key + click outside).

### Step 2: Upgrade `PhotoCaptureGrid.tsx` for Dealer Experience
- Fix aspect ratio: Change `h-24 object-cover` to `h-32 object-contain bg-black/5` or natural aspect card.
- Provide two clear, touch-friendly buttons on every captured photo card:
  1. 👁️ **"View Large" / "Enlarge"** (opens the Lightbox Modal so dealer can examine clarity, watermark, date & GPS).
  2. 🔄 **"Retake Photo"** (prominent button that directly triggers the file camera input without requiring desktop hover).

### Step 3: Upgrade Admin `ActiveDraftsCard.tsx`
- Add click-to-enlarge functionality to all thumbnail slots in the Live Captured Photos section.
- Opening a thumbnail launches the Lightbox Modal with the full-resolution photo and watermark.

### Step 4: Verification
- Verify build passes cleanly with `npm run build`.
- Verify dealer can take, view full image, and retake on mobile & desktop.
- Verify admin can click any draft photo to inspect full size with watermarks.

---
name: compact-code-architect
description: >-
  Standardized protocol for clean, token-efficient workspace development. Enforces modular architecture,
  concise file boundaries, targeted edits, and lean structured state management to minimize LLM token consumption.
---

# Compact Code Architect & Token Conservation Standard

This skill establishes workspace-wide rules and patterns to maintain high code quality, optimal user experiences, and minimal token overhead across LLM pair-programming sessions.

## 1. Modular File Architecture & Token Ceiling
- **Strict Size Limit:** Keep each source file under 200–250 lines.
- **Single Responsibility Principle (SRP):** Split large monolithic components into dedicated focused units:
  - Form sections (e.g. `OutletInfoSection`, `PhotoCaptureGrid`, `StatutorySection`).
  - Reusable modals and lightboxes (e.g. `PhotoLightboxModal`).
  - Helper libraries and formatters (e.g. `image-storage.ts`, `auth.ts`, `db.ts`).
- **Token Efficiency Benefit:** When inspecting, debugging, or editing code, the agent only reads and writes small 50–150 line blocks rather than loading 3,000+ line monolithic files into the context window.

## 2. Targeted Tool Usage & Reading Discipline
- **Avoid Dumping Large Files:** Never read an entire file if only inspecting a specific block. Use `StartLine` and `EndLine` slices (`view_file` with ranges ≤ 60 lines).
- **Targeted Regex/Grep:** Use `grep_search` with specific query terms and file glob filters (`Includes: ["*.tsx"]`) instead of general recursive scans.
- **Single Contiguous Edits:** Prefer `replace_file_content` targeting exact anchors over regenerating whole files.

## 3. Responsive & Mobile-First Component Guidelines
- **Card Action Buttons:** On mobile screens (e.g. photo capture cards or grid cards), always structure action buttons to fit tightly:
  - Use `flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5`.
  - Add `min-w-0 flex-1 truncate` so button titles never overflow card boundaries or wrap awkwardly on mobile viewports (<380px).
  - Use clear, short labels: `"Enlarge"` and `"Retake"`.
- **View-Only Mode Support:** All interactive components (photo capture, certificate uploads, dropdowns) must accept a `viewOnly?: boolean` prop:
  - If `viewOnly={true}`: hide "Retake" and camera capture inputs; expand "Enlarge" to full width (`w-full`); disable inputs.

## 4. Evidence & Certificate Capture Standard
- **Watermarking Consistency:** Whenever photos or certificates are captured, automatically burn an on-canvas GPS and timestamp footer:
  - Standard format: `📍 GPS: {gpsCoords} | ⏰ {toLocaleString('en-IN')}` and subtitle `{label} • {address}`.
  - Export as compressed JPEG (`quality: 0.85`, max dimension: 1200px) to conserve database storage and transfer bandwidth.
- **Dual Support for Certificates:** Every certificate item with an expiry/validity date must provide:
  - Date input (`<input type="date">`).
  - Dedicated camera/upload slot with instant thumbnail preview.
  - Deep-zoom lightbox trigger (`Enlarge`) and `Retake` option for dealers.

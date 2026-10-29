# Production Security, Encryption & API Authorization Plan

## 1. Executive Summary & Problem Analysis
- **Password Security & Encryption**: Currently passwords in `users.password_hash` are plain text (e.g., `'123456'`). We need enterprise-grade salted hashing (`scrypt` / `pbkdf2` via Node.js native `crypto`) with backward-compatible auto-migration on login.
- **Session Tokens**: Database-backed session tokens already exist (`sessions` table), but require:
  - Strict bearer / cookie validation across all API routes.
  - Role-based authorization guard helpers (`requireAuth`, `requireAdmin`, `requireDealer`).
  - Constant-time verification & session renewal.
- **Unprotected API Endpoints**:
  - `GET /api/dealers` & `POST /api/dealers` currently lack server-side authorization checks.
  - `GET /api/stats` has no authorization checks.
  - `GET /api/audits` & `POST /api/audits` lack authorization checks. Dealers could fetch all audits or submit audits for any CMS code.
  - `GET /api/audits/[id]` & `DELETE /api/audits/[id]` lack authorization checks. Any user could view or delete any audit.
  - `POST /api/audits/[id]/approval` lacks role verification (only admins/operations should approve).
  - `GET /api/dealer/monthly-profile` accepts any `cmsCode` without verifying if the caller is authorized for that dealer.
- **UI & Gateway Cleanliness**:
  - `public/legacy/index.html` has a link to "Central Dashboard" which should only be shown if the user is an ADMIN.
  - Submitting an audit shouldn't say "Go to Dashboard" to dealers (since dealers are blocked from `/`).

---

## 2. Checklist of Deliverables

### Phase 1: Password Encryption & Security (`src/lib/auth.ts`)
- [ ] Create robust password hashing & verification utilities using native Node.js `crypto.scrypt`:
  - `hashPassword(password: string): string` generating `scrypt:<salt>:<hash>`
  - `verifyPassword(password: string, storedHash: string): boolean` handling both hashed and plain text fallback.
- [ ] Implement migration helper to upgrade existing plain text passwords in SQLite to secure salted scrypt hashes.
- [ ] Update `src/app/api/auth/login/route.ts` to verify password using `verifyPassword` and upgrade plain text to scrypt hash on first successful login.
- [ ] Update `src/app/api/auth/change-password/route.ts` to hash new passwords with `hashPassword`.
- [ ] Update `src/app/api/dealers/route.ts` to hash newly created dealer passwords.

### Phase 2: Centralized API Authorization & RBAC Guard (`src/lib/auth.ts`)
- [ ] Implement reusable auth guard functions in `src/lib/auth.ts`:
  - `getAuthenticatedUser(request?: Request)`: Reads token from `session_token` cookie or `Authorization: Bearer <token>` header, verifies session in SQLite database, and returns user session object or null.
  - `requireAuth(request?: Request)`: Returns authenticated user or `401 Unauthorized` JSON.
  - `requireAdmin(request?: Request)`: Returns user if role is `ADMIN` or `AUDITOR` / `TSM`, else `403 Forbidden`.
  - `requireDealerOrAdmin(request?: Request, cmsCode?: string)`: Allows admins/TSMs, or dealers if matching their assigned CMS code.
- [ ] Update `src/middleware.ts`:
  - Enforce API route authentication for all protected endpoints (`/api/dealers`, `/api/stats`, `/api/audits`, `/api/dealer`).
  - Return HTTP 401 JSON for unauthenticated API requests instead of redirecting API calls to `/login`.

### Phase 3: Securing All API Endpoints
- [ ] **`GET /api/stats`**: Require authenticated session (Admins/TSMs get full stats, Dealers get their own outlet stats or 403).
- [ ] **`GET /api/dealers`**: Require Admin/TSM access (`403 Forbidden` for dealers).
- [ ] **`POST /api/dealers`**: Require Admin access (`403 Forbidden` for dealers).
- [ ] **`GET /api/audits`**:
  - If Admin/TSM: Allow listing all audits with filters.
  - If Dealer: Restrict queries strictly to their own assigned CMS code.
- [ ] **`POST /api/audits`**:
  - Require valid session.
  - If Dealer: Verify `data.cmsCode` strictly matches `session.username`.
- [ ] **`GET /api/audits/[id]`**:
  - If Admin/TSM: Allow viewing.
  - If Dealer: Verify the audit belongs to the dealer's CMS code, else `403 Forbidden`.
- [ ] **`DELETE /api/audits/[id]`**:
  - Require Admin access only (`403 Forbidden` for dealers).
- [ ] **`POST /api/audits/[id]/approval`**:
  - Require Admin/Operations HQ access only (`403 Forbidden` for dealers).
- [ ] **`GET /api/dealer/monthly-profile`**:
  - Require valid session.
  - If Dealer: Only permit fetching their own assigned CMS code. Admins can fetch any CMS code.

### Phase 4: Frontend & Dealer Portal Alignment
- [ ] In `public/legacy/index.html`:
  - Read `fuel_role` cookie or `fuel_user` to conditionally hide or adjust the "← Central Dashboard" button for dealers.
  - Update submission banner to avoid suggesting dealer visit admin `/` dashboard.
- [ ] Ensure quick logins & session state seamlessly propagate with encrypted credentials.

### Phase 5: Verification & Quality Assurance
- [ ] Run migration script to hash existing accounts and test login with both Admin (`admin`/`123456`) and Dealers (`50085NA085`/`123456`).
- [ ] Test password change and verify encrypted hash stored in DB.
- [ ] Test all API endpoints:
  - Unauthenticated requests receive `401 Unauthorized`.
  - Dealer trying to access `/api/dealers` or `/api/audits/[id]/approval` receives `403 Forbidden`.
  - Dealer accessing `/api/audits` only receives audits matching their CMS code.
  - Admin receives full access.
- [ ] Verify Next.js build and test run.

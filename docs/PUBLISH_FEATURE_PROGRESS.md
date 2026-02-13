# Publish Feature Enhancement — Progress & Roadmap

## Overview

Enhancing FlowForm's publish workflow from a basic Draft/Published/Closed lifecycle to a full-featured publishing system with access controls, scheduling, validation, embed support, and sharing options.

---

## Phase 1: Settings + Validation — COMPLETE

Wired up existing `AssessmentSettings` fields (`password`, `maxResponses`, `openAt`, `closeAt`) that were defined in the schema but never surfaced in the UI or enforced in the APIs. Added pre-publish flow validation.

### What was built

| Step | Description | Files |
|------|-------------|-------|
| 1.1 | **Publish API** — flow validation before publish (blocks on errors, warns on issues); accepts `openAt`, `maxResponses`, `password`; hashes passwords with bcrypt | `src/app/api/assessments/[id]/publish/route.ts` |
| 1.2 | **Response API** — enforces `openAt` (rejects submissions before open date) | `src/app/api/assessments/[id]/responses/route.ts` |
| 1.3 | **Public Assessment API** — exposes `requiresPassword`, `isScheduled`, `scheduledOpenAt` (never leaks hash) | `src/app/api/public/assessments/[id]/route.ts` |
| 1.4 | **Password verification endpoint** — POST with bcrypt compare, returns `{ valid }` | `src/app/api/public/assessments/[id]/verify-password/route.ts` (new) |
| 1.5 | **PasswordGate component** — full-page password form with show/hide, error state, sessionStorage persistence | `src/presentation/components/respondent/PasswordGate.tsx` (new) |
| 1.6 | **ScheduledState component** — "Coming Soon" state with formatted open date | `src/presentation/components/respondent/ErrorStates.tsx` |
| 1.7 | **Respondent page** — handles password gate + scheduled state before showing assessment | `src/app/a/[id]/page.tsx` |
| 1.8 | **Canvas store** — added `responseCount` and `settings` to Zustand state | `src/presentation/stores/canvas.store.ts` |
| 1.9 | **PublishModal expansion** — schedule pickers (openAt/closeAt), max responses, password field, validation errors/warnings, response count badge, active settings summary | `src/presentation/components/publish/PublishModal.tsx` |
| 1.10 | **Editor page wiring** — passes `responseCount`/`settings` to modal, sends expanded settings in publish request, handles 400 validation errors | `src/app/dashboard/[id]/edit/page.tsx` |

### How to test

1. Create assessment with missing end node → publish → should show validation errors in modal
2. Publish with password set → access public URL → password gate should appear
3. Set `openAt` to future → try submit → should reject with "not opened yet"
4. Set `maxResponses` to 1, submit 2 responses → second should fail
5. Open publish modal for published assessment → should show response count

---

## Phase 2: Embed & QR Code — COMPLETE

Added iframe/popup embedding support and QR code generation in the share panel.

### What was built

| Step | Description | Files |
|------|-------------|-------|
| 2.1 | **Dependency** — installed `qrcode.react` | `package.json` |
| 2.2 | **Share utility** — `getEmbedUrl()`, `getIframeEmbedCode()`, `getPopupEmbedCode()` | `src/lib/share.ts` |
| 2.3 | **Embed route** — stripped-down assessment page for iframes, no site chrome | `src/app/embed/[id]/page.tsx` (new), `src/app/embed/[id]/layout.tsx` (new) |
| 2.4 | **Middleware** — added `/embed/` to public routes | `src/middleware.ts` |
| 2.5 | **AssessmentFlow embed mode** — `isEmbed` prop: `h-screen` layout, `postMessage` on submit | `src/presentation/components/respondent/AssessmentFlow.tsx` |
| 2.6 | **Share tabs in PublishModal** — Link tab (existing), Embed tab (iframe + popup code), QR tab (SVG render, PNG download, size selector) | `src/presentation/components/publish/PublishModal.tsx` |

### How to test

1. Navigate to `/embed/{id}` → assessment renders without site chrome
2. Copy iframe code from Embed tab → paste in HTML file → loads in iframe
3. Submit response in embed → parent receives `window.postMessage({ type: 'flowform:submitted' })`
4. QR tab → scan with phone → opens assessment URL
5. Download QR as PNG → verify high-res image

---

## Phase 3: Invite-Only Mode — COMPLETE

Added invite-only assessment access. Admins can toggle assessments to require unique invite tokens. Each token is trackable with usage limits.

### What was built

| Step | Description | Files |
|------|-------------|-------|
| 3.1 | **Schema** — `assessment_invites` table (id, assessmentId, email, token, maxUses, usedCount, expiresAt, createdAt) + `inviteOnly: boolean` in `AssessmentSettings` | `src/infrastructure/database/schema.ts`, `src/domain/entities/assessment.ts` |
| 3.2 | **Domain entity** — `AssessmentInvite` interface, `isAssessmentInviteValid()`, reuses `generateInviteToken()` from org invite entity | `src/domain/entities/assessmentInvite.ts` (new) |
| 3.3 | **Repository** — `IAssessmentInviteRepository` interface + Drizzle implementation with singleton factory. Methods: findById, findByToken, findByAssessmentId, create, createBulk, incrementUsedCount, delete, deleteByAssessmentId | `src/domain/repositories/assessmentInvite.repository.ts` (new), `src/infrastructure/database/repositories/assessmentInvite.repository.impl.ts` (new) |
| 3.4 | **Invite CRUD API** — `POST/GET /api/assessments/:id/invites` (create bulk/list), `DELETE /api/assessments/:id/invites/:inviteId` (revoke). Supports email-based or anonymous link generation, capped at 100 per request | `src/app/api/assessments/[id]/invites/route.ts` (new), `src/app/api/assessments/[id]/invites/[inviteId]/route.ts` (new) |
| 3.5 | **Public API gate** — validates `?invite=` token when `inviteOnly` is true; returns 403 with `requiresInvite` flag for missing/invalid/expired tokens | `src/app/api/public/assessments/[id]/route.ts` |
| 3.6 | **Response API enforcement** — requires + validates invite token on submission; increments `usedCount` atomically via SQL `+1`; rejects exhausted/expired tokens | `src/app/api/assessments/[id]/responses/route.ts` |
| 3.7 | **InviteRequiredState** — "Invitation Required" error page with Mail icon | `src/presentation/components/respondent/ErrorStates.tsx` |
| 3.8 | **Respondent pages** — both `/a/[id]` and `/embed/[id]` read `?invite=` from URL, pass to public API, handle 403, pass token through AssessmentFlow to response submission. Wrapped in Suspense for `useSearchParams` | `src/app/a/[id]/page.tsx`, `src/app/embed/[id]/page.tsx`, `src/presentation/components/respondent/AssessmentFlow.tsx` |
| 3.9 | **InviteManager UI** — toggle for invite-only (optimistic local state), create invites (anonymous links or email-based with configurable maxUses), invite list with copy link + usage stats + revoke. Shown in PublishModal for both draft and published states | `src/presentation/components/publish/InviteManager.tsx` (new), `src/presentation/components/publish/PublishModal.tsx` |
| 3.10 | **Publish API** — accepts `inviteOnly` in settings update during publish | `src/app/api/assessments/[id]/publish/route.ts` |
| 3.11 | **Share utility** — `getInviteShareUrl(assessmentId, token)` helper | `src/lib/share.ts` |

### Prerequisites

- Run `npm run db:push` to create the `assessment_invites` table (migration file generated at `src/infrastructure/database/migrations/0001_gray_eternals.sql`)

### How to test

1. Toggle invite-only ON in PublishModal → publish → visit `/a/{id}` without token → "Invitation Required" page
2. Generate invite links → copy one → open in incognito with `?invite=TOKEN` → assessment loads
3. Submit response with invite token → `usedCount` increments → try again when exhausted → rejected
4. Revoke an invite → try its link → should be rejected
5. Same flow works via `/embed/{id}?invite=TOKEN`
6. Toggle invite-only OFF → public link works again without token

---

## Phase 4: Future Ideas (not planned yet)

These are ideas identified during the initial analysis that could be explored later:

- **Analytics dashboard** — response trends, completion rates, drop-off points per question
- **Webhook integrations** — notify external services on response submission
- **Custom branding** — logo upload, custom CSS, white-label embed
- **A/B testing** — publish multiple flow variants, split traffic, compare completion rates
- **Respondent identification** — optional name/email collection before assessment, link responses to identities
- **Response export** — CSV/Excel download of all responses for an assessment

---

## Architecture Reference

### Key files

| Area | File |
|------|------|
| Assessment entity & settings | `src/domain/entities/assessment.ts` |
| Assessment invite entity | `src/domain/entities/assessmentInvite.ts` |
| Flow validation | `src/domain/entities/flow.ts` (`validateFlow()`) |
| Publish API | `src/app/api/assessments/[id]/publish/route.ts` |
| Response submission API | `src/app/api/assessments/[id]/responses/route.ts` |
| Invite CRUD API | `src/app/api/assessments/[id]/invites/route.ts` |
| Public assessment API | `src/app/api/public/assessments/[id]/route.ts` |
| Password verify API | `src/app/api/public/assessments/[id]/verify-password/route.ts` |
| Share utilities | `src/lib/share.ts` |
| PublishModal UI | `src/presentation/components/publish/PublishModal.tsx` |
| InviteManager UI | `src/presentation/components/publish/InviteManager.tsx` |
| Canvas store (Zustand) | `src/presentation/stores/canvas.store.ts` |
| Editor page | `src/app/dashboard/[id]/edit/page.tsx` |
| Public respondent page | `src/app/a/[id]/page.tsx` |
| Embed page | `src/app/embed/[id]/page.tsx` |
| Respondent components | `src/presentation/components/respondent/` |
| Middleware (route protection) | `src/middleware.ts` |
| Assessment invite repository | `src/infrastructure/database/repositories/assessmentInvite.repository.impl.ts` |
| DB schema | `src/infrastructure/database/schema.ts` |

### Dependencies added
- `qrcode.react` — QR code SVG/Canvas rendering (Phase 2)
- `bcryptjs` — password hashing (already existed before Phase 1)

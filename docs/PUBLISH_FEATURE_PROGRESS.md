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

## Phase 3: Invite-Only Mode — PLANNED (not started)

Allow assessments to be restricted to invited respondents only. The org invite system already exists (`/api/invites/`, `/invite/[token]`), and this phase extends it to assessment-level invitations.

### Design Notes

**Concept:** An admin can toggle an assessment to "Invite Only" mode. Instead of a public link, respondents receive unique invite tokens. Each token is single-use or limited-use.

### Proposed Steps

#### 3.1 — Schema: Assessment invites table
- New table `assessment_invites` with columns: `id`, `assessmentId`, `email` (optional), `token` (unique), `maxUses`, `usedCount`, `expiresAt`, `createdAt`
- Add `inviteOnly: boolean` to `AssessmentSettings`
- Run schema migration with Drizzle

#### 3.2 — API: Create/list/revoke invites
- `POST /api/assessments/[id]/invites` — generate invite(s), optionally with email addresses
- `GET /api/assessments/[id]/invites` — list all invites with usage stats
- `DELETE /api/assessments/[id]/invites/[inviteId]` — revoke an invite

#### 3.3 — API: Validate invite token on public access
- `GET /api/public/assessments/[id]?invite=[token]` — validate token, return assessment if valid
- If `inviteOnly` is true and no valid token → return 403

#### 3.4 — Response API: Enforce invite token
- When submitting a response to an invite-only assessment, require the invite token
- Increment `usedCount`, reject if over `maxUses`

#### 3.5 — Respondent page: Invite token handling
- Read `?invite=` query param from URL
- If invite-only and no token → show "This assessment requires an invitation" state
- Pass token through to response submission

#### 3.6 — PublishModal: Invite management UI
- Toggle for "Invite Only" mode in access control section
- Invite creation form (bulk email input or generate anonymous links)
- Invite list with copy link, usage stats, revoke button
- Invite link format: `{baseUrl}/a/{assessmentId}?invite={token}`

#### 3.7 — Email invites (optional, future)
- Send invite emails via a transactional email service
- Email contains the personalized assessment link

### Existing code to leverage
- Org-level invite system: `src/app/api/invites/[token]/`, `src/app/invite/[token]/page.tsx`
- Can follow the same token-based pattern but scoped to assessments

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
| Flow validation | `src/domain/entities/flow.ts` (`validateFlow()`) |
| Publish API | `src/app/api/assessments/[id]/publish/route.ts` |
| Response submission API | `src/app/api/assessments/[id]/responses/route.ts` |
| Public assessment API | `src/app/api/public/assessments/[id]/route.ts` |
| Password verify API | `src/app/api/public/assessments/[id]/verify-password/route.ts` |
| Share utilities | `src/lib/share.ts` |
| PublishModal UI | `src/presentation/components/publish/PublishModal.tsx` |
| Canvas store (Zustand) | `src/presentation/stores/canvas.store.ts` |
| Editor page | `src/app/dashboard/[id]/edit/page.tsx` |
| Public respondent page | `src/app/a/[id]/page.tsx` |
| Embed page | `src/app/embed/[id]/page.tsx` |
| Respondent components | `src/presentation/components/respondent/` |
| Middleware (route protection) | `src/middleware.ts` |

### Dependencies added
- `qrcode.react` — QR code SVG/Canvas rendering (Phase 2)
- `bcryptjs` — password hashing (already existed before Phase 1)

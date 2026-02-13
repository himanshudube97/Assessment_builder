# Google Sheets Integration - Technical Design Document

> Status: Draft
> Created: February 2026
> Author: FlowForm Team

---

## Overview

This document outlines the architecture for integrating Google Sheets with FlowForm, allowing users to automatically export assessment responses to their spreadsheets.

---

## Authentication Approach

### Chosen: OAuth 2.0

| Option | UX | Security | Verdict |
|--------|-----|----------|---------|
| OAuth 2.0 | Simple (1-click) | Excellent | ✅ Selected |
| Service Account JSON | Complex (technical) | Risky | ❌ Rejected |
| Public Sheet URL | Very Simple | Poor (read-only) | ❌ Rejected |

**Why OAuth:**
- One-click "Connect with Google" - familiar pattern for users
- No JSON files, no Google Cloud Console knowledge required
- User sees Google's consent screen (builds trust)
- Can both read AND write to sheets
- Users can revoke access anytime from their Google account

### Token Lifecycle

```
Access Token:  Expires in 1 hour (auto-refreshed silently)
Refresh Token: Lasts 6+ months (or indefinitely if used regularly)
```

**User re-authentication required only when:**
- User manually revokes access in Google settings
- Refresh token expires (6 months of inactivity)
- Google invalidates tokens (rare, security reasons)

### OAuth Scopes (Minimal)

```
https://www.googleapis.com/auth/spreadsheets      # Read/write sheets
https://www.googleapis.com/auth/drive.file        # Only files app creates/user selects
https://www.googleapis.com/auth/userinfo.email    # Display connected email
```

Using `drive.file` instead of full Drive access ensures FlowForm can only access sheets it created or the user explicitly selected.

---

## Data Architecture

### Core Principle: Our Database is Source of Truth

```
┌──────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   User submits response                                           │
│          │                                                        │
│          ▼                                                        │
│   ┌─────────────────┐                                             │
│   │  Save to our DB │  ← ALWAYS happens first (source of truth)  │
│   │   (immediate)   │                                             │
│   └────────┬────────┘                                             │
│            │                                                      │
│            ▼                                                      │
│   ┌─────────────────┐     ┌─────────────────┐                     │
│   │  Queue for sync │────▶│  Background Job │                     │
│   │   (async)       │     │  (syncs to GS)  │                     │
│   └─────────────────┘     └────────┬────────┘                     │
│                                    │                              │
│                    ┌───────────────┴───────────────┐              │
│                    ▼                               ▼              │
│              ✅ Success                      ❌ Failed            │
│           Mark as synced               Mark as pending            │
│           (keep in DB)                 Retry with backoff         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Benefits of Local-First Storage

| Benefit | Explanation |
|---------|-------------|
| **Reliability** | Google API down? No data loss |
| **Speed** | Response saved instantly, sync happens async |
| **Analytics** | Query our DB for dashboards, no Sheets API calls |
| **Audit Trail** | Keep history even if user modifies sheet |
| **Flexibility** | User can connect sheet later, sync all past data |
| **Offline Resilience** | Data safe even if connection lost |

---

## Database Schema

### Single Table Design (Recommended)

```sql
-- ❌ BAD: Per-org tables (anti-pattern)
-- org_123_responses, org_456_responses

-- ✅ GOOD: Single table with proper indexing

-- Responses table (source of truth)
CREATE TABLE responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  assessment_id   UUID NOT NULL REFERENCES assessments(id),

  -- Response data
  answers         JSONB NOT NULL,           -- Flexible schema for answers
  metadata        JSONB,                    -- Browser, IP, duration, etc.
  submitted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Sync tracking
  sync_status     VARCHAR(20) DEFAULT 'pending',  -- pending, synced, failed, disabled
  synced_at       TIMESTAMP WITH TIME ZONE,
  sync_error      TEXT,
  sync_attempts   INTEGER DEFAULT 0,

  -- Timestamps
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_responses_org_assessment ON responses(org_id, assessment_id);
CREATE INDEX idx_responses_pending_sync ON responses(sync_status) WHERE sync_status = 'pending';
CREATE INDEX idx_responses_submitted ON responses(submitted_at DESC);


-- Google OAuth connections (per user)
CREATE TABLE google_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) UNIQUE,

  -- OAuth tokens (encrypted at rest)
  access_token    TEXT NOT NULL,            -- Encrypted
  refresh_token   TEXT NOT NULL,            -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- User info
  google_email    VARCHAR(255) NOT NULL,

  -- Status
  status          VARCHAR(20) DEFAULT 'active',  -- active, expired, revoked
  connected_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at    TIMESTAMP WITH TIME ZONE
);


-- Sheet configuration (per assessment)
CREATE TABLE sheet_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) UNIQUE,
  user_id         UUID NOT NULL REFERENCES users(id),

  -- Google Sheet details
  spreadsheet_id  VARCHAR(255) NOT NULL,    -- Google's spreadsheet ID
  spreadsheet_name VARCHAR(255),            -- For display
  sheet_tab_name  VARCHAR(255) NOT NULL,    -- Tab within spreadsheet
  sheet_tab_id    INTEGER,                  -- Google's internal tab ID

  -- Sync settings
  auto_sync       BOOLEAN DEFAULT true,
  include_metadata BOOLEAN DEFAULT false,   -- Include timestamp, browser, etc.

  -- Status tracking
  last_synced_at  TIMESTAMP WITH TIME ZONE,
  row_count       INTEGER DEFAULT 0,        -- Rows in sheet

  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Scalability Notes

- Single table handles millions of rows with proper indexing
- Partition by `org_id` or `submitted_at` if hitting 100M+ rows
- This pattern is used by Typeform, Airtable, Notion

---

## Sheet Structure

### Single Spreadsheet + Multiple Tabs (Recommended)

```
┌──────────────────────────────────────────────────────────────────┐
│  Google Sheet: "FlowForm Responses"                               │
│  ──────────────────────────────────────                           │
│                                                                   │
│  Tabs (auto-created per assessment):                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [Customer Survey] [Job Application] [Quiz - Math] [+ New]  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Tab: "Customer Survey"                                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Timestamp │ Q1: Name │ Q2: Rating │ Q3: Feedback │ Score    │  │
│  │ ───────── │ ──────── │ ────────── │ ──────────── │ ──────   │  │
│  │ 2/11 9:30 │ John     │ 5          │ Great!       │ 85%      │  │
│  │ 2/11 9:45 │ Sarah    │ 4          │ Good service │ 72%      │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Structure

| Approach | Pros | Cons |
|----------|------|------|
| Multiple sheets | Per-assessment sharing, no tab limit | Cluttered Drive, harder to find |
| **Single sheet + tabs** | All data in one place, organized | 200 tab limit, all-or-nothing sharing |
| Single sheet + single tab | Simplest | Messy, mixed data |

**Decision:** Single sheet + tabs (with option to create new sheet if needed)

### Edge Cases

| Situation | Behavior |
|-----------|----------|
| Tab name already exists | Append number: "Customer Survey (2)" |
| Sheet deleted by user | Show error, prompt to select new sheet |
| Tab limit (200) reached | Prompt to create new spreadsheet |
| Assessment renamed | Ask: "Update tab name too?" |

---

## User Experience Flows

### Flow 1: Connect Google Account (One-time)

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Integrations                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📊 Google Sheets Integration                         │  │
│  │                                                       │  │
│  │  Automatically export responses to a spreadsheet      │  │
│  │                                                       │  │
│  │  [🔗 Connect Google Account]                          │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                         │                                    │
│                         ▼                                    │
│              Google OAuth Consent Screen                     │
│              "FlowForm wants to access your Sheets"          │
│                         │                                    │
│                         ▼                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ✅ Connected as john@gmail.com                       │  │
│  │                                        [Disconnect]   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Configure Sheet for Assessment

```
┌─────────────────────────────────────────────────────────────┐
│  First Assessment - Initial Setup                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Export to Google Sheets                    [Enabled ●]   │
│  ───────────────────────────────────────────────────────     │
│                                                              │
│  ○ Create new spreadsheet                                    │
│    Name: [FlowForm Responses          ]                      │
│                                                              │
│  ○ Use existing spreadsheet                                  │
│    [Select from Drive...]                                    │
│                                                              │
│  Tab name: [Customer Survey           ] (from assessment)    │
│                                                              │
│  [Save]                                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Subsequent Assessments - Remembers Previous Choice          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Export to Google Sheets                    [Enabled ●]   │
│  ───────────────────────────────────────────────────────     │
│                                                              │
│  Spreadsheet: "FlowForm Responses" ✓ (previously used)       │
│               [Change...]                                    │
│                                                              │
│  Tab name: [Job Application           ] (new tab)            │
│                                                              │
│  [Save]                                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Sync Status & Manual Sync

```
┌─────────────────────────────────────────────────────────────┐
│  Assessment Dashboard - Sync Status                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Assessment: Customer Feedback Survey                        │
│  ───────────────────────────────────────────────────────     │
│                                                              │
│  Responses: 247 total                                        │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📊 Google Sheets Sync                                │  │
│  │  ─────────────────────────────────────────────────    │  │
│  │                                                       │  │
│  │  Sheet: "2024 Surveys" → Tab: "Customer Feedback"     │  │
│  │                                                       │  │
│  │  ✅ 243 synced    ⏳ 4 pending    ❌ 0 failed         │  │
│  │                                                       │  │
│  │  Last sync: 2 minutes ago                             │  │
│  │                                                       │  │
│  │  [↻ Sync Now]  [↗ Open Sheet]                         │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 4: Error Recovery

```
┌─────────────────────────────────────────────────────────────┐
│  Connection Lost / Token Expired                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ⚠️ Google connection expired                         │  │
│  │                                                       │  │
│  │  47 responses waiting to sync                         │  │
│  │  Your data is safe - reconnect to sync                │  │
│  │                                                       │  │
│  │  [🔗 Reconnect Google Account]                        │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Failure Scenarios & Recovery

| Scenario | What Happens | User Experience |
|----------|--------------|-----------------|
| Happy path | Response saved → synced in seconds | See "synced" status |
| Google API down | Saved → retried every 5 min | See "pending" count |
| Token expired | Saved → user prompted to reconnect | Warning banner |
| User disconnects | Saved → stays in DB | Can export CSV |
| User reconnects | All pending responses sync automatically | Automatic recovery |
| Never connects Google | Data in DB, viewable in dashboard | Can export CSV |
| Sheet deleted | Error shown, prompt to select new sheet | Guided recovery |
| Rate limited | Exponential backoff, batch writes | Transparent |

---

## API Endpoints

```
# OAuth Flow
GET  /api/integrations/google/connect      → Initiate OAuth redirect
GET  /api/integrations/google/callback     → Handle OAuth callback
DELETE /api/integrations/google/disconnect → Revoke tokens, cleanup

# Sheet Management
GET  /api/integrations/google/sheets       → List user's sheets (for picker)
POST /api/integrations/google/sheets       → Create new spreadsheet

# Assessment Config
GET  /api/assessments/:id/sheet-config     → Get sheet config
PUT  /api/assessments/:id/sheet-config     → Update sheet config

# Sync Operations
POST /api/assessments/:id/sync             → Trigger manual sync
GET  /api/assessments/:id/sync-status      → Get sync statistics
```

---

## Background Sync Service

### Sync Job Logic

```typescript
// Pseudocode for sync worker

async function processPendingResponses() {
  // Get batch of pending responses
  const pending = await db.responses.findMany({
    where: { sync_status: 'pending' },
    orderBy: { submitted_at: 'asc' },
    take: 100,  // Batch size
  });

  // Group by assessment for efficient sheet writes
  const grouped = groupBy(pending, 'assessment_id');

  for (const [assessmentId, responses] of grouped) {
    try {
      // Get sheet config
      const config = await db.sheetConfigs.findUnique({ assessmentId });
      if (!config) continue;

      // Get user's Google connection
      const connection = await db.googleConnections.findUnique({
        userId: config.userId
      });

      // Refresh token if needed
      if (isExpired(connection.token_expires_at)) {
        await refreshAccessToken(connection);
      }

      // Batch write to Google Sheets
      await appendToSheet(connection.access_token, {
        spreadsheetId: config.spreadsheet_id,
        sheetName: config.sheet_tab_name,
        rows: responses.map(formatResponseRow),
      });

      // Mark as synced
      await db.responses.updateMany({
        where: { id: { in: responses.map(r => r.id) } },
        data: {
          sync_status: 'synced',
          synced_at: new Date(),
        },
      });

    } catch (error) {
      // Handle specific errors
      if (error.code === 401) {
        // Token revoked, mark connection as expired
        await markConnectionExpired(config.userId);
      } else if (error.code === 429) {
        // Rate limited, back off
        await sleep(exponentialBackoff(attempts));
      } else {
        // Mark responses as failed
        await markResponsesFailed(responses, error.message);
      }
    }
  }
}

// Run every minute
cron.schedule('* * * * *', processPendingResponses);
```

### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: 1 minute
Attempt 3: 5 minutes
Attempt 4: 30 minutes
Attempt 5: 2 hours
Attempt 6+: 6 hours (max)

After 10 failed attempts: Mark as failed, require manual intervention
```

---

## Security Considerations

1. **Token Storage**: Encrypt access/refresh tokens at rest
2. **Minimal Scopes**: Only request `drive.file`, not full Drive access
3. **Token Refresh**: Never expose refresh tokens to frontend
4. **Rate Limiting**: Implement per-user rate limits for sync triggers
5. **Audit Logging**: Log all sync operations for debugging
6. **Data Retention**: Define policy for keeping synced responses in DB

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Database migrations for new tables
- [ ] Google Cloud project setup
- [ ] OAuth flow implementation
- [ ] Settings UI for connecting Google

### Phase 2: Sheet Configuration
- [ ] Sheet picker/creator UI
- [ ] Assessment sheet config UI
- [ ] Tab auto-creation logic

### Phase 3: Sync Engine
- [ ] Background sync job
- [ ] Retry logic with backoff
- [ ] Sync status tracking
- [ ] Manual sync trigger

### Phase 4: Polish
- [ ] Error recovery UI
- [ ] Sync status dashboard
- [ ] Notifications for failures
- [ ] CSV export fallback

---

## Open Questions

1. **Data retention**: How long do we keep synced responses in our DB?
2. **Bulk sync**: When user connects sheet to existing assessment with 1000+ responses, sync all at once or batch?
3. **Column mapping**: Auto-generate columns from question titles, or let user customize?
4. **Formulas**: Preserve user's formulas in sheet when appending rows?
5. **Deletion sync**: If user deletes response in our app, delete from sheet too?

---

## References

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Typeform Integration Patterns](https://www.typeform.com/connect/google-sheets/)

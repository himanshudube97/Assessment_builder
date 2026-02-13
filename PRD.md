# Product Requirements Document (PRD)
# FlowForm - Visual Canvas Assessment Builder

**Version:** 1.0
**Last Updated:** February 11, 2026
**Author:** Himanshu
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision
FlowForm is a visual canvas-based assessment and survey builder that allows users to create branching questionnaires through an intuitive node-based interface. Users can design complex assessment flows visually, publish shareable links, and collect responses directly in Google Sheets.

### 1.2 Problem Statement
Current form builders (Google Forms, Typeform) use linear interfaces where conditional logic is hidden in settings menus. This makes it difficult to:
- Visualize complex branching flows
- Understand the respondent journey at a glance
- Debug logic errors in multi-path assessments

### 1.3 Solution
A canvas-based editor where questions are nodes, connections are flow paths, and branching logic is visible on the canvas itself. Think "Figma meets Typeform."

### 1.4 Target Launch
MVP: 6 weeks from start

---

## 2. Goals & Success Metrics

### 2.1 Business Goals
| Goal | Target (3 months post-launch) |
|------|-------------------------------|
| Registered users | 500 |
| Paid subscribers | 25 |
| MRR | $400 |
| Assessments created | 1,000 |
| Responses collected | 10,000 |

### 2.2 Product Goals
- Time to first published assessment: < 10 minutes
- User activation rate (create + publish): > 40%
- Free to paid conversion: > 5%

### 2.3 Non-Goals (Out of Scope for MVP)
- Team collaboration features
- Custom integrations beyond Google Sheets
- Mobile app
- AI-powered features
- Multi-language support
- Template marketplace

---

## 3. User Personas

### 3.1 Primary: Independent Educator (Sarah)
- **Role:** Online course creator, tutors students
- **Pain:** Wants to create adaptive quizzes but Typeform logic is confusing
- **Need:** Visual way to see "if student answers X, show Y"
- **Willingness to pay:** $10-15/month for professional tool

### 3.2 Secondary: HR Recruiter (Mike)
- **Role:** Screens candidates for tech company
- **Pain:** Needs different question paths based on experience level
- **Need:** Assessment that routes candidates through relevant questions
- **Willingness to pay:** $30-50/month for team use

### 3.3 Tertiary: Coach/Consultant (Priya)
- **Role:** Business coach qualifying leads
- **Pain:** Spends time on calls with unqualified leads
- **Need:** Discovery form that scores readiness and filters prospects
- **Willingness to pay:** $15-25/month

---

## 4. Feature Specifications

### 4.1 Core Features (MVP)

#### 4.1.1 Authentication
| Requirement | Details |
|-------------|---------|
| Sign up method | Google OAuth only (no email/password) |
| Session management | JWT tokens, 30-day expiry |
| Account data | Email, name, profile picture from Google |

#### 4.1.2 Dashboard
| Requirement | Details |
|-------------|---------|
| Assessment list | Grid/list view of user's assessments |
| Assessment card | Title, status (draft/published), response count, created date |
| Actions | Create new, edit, duplicate, delete, view responses |
| Empty state | Prompt to create first assessment |
| Search/filter | Search by title (v2 - not MVP) |

#### 4.1.3 Canvas Editor
| Requirement | Details |
|-------------|---------|
| Canvas | Infinite canvas with pan and zoom |
| Node types | Start, Question, End |
| Connections | Draggable lines between nodes |
| Add question | Click button or drag from sidebar |
| Edit question | Click node to open side panel |
| Delete | Select node/connection and press delete or click delete button |
| Auto-save | Save every 5 seconds if changes detected |
| Manual save | Save button in toolbar |
| Preview | Open assessment in new tab (preview mode) |
| Undo/redo | Ctrl+Z / Ctrl+Shift+Z |

#### 4.1.4 Question Types
| Type | Configuration Options |
|------|----------------------|
| Multiple Choice (Single) | Options (2-10), required toggle |
| Multiple Choice (Multi) | Options (2-10), min/max selections, required |
| Short Text | Placeholder, max length, required |
| Long Text | Placeholder, max length, required |
| Rating Scale | Min (1), Max (5 or 10), labels for ends |
| Yes/No | Custom labels optional |

#### 4.1.5 Branching Logic
| Requirement | Details |
|-------------|---------|
| Default flow | If no condition, go to next connected node |
| Conditional flow | "If answer equals X, go to node Y" |
| Multiple conditions | One connection per condition |
| Visual indicator | Show condition label on connection line |
| Condition types | Equals, Not equals, Contains (text), Greater/Less than (rating) |

#### 4.1.6 Start Node
| Requirement | Details |
|-------------|---------|
| Welcome screen | Title, description (optional) |
| Start button text | Customizable (default: "Start") |
| One per assessment | Cannot delete, always exists |

#### 4.1.7 End Node
| Requirement | Details |
|-------------|---------|
| Thank you screen | Title, description |
| Redirect URL | Optional - redirect after X seconds |
| Multiple end nodes | Allowed (different endings for different paths) |
| Show score | Toggle for quiz mode |

#### 4.1.8 Publishing
| Requirement | Details |
|-------------|---------|
| Publish action | Generate unique shareable link |
| Link format | `https://app.flowform.io/f/{assessment-id}` |
| Unpublish | Disable link (shows "assessment unavailable") |
| Status | Draft / Published / Closed |
| Copy link | One-click copy to clipboard |

#### 4.1.9 Response Collection (Respondent View)
| Requirement | Details |
|-------------|---------|
| Layout | One question per screen (Typeform-style) |
| Navigation | Next button, optional back button |
| Progress | Progress bar showing completion % |
| Mobile | Fully responsive |
| No auth required | Anonymous by default |
| Submission | Show end screen, save response |

#### 4.1.10 Google Sheets Integration
| Requirement | Details |
|-------------|---------|
| Connect | OAuth flow to grant Sheets access |
| Select sheet | Pick existing sheet or create new |
| Column mapping | Auto-create columns for each question |
| Response format | One row per response, timestamp included |
| Real-time | Write to sheet on submission (async ok) |
| Disconnect | Remove sheet connection |

#### 4.1.11 Response Viewing (In-App)
| Requirement | Details |
|-------------|---------|
| Response list | Table view of all responses |
| Columns | Timestamp, answers to each question |
| Export | Download as CSV |
| Delete | Delete individual responses |
| Count | Total response count on dashboard |

---

### 4.2 Monetization Features

#### 4.2.1 Free Tier Limits
| Limit | Value |
|-------|-------|
| Assessments | 3 |
| Responses per month | 50 |
| Branding | "Powered by FlowForm" watermark on respondent view |

#### 4.2.2 Pro Tier ($12/month)
| Feature | Details |
|---------|---------|
| Assessments | Unlimited |
| Responses | 1,000/month |
| Remove watermark | Yes |
| Custom colors | Primary color, background color |
| Custom thank-you | Redirect URL after submission |
| Close after X responses | Set max responses |
| Schedule open/close | Date-based availability |
| Basic scoring | Assign points to answers, show total score |

#### 4.2.3 Agency Tier ($39/month)
| Feature | Details |
|---------|---------|
| Everything in Pro | Yes |
| Responses | 10,000/month |
| Custom domain | CNAME setup for `forms.theirdomain.com` |
| Full white-label | No FlowForm branding anywhere |
| Password protection | Require password to access assessment |
| Email notifications | Get email on each submission |
| Multiple sheets | Different sheet per assessment |
| Priority support | 24-hour response time |

#### 4.2.4 Paywall UX
| Trigger | Behavior |
|---------|----------|
| Create 4th assessment | Show upgrade modal |
| 51st response in month | Stop collecting, show "limit reached" to creator |
| Access Pro feature | Show upgrade modal with feature highlight |

---

### 4.3 Settings & Account

#### 4.3.1 Account Settings
- View/edit display name
- View email (from Google, read-only)
- Delete account (with confirmation)

#### 4.3.2 Billing
- Current plan display
- Upgrade/downgrade buttons
- Stripe customer portal link
- Invoice history

#### 4.3.3 Connected Accounts
- Google Sheets connection status
- Disconnect/reconnect option

---

## 5. Technical Architecture

### 5.1 Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router) |
| **Canvas Library** | React Flow (for node editor) |
| **Styling** | Tailwind CSS + CSS Variables |
| **UI Components** | shadcn/ui (Radix primitives) |
| **Animations** | Framer Motion (primary) |
| **Micro-interactions** | Framer Motion + CSS transitions |
| **Icons** | Lucide React (consistent, customizable) |
| **Fonts** | Inter (UI), JetBrains Mono (code) |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) / Docker Postgres (local) |
| **ORM** | Drizzle ORM (type-safe, lightweight) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **State Management** | Zustand (global) + React Query (server) |
| **Form Validation** | Zod + React Hook Form |
| **Payments** | Stripe |
| **Google Sheets** | Google Sheets API v4 |
| **Hosting** | Vercel |
| **Analytics** | PostHog (product analytics + session replay) |
| **Error Tracking** | Sentry |

### 5.1.1 UI/UX Specific Dependencies
```json
{
  "dependencies": {
    "framer-motion": "^11.x",      // Animations
    "@radix-ui/react-*": "latest", // Accessible primitives (via shadcn)
    "lucide-react": "^0.x",        // Icons
    "class-variance-authority": "^0.x", // Component variants
    "tailwind-merge": "^2.x",      // Class merging
    "clsx": "^2.x",                // Conditional classes
    "@fontsource/inter": "^5.x",   // Inter font
    "sonner": "^1.x",              // Toast notifications
    "cmdk": "^0.x",                // Command palette (future)
    "react-hot-toast": "^2.x"      // Lightweight toasts (alternative)
  }
}
```

### 5.1.2 Architecture Principle: Database Agnostic
```
Local Development:  Docker Postgres (instant, offline)
Staging/Production: Supabase (managed, scalable)

Switch via: DATABASE_URL environment variable
All queries go through: Repository pattern (abstraction layer)
```

### 5.2 Data Models

#### 5.2.1 User
```typescript
interface User {
  id: string;                    // UUID
  email: string;
  name: string;
  avatar_url: string | null;
  google_sheets_token: string | null;  // Encrypted
  stripe_customer_id: string | null;
  plan: 'free' | 'pro' | 'agency';
  plan_expires_at: Date | null;
  response_count_this_month: number;
  response_count_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}
```

#### 5.2.2 Assessment
```typescript
interface Assessment {
  id: string;                    // UUID (used in public URL)
  user_id: string;               // Foreign key to User
  title: string;
  description: string | null;
  status: 'draft' | 'published' | 'closed';

  // Canvas data (stored as JSON)
  nodes: Node[];
  edges: Edge[];

  // Settings
  settings: {
    primary_color: string;
    background_color: string;
    show_progress_bar: boolean;
    allow_back_navigation: boolean;
    redirect_url: string | null;
    redirect_delay_seconds: number;
    max_responses: number | null;
    open_at: Date | null;
    close_at: Date | null;
    password: string | null;       // Hashed
    scoring_enabled: boolean;
  };

  // Google Sheets
  google_sheet_id: string | null;
  google_sheet_name: string | null;

  // Stats
  response_count: number;

  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}
```

#### 5.2.3 Node (Question)
```typescript
interface Node {
  id: string;
  type: 'start' | 'question' | 'end';
  position: { x: number; y: number };
  data: StartNodeData | QuestionNodeData | EndNodeData;
}

interface StartNodeData {
  title: string;
  description: string;
  button_text: string;
}

interface QuestionNodeData {
  question_type: 'multiple_choice_single' | 'multiple_choice_multi' |
                 'short_text' | 'long_text' | 'rating' | 'yes_no';
  question_text: string;
  description: string | null;
  required: boolean;
  options?: QuestionOption[];      // For multiple choice
  min_value?: number;              // For rating
  max_value?: number;              // For rating
  min_label?: string;              // For rating
  max_label?: string;              // For rating
  placeholder?: string;            // For text
  max_length?: number;             // For text
  min_selections?: number;         // For multi-select
  max_selections?: number;         // For multi-select
  points?: number;                 // For scoring
  correct_answer?: string | string[];  // For scoring
}

interface QuestionOption {
  id: string;
  text: string;
  points?: number;                 // For scoring
}

interface EndNodeData {
  title: string;
  description: string;
  show_score: boolean;
  redirect_url: string | null;
}
```

#### 5.2.4 Edge (Connection)
```typescript
interface Edge {
  id: string;
  source: string;                  // Node ID
  target: string;                  // Node ID
  source_handle: string | null;    // For multiple outputs
  condition: EdgeCondition | null;
}

interface EdgeCondition {
  type: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
  option_id?: string;              // For multiple choice
}
```

#### 5.2.5 Response
```typescript
interface Response {
  id: string;
  assessment_id: string;
  answers: Answer[];
  score: number | null;
  started_at: Date;
  submitted_at: Date;
  metadata: {
    user_agent: string;
    ip_country: string | null;     // From Vercel headers
  };
}

interface Answer {
  node_id: string;
  question_text: string;           // Denormalized for sheet export
  value: string | string[] | number;
}
```

### 5.3 API Endpoints

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/callback` | OAuth callback |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |

#### Assessments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List user's assessments |
| POST | `/api/assessments` | Create new assessment |
| GET | `/api/assessments/:id` | Get assessment details |
| PUT | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Delete assessment |
| POST | `/api/assessments/:id/publish` | Publish assessment |
| POST | `/api/assessments/:id/unpublish` | Unpublish assessment |
| POST | `/api/assessments/:id/duplicate` | Duplicate assessment |

#### Public (Respondent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/:id` | Get published assessment |
| POST | `/api/public/:id/submit` | Submit response |

#### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments/:id/responses` | List responses |
| GET | `/api/assessments/:id/responses/export` | Export as CSV |
| DELETE | `/api/assessments/:id/responses/:rid` | Delete response |

#### Google Sheets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sheets/connect` | Initiate Sheets OAuth |
| GET | `/api/sheets/callback` | OAuth callback |
| GET | `/api/sheets/list` | List user's sheets |
| POST | `/api/sheets/create` | Create new sheet |
| POST | `/api/assessments/:id/sheets/connect` | Connect sheet to assessment |
| DELETE | `/api/assessments/:id/sheets/disconnect` | Disconnect sheet |

#### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Get Stripe customer portal URL |
| POST | `/api/billing/webhook` | Stripe webhook handler |

### 5.4 Page Routes

```
/                           Landing page (public)
/pricing                    Pricing page (public)
/login                      Login page (public)
/f/:id                      Assessment respondent view (public)

/dashboard                  Assessment list (auth required)
/dashboard/new              Create new assessment (auth required)
/dashboard/:id/edit         Canvas editor (auth required)
/dashboard/:id/responses    Response list (auth required)
/dashboard/:id/settings     Assessment settings (auth required)

/settings                   Account settings (auth required)
/settings/billing           Billing settings (auth required)
```

---

## 6. User Flows

### 6.1 New User Onboarding
```
1. User lands on homepage
2. Clicks "Get Started Free"
3. Redirected to Google OAuth
4. Grants permission
5. Redirected to /dashboard
6. Sees empty state with "Create your first assessment" CTA
7. Clicks CTA
8. Canvas editor opens with Start and End nodes pre-placed
9. User adds questions, connects nodes
10. Clicks Preview to test
11. Clicks Publish
12. Prompted to connect Google Sheets (optional, can skip)
13. Gets shareable link
14. Copies link, shares with respondents
```

### 6.2 Respondent Flow
```
1. Clicks assessment link
2. Sees welcome screen (Start node)
3. Clicks "Start"
4. Sees first question
5. Answers, clicks "Next"
6. Continues through flow (branching happens automatically)
7. Reaches End node
8. Sees thank you message (and score if enabled)
9. Optional: Redirected to custom URL
```

### 6.3 Connect Google Sheets
```
1. User clicks "Connect Google Sheets" in assessment settings
2. Redirected to Google OAuth (Sheets scope)
3. Grants permission
4. Redirected back to app
5. Sees list of their sheets
6. Selects existing sheet OR clicks "Create new"
7. If new: enters sheet name, sheet is created
8. Columns auto-created based on questions
9. Future responses write to this sheet
```

### 6.4 Upgrade Flow
```
1. User hits free tier limit (e.g., creates 4th assessment)
2. Modal appears: "Upgrade to Pro to create unlimited assessments"
3. Shows plan comparison
4. User clicks "Upgrade to Pro"
5. Redirected to Stripe Checkout
6. Completes payment
7. Redirected back to app
8. Plan updated, limit removed
9. User continues action (e.g., assessment is created)
```

---

## 7. UI/UX Specifications (Our MSP - Main Selling Point)

> **UI/UX is not an afterthought - it's our core differentiator.**
> FlowForm should feel like a premium, $1000/year enterprise tool that happens to be affordable.
> Every interaction should feel intentional, polished, and delightful.

### 7.1 Design Philosophy

#### The "Premium Feel" Checklist
Every screen must pass this test:
- [ ] Would a designer at Linear/Figma/Notion approve this?
- [ ] Does it feel faster than it actually is? (perceived performance)
- [ ] Is there unnecessary visual noise?
- [ ] Does every animation serve a purpose?
- [ ] Would a user screenshot this to show someone?

#### Core Principles
1. **Buttery smooth** - 60fps animations, no jank, instant feedback
2. **Intentional motion** - Every animation tells a story (entering, exiting, connecting)
3. **Generous whitespace** - Let elements breathe, avoid cramped layouts
4. **Subtle depth** - Use shadows, layers, and elevation purposefully
5. **Delightful details** - Micro-interactions that make users smile
6. **Consistent rhythm** - 4px/8px grid, consistent spacing scale
7. **Dark mode ready** - Design system supports both themes from day one

### 7.2 Animation & Motion System

#### Animation Principles
```
Timing:     Use ease-out for entering, ease-in for exiting
Duration:   Micro (50-100ms), Standard (150-300ms), Emphasis (300-500ms)
Purpose:    Guide attention, provide feedback, create continuity
Rule:       If you can't explain why it animates, remove it
```

#### Required Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| **Page transitions** | Fade + slight slide up | 200ms | ease-out |
| **Modal open** | Scale from 0.95 + fade | 200ms | spring(1, 80, 10) |
| **Modal close** | Scale to 0.95 + fade | 150ms | ease-in |
| **Dropdown open** | Scale Y from top + fade | 150ms | ease-out |
| **Toast notification** | Slide in from right + fade | 250ms | spring |
| **Button press** | Scale to 0.97 | 100ms | ease-out |
| **Button release** | Scale to 1.0 | 100ms | spring |
| **Card hover** | Subtle lift (translateY -2px) + shadow increase | 200ms | ease-out |
| **Skeleton loading** | Shimmer gradient animation | 1.5s | linear loop |
| **Success checkmark** | Draw SVG path + scale bounce | 400ms | spring |
| **Error shake** | Horizontal shake (3 oscillations) | 300ms | ease-out |

#### Canvas-Specific Animations

| Element | Animation | Details |
|---------|-----------|---------|
| **Node appear** | Scale from 0.8 + fade + slight bounce | When dragged from sidebar |
| **Node delete** | Scale to 0.8 + fade + slight drift up | With particles/confetti optional |
| **Connection draw** | Animated dash pattern while dragging | Like drawing a line |
| **Connection complete** | Quick pulse/glow on the line | Confirms connection made |
| **Node select** | Ring animation + subtle scale | Clear selection state |
| **Pan/zoom** | Momentum-based with deceleration | Feels like touching glass |
| **Auto-layout** | Smooth interpolation to new positions | When reorganizing nodes |

#### Respondent View Animations

| Element | Animation | Purpose |
|---------|-----------|---------|
| **Question enter** | Slide up + fade (staggered children) | Focus attention |
| **Question exit** | Slide left + fade | Moving forward feeling |
| **Option hover** | Border color transition + slight scale | Affordance |
| **Option select** | Check icon draw + background fill | Confirmation |
| **Progress bar** | Smooth width transition | Show advancement |
| **Submit button** | Loading spinner → checkmark morph | Success feedback |
| **Score reveal** | Count up animation + confetti | Celebration moment |

### 7.3 Micro-Interactions Catalog

#### Buttons
```
Idle:       Solid color, subtle shadow
Hover:      Slight lift, increased shadow, color shift
Active:     Press down (scale 0.97), shadow decrease
Loading:    Spinner replaces text, disabled state
Success:    Green flash, checkmark icon briefly
```

#### Form Inputs
```
Idle:       Light border, no shadow
Focus:      Primary color ring (2px), subtle shadow
Error:      Red border, shake animation, error message fade in
Success:    Green checkmark icon appears inside
Typing:     Subtle cursor blink, character count updates
```

#### Cards (Assessment Cards)
```
Idle:       Light shadow, rounded corners (12px)
Hover:      Lift up 2px, shadow expands, slight scale (1.01)
Click:      Quick press feedback (scale 0.99)
Drag:       Larger shadow, slight rotation, ghost trail
Drop:       Bounce into place
```

#### Toggle Switches
```
Off → On:   Knob slides with spring physics, track color fills
On → Off:   Knob slides back, track color drains
```

#### Tooltips
```
Appear:     Fade + scale from 0.95, slight delay (200ms)
Dismiss:    Fade out quickly (100ms)
Position:   Smart positioning, never cut off
```

### 7.4 Loading States (Critical for Perceived Performance)

#### Skeleton Screens (Preferred over Spinners)
```tsx
// Every list, card, and content area should have a skeleton
<Skeleton className="h-4 w-3/4" />  // Text line
<Skeleton className="h-10 w-full" /> // Input field
<Skeleton className="h-32 w-full rounded-xl" /> // Card

// Skeleton animation: shimmer gradient moving left to right
// Duration: 1.5s, infinite loop
// Gradient: transparent → 10% white → transparent
```

#### Loading Hierarchy
1. **Instant (0-100ms)**: No loading indicator needed
2. **Brief (100-300ms)**: Subtle opacity reduction or skeleton
3. **Short (300ms-1s)**: Skeleton screen
4. **Long (1s+)**: Skeleton + progress indicator or message

#### Optimistic Updates
- When user creates/edits, update UI immediately
- Show subtle "Saving..." indicator
- Roll back only if server fails (rare)

### 7.5 Empty States (Opportunity for Delight)

#### Dashboard Empty State
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────────┐                      │
│                    │   [Illustration] │                     │
│                    │   (abstract art  │                     │
│                    │    or 3D icon)   │                     │
│                    └─────────────────┘                      │
│                                                             │
│              Create your first assessment                   │
│                                                             │
│    Start building beautiful, branching surveys in minutes   │
│                                                             │
│              [ + Create Assessment ]  (primary button)      │
│                                                             │
│         or  [Watch a 2-minute tutorial] (text link)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### No Responses Yet
```
Illustration: Empty inbox / waiting character
Title: "Waiting for responses..."
Subtitle: "Share your assessment link to start collecting data"
CTA: [Copy Link] [Preview Assessment]
```

#### Search No Results
```
Illustration: Magnifying glass with question mark
Title: "No assessments found"
Subtitle: "Try a different search term"
CTA: [Clear Search]
```

### 7.6 Color System (Extended)

#### Light Mode
```css
/* Backgrounds */
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;
--bg-tertiary: #F3F4F6;
--bg-elevated: #FFFFFF;

/* Borders */
--border-light: #E5E7EB;
--border-medium: #D1D5DB;
--border-focus: #6366F1;

/* Text */
--text-primary: #111827;
--text-secondary: #4B5563;
--text-tertiary: #9CA3AF;
--text-inverse: #FFFFFF;

/* Brand */
--primary-50: #EEF2FF;
--primary-100: #E0E7FF;
--primary-500: #6366F1;
--primary-600: #4F46E5;
--primary-700: #4338CA;

/* Semantic */
--success-50: #ECFDF5;
--success-500: #10B981;
--success-600: #059669;

--error-50: #FEF2F2;
--error-500: #EF4444;
--error-600: #DC2626;

--warning-50: #FFFBEB;
--warning-500: #F59E0B;
--warning-600: #D97706;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-glow: 0 0 20px rgb(99 102 241 / 0.3);
```

#### Dark Mode (Design for it now, implement later)
```css
--bg-primary: #0F0F0F;
--bg-secondary: #171717;
--bg-tertiary: #262626;
--bg-elevated: #1F1F1F;

--border-light: #262626;
--border-medium: #404040;

--text-primary: #FAFAFA;
--text-secondary: #A3A3A3;
--text-tertiary: #737373;
```

### 7.7 Typography Scale

```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes (with line heights) */
--text-xs: 0.75rem / 1rem;      /* 12px - Labels, captions */
--text-sm: 0.875rem / 1.25rem;  /* 14px - Secondary text, buttons */
--text-base: 1rem / 1.5rem;     /* 16px - Body text */
--text-lg: 1.125rem / 1.75rem;  /* 18px - Emphasized body */
--text-xl: 1.25rem / 1.75rem;   /* 20px - Card titles */
--text-2xl: 1.5rem / 2rem;      /* 24px - Section headers */
--text-3xl: 1.875rem / 2.25rem; /* 30px - Page titles */
--text-4xl: 2.25rem / 2.5rem;   /* 36px - Hero headlines */
--text-5xl: 3rem / 1;           /* 48px - Landing page hero */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Letter Spacing */
--tracking-tight: -0.025em;  /* Headlines */
--tracking-normal: 0;        /* Body */
--tracking-wide: 0.025em;    /* All caps labels */
```

### 7.8 Spacing Scale (8px Grid)

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 7.9 Component Specifications

#### Primary Button
```
Height:        40px (default), 36px (small), 48px (large)
Padding:       12px 20px
Border Radius: 8px
Font:          14px, semibold
Shadow:        shadow-sm (idle), shadow-md (hover)
Transition:    all 150ms ease-out

States:
- Idle: Primary color background, white text
- Hover: Darker shade, lift effect, larger shadow
- Active: Even darker, pressed down, smaller shadow
- Disabled: 50% opacity, no pointer events
- Loading: Spinner centered, text hidden
```

#### Input Field
```
Height:        44px
Padding:       12px 16px
Border:        1px solid border-light
Border Radius: 8px
Font:          16px (prevents iOS zoom)
Shadow:        none (idle), shadow-sm + ring (focus)

States:
- Idle: Light border
- Hover: Medium border
- Focus: Primary border + primary ring (2px) + shadow
- Error: Error border + error ring + shake
- Disabled: Muted background, 50% opacity
```

#### Card
```
Padding:       24px
Border Radius: 16px
Border:        1px solid border-light
Shadow:        shadow-sm (idle), shadow-lg (hover)
Background:    bg-primary

Hover Effect:  transform: translateY(-2px)
Transition:    all 200ms ease-out
```

#### Modal
```
Width:         min(90vw, 500px)
Padding:       32px
Border Radius: 20px
Shadow:        shadow-xl
Background:    bg-primary
Backdrop:      bg-black/50 with blur(4px)

Animation:
- Backdrop: fade in 200ms
- Modal: scale from 0.95, fade in, spring physics
```

### 7.10 Canvas Editor Specific Design

#### Node Design
```
Default Node:
- Size: 280px × auto (min 100px)
- Border Radius: 16px
- Border: 2px solid (changes based on type)
- Shadow: shadow-md
- Header: Type icon + label, colored based on type
- Body: Question preview, truncated

Node Colors:
- Start: Green gradient header (#10B981 → #059669)
- Question: Blue gradient header (#3B82F6 → #2563EB)
- End: Purple gradient header (#8B5CF6 → #7C3AED)

Selection State:
- Ring: 3px primary color
- Shadow: shadow-glow
- Subtle pulse animation
```

#### Connection Lines
```
Style:         Bezier curves, not straight lines
Stroke:        2px, gray-400 (idle), primary (selected)
Animated:      Dashed animation while dragging
Arrow:         Small arrow at target end
Label:         Condition badge on line if conditional

Hover:         Stroke becomes primary, slight glow
```

#### Sidebar (Question Palette)
```
Width:         280px
Background:    bg-secondary
Border Right:  1px solid border-light

Draggable Items:
- Rounded rectangles with icon + label
- Hover: lift + shadow
- Drag: ghost follows cursor, original fades
```

### 7.11 Respondent View Design

#### Layout Philosophy
```
Center-stage question - nothing else competes for attention
Maximum width: 600px (optimal reading width)
Vertical centering on desktop
Generous padding on all sides
```

#### Question Card (Respondent)
```
Background:    Transparent or very subtle
Typography:    text-2xl for question, relaxed line height
Options:       Full-width cards, generous padding
Spacing:       24px between options

Option Card:
- Height: auto (min 56px)
- Border: 2px solid border-light
- Border Radius: 12px
- Hover: primary border, subtle background
- Selected: primary background (light), checkmark icon
```

#### Progress Indicator
```
Option 1: Thin bar at very top (3px height)
Option 2: Step dots (○ ○ ● ○ ○)
Option 3: "Question 3 of 7" text

Animation: Smooth width/position transition
```

#### Transitions Between Questions
```
Exit:  Current question slides left + fades (200ms)
Enter: New question slides up + fades in (200ms, slight delay)
       Staggered: title first, then options
```

### 7.12 Sound Design (Optional Enhancement)

Consider subtle audio feedback for:
- Button clicks (soft pop)
- Success actions (pleasant chime)
- Error (subtle thud)
- Question transitions (whoosh)

**Rule:** Off by default, user can enable. Never jarring.

### 7.13 Accessibility Requirements

#### Keyboard Navigation
- All interactive elements focusable
- Visible focus rings (primary color)
- Logical tab order
- Escape closes modals
- Enter/Space activates buttons

#### Screen Readers
- Proper ARIA labels on all elements
- Live regions for dynamic updates
- Meaningful alt text
- Heading hierarchy (h1 → h2 → h3)

#### Color & Contrast
- Minimum 4.5:1 contrast for text
- Don't rely on color alone
- Focus indicators visible in all themes

#### Motion
- Respect prefers-reduced-motion
- Provide static alternatives
- No flashing/strobing content

### 7.14 Inspiration & References

Study these products for UI/UX patterns:

| Product | What to Learn |
|---------|---------------|
| **Linear** | Keyboard shortcuts, smooth animations, dark mode |
| **Notion** | Canvas feel, block editor, empty states |
| **Figma** | Canvas interactions, multi-select, zoom behavior |
| **Typeform** | Respondent experience, one-question-at-a-time |
| **Framer** | Motion design, component hover states |
| **Stripe** | Form design, loading states, error handling |
| **Vercel** | Dashboard layout, deployment states |
| **Raycast** | Command palette, keyboard-first design |

### 7.15 Quality Checklist (Before Shipping Any Screen)

- [ ] Works on 320px mobile viewport
- [ ] Works on 2560px+ desktop viewport
- [ ] All loading states have skeletons
- [ ] All empty states have illustrations
- [ ] All errors have helpful messages
- [ ] All buttons have hover/active states
- [ ] All focus states are visible
- [ ] No layout shifts after loading
- [ ] Animations are smooth (60fps)
- [ ] Dark mode looks intentional (not inverted)

### 7.2 Canvas Editor Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                          [Preview][Publish]│
│ │ ← │  Assessment Title (editable)                              │
│ └─────┘                                                         │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┐                                                    │
│ │ Questions│                                                    │
│ │ ────────│                                                    │
│ │ [MC]     │     ┌─────────────────────────────────────────┐   │
│ │ [Text]   │     │                                         │   │
│ │ [Rating] │     │              CANVAS AREA                │   │
│ │ [Yes/No] │     │                                         │   │
│ │          │     │    (nodes, connections, zoom/pan)       │   │
│ │ ────────│     │                                         │   │
│ │ [+ End]  │     │                                         │   │
│ └──────────┘     └─────────────────────────────────────────┘   │
│                                                                 │
│                  [Zoom -] [100%] [Zoom +]  [Fit]               │
└─────────────────────────────────────────────────────────────────┘

Side Panel (when node selected):
┌──────────────────────────────────────────────────────────────────┐
│ Question Settings                                          [X]  │
├──────────────────────────────────────────────────────────────────┤
│ Type: [Multiple Choice ▼]                                       │
│                                                                  │
│ Question Text:                                                   │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ What is your experience level?                               ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Options:                                                         │
│ ┌────────────────────────────────────────────────────┐ [Delete] │
│ │ Beginner                                           │          │
│ └────────────────────────────────────────────────────┘          │
│ ┌────────────────────────────────────────────────────┐ [Delete] │
│ │ Intermediate                                       │          │
│ └────────────────────────────────────────────────────┘          │
│ ┌────────────────────────────────────────────────────┐ [Delete] │
│ │ Expert                                             │          │
│ └────────────────────────────────────────────────────┘          │
│ [+ Add Option]                                                   │
│                                                                  │
│ ☑ Required                                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Respondent View Layout
```
┌─────────────────────────────────────────┐
│ ████████████░░░░░░░░░░░░  40%          │  <- Progress bar
├─────────────────────────────────────────┤
│                                         │
│                                         │
│   What is your experience level?        │
│                                         │
│   ┌─────────────────────────────────┐   │
│   │  ○  Beginner                    │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  ○  Intermediate                │   │
│   └─────────────────────────────────┘   │
│   ┌─────────────────────────────────┐   │
│   │  ○  Expert                      │   │
│   └─────────────────────────────────┘   │
│                                         │
│                                         │
│              [Next →]                   │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│         Powered by FlowForm             │  <- Watermark (free tier)
└─────────────────────────────────────────┘
```

### 7.4 Color Palette (Default)
```
Primary:        #6366F1 (Indigo)
Primary Hover:  #4F46E5
Background:     #FFFFFF
Surface:        #F9FAFB
Border:         #E5E7EB
Text Primary:   #111827
Text Secondary: #6B7280
Success:        #10B981
Error:          #EF4444
Warning:        #F59E0B
```

---

## 8. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Next.js, Supabase, Tailwind)
- [ ] Database schema and migrations
- [ ] Google OAuth authentication
- [ ] Basic dashboard UI (list, create, delete assessments)
- [ ] Canvas editor foundation with React Flow
- [ ] Start and End node implementation

### Phase 2: Core Editor (Week 3)
- [ ] All 6 question types
- [ ] Node editing side panel
- [ ] Connections between nodes
- [ ] Branching logic (conditions on edges)
- [ ] Auto-save functionality
- [ ] Preview mode

### Phase 3: Response Collection (Week 4)
- [ ] Public assessment view (/f/:id)
- [ ] Respondent flow (one question at a time)
- [ ] Response submission and storage
- [ ] In-app response viewing
- [ ] CSV export

### Phase 4: Google Sheets (Week 5)
- [ ] Google Sheets OAuth integration
- [ ] Sheet selection/creation
- [ ] Auto-column creation
- [ ] Write responses to sheet on submission

### Phase 5: Monetization & Polish (Week 6)
- [ ] Stripe integration
- [ ] Free tier limits enforcement
- [ ] Pro tier features (colors, scheduling, scoring)
- [ ] Landing page
- [ ] Pricing page
- [ ] Bug fixes and polish

### Phase 6: Launch Prep (Week 6-7)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Documentation/Help pages
- [ ] Error tracking (Sentry)
- [ ] Analytics setup
- [ ] Product Hunt preparation

---

## 9. Launch Checklist

### Pre-Launch
- [ ] All MVP features working
- [ ] Mobile responsive (respondent view)
- [ ] Error handling and validation
- [ ] Loading states
- [ ] Empty states
- [ ] 3 example assessments created
- [ ] Landing page live
- [ ] Pricing page live
- [ ] Legal pages live
- [ ] Stripe in production mode
- [ ] Google OAuth in production mode
- [ ] Custom domain configured
- [ ] SSL working
- [ ] Analytics tracking
- [ ] Error monitoring

### Launch Day
- [ ] Submit to Product Hunt
- [ ] Post on IndieHackers
- [ ] Post on Twitter/X
- [ ] Post on relevant subreddits
- [ ] Share in relevant communities/Discords
- [ ] Email to personal network

### Post-Launch (Week 1)
- [ ] Monitor error logs
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Collect feature requests
- [ ] Thank early users personally

---

## 10. Future Roadmap (Post-MVP)

### Version 1.1
- Image choice question type
- Email and Number question types
- Response notifications (email)
- Basic analytics (completion rate, drop-off)

### Version 1.2
- Custom fonts
- Embed widget (iframe)
- Zapier integration
- Partial responses (save progress)

### Version 1.3
- Team workspaces
- Collaboration (multiple editors)
- Template library
- Duplicate from template

### Version 2.0
- Logic variables (store and reuse answers)
- Calculated fields
- Webhook on submission
- API access for pro users

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Sheets rate limits | High | Queue writes, batch if needed, warn users |
| Canvas performance with many nodes | Medium | Virtual rendering, limit to 100 nodes |
| Low conversion to paid | High | Focus on watermark removal as key upgrade trigger |
| Competition launches similar feature | Medium | Ship fast, build community, iterate on feedback |
| Google OAuth review delays | High | Submit for review early, have backup email auth |

---

## 12. Open Questions

1. **Branding:** Final product name? (FlowForm is placeholder)
2. **Domain:** What domain to use?
3. **Analytics:** Plausible vs PostHog vs something else?
4. **Support:** Email only or add chat widget?
5. **Freemium limits:** Are 3 assessments / 50 responses right?

---

## 13. Appendix

### A. Competitor Analysis

| Feature | Google Forms | Typeform | Tally | FlowForm |
|---------|--------------|----------|-------|----------|
| Visual flow builder | No | No | No | Yes |
| Branching logic | Basic | Yes | Yes | Yes (visual) |
| Free tier | Unlimited | 10 responses | Unlimited | 50 responses |
| Google Sheets | Native | Integration | Integration | Native |
| Custom branding | No | Paid | Paid | Paid |
| Pricing | Free | $25/mo | $29/mo | $12/mo |

### B. Keyboard Shortcuts (Editor)

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Delete / Backspace | Delete selected |
| Ctrl/Cmd + D | Duplicate selected |
| Ctrl/Cmd + A | Select all |
| Space + Drag | Pan canvas |
| Scroll | Zoom in/out |
| Escape | Deselect / Close panel |

### C. Response Data Format (Google Sheets)

| Timestamp | Q1: Experience Level | Q2: Skills | Q3: Goals | Score |
|-----------|---------------------|------------|-----------|-------|
| 2026-02-11 10:30:00 | Beginner | JavaScript, Python | Learn React | 7/10 |
| 2026-02-11 11:45:00 | Expert | Go, Rust | Build SaaS | 9/10 |

---

*End of PRD*

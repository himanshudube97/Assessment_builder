# FlowForm

Visual canvas-based assessment and survey builder.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Framer Motion
- **Canvas:** React Flow
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (local Docker or Supabase)
- **ORM:** Drizzle ORM
- **Auth:** Google OAuth, JWT sessions
- **Payments:** Stripe

## Architecture

```
src/
├── app/                    # Next.js App Router pages
├── domain/                 # Business logic (framework-agnostic)
│   ├── entities/          # Core business objects
│   ├── repositories/      # Repository interfaces
│   └── services/          # Domain services
├── infrastructure/        # External services implementation
│   ├── database/          # Drizzle schema, migrations, repos
│   ├── auth/              # Authentication logic
│   ├── sheets/            # Google Sheets integration
│   └── payments/          # Stripe integration
├── application/           # Use cases / application services
│   ├── use-cases/         # Application-specific operations
│   └── dto/               # Data transfer objects
├── presentation/          # UI layer
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── providers/         # Context providers
│   └── stores/            # Zustand stores
├── config/                # Environment & constants
├── lib/                   # Utilities
└── types/                 # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local database)
- npm or pnpm

### Setup

1. **Clone and install dependencies:**
   ```bash
   cd assess_app
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Start local database:**
   ```bash
   npm run db:start
   ```

4. **Run database migrations:**
   ```bash
   npm run db:push
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start local PostgreSQL container |
| `npm run db:stop` | Stop database container |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:generate` | Generate migration from schema changes |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema changes directly (dev only) |
| `npm run db:reset` | Reset database (delete all data) |

## Environment Variables

### Required for Local Development

```env
DATABASE_URL=postgresql://flowform:flowform_local_dev@localhost:5432/flowform
DB_PROVIDER=local
JWT_SECRET=your-secret-key-at-least-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Required for Production

```env
DATABASE_URL=postgresql://...@supabase.co:5432/postgres
DB_PROVIDER=supabase
JWT_SECRET=your-production-secret
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## Switching Databases

The app is designed to work with both local Docker Postgres and Supabase.

**Local Development:**
```env
DATABASE_URL=postgresql://flowform:flowform_local_dev@localhost:5432/flowform
DB_PROVIDER=local
```

**Production (Supabase):**
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
DB_PROVIDER=supabase
```

## Project Structure Principles

1. **Domain Layer** - Pure business logic, no framework dependencies
2. **Infrastructure Layer** - Database, external APIs implementations
3. **Application Layer** - Orchestrates domain + infrastructure
4. **Presentation Layer** - UI components, hooks, stores

This separation allows:
- Easy testing (mock repositories)
- Database switching (local ↔ Supabase)
- Future multi-tenancy support
- Clean dependency flow

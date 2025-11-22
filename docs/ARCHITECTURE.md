# Architecture Overview

## System Design

```mermaid
graph TB
    subgraph Client
        Browser[Browser/PWA]
        Mobile[Mobile Device]
    end

    subgraph Vercel
        NextJS[Next.js 16 App Router]
        API[API Routes]
        ServerActions[Server Actions]
        Cron[Cron Jobs]
    end

    subgraph Supabase
        Auth[Supabase Auth]
        DB[(PostgreSQL)]
        Storage[Storage Buckets]
        RLS[Row Level Security]
    end

    subgraph External
        Gemini[Google Gemini AI]
        OAuth[OAuth Providers]
    end

    Browser -->|HTTPS| NextJS
    Mobile -->|HTTPS| NextJS
    NextJS --> ServerActions
    NextJS --> API
    ServerActions --> Auth
    API --> Auth
    Auth --> RLS
    RLS --> DB
    API --> Storage
    Cron -->|Monday 8AM| API
    API -->|Weekly Analysis| Gemini
    Auth -->|Google Login| OAuth
```

## Tech Stack

### Frontend
- **Framework:** Next.js 16 App Router
- **Language:** TypeScript 5
- **UI:** React 19 + Tailwind CSS 4 + shadcn/ui
- **State:** React hooks + Zustand (minimal)
- **Forms:** React Hook Form + Zod validation

### Backend
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (email/OAuth)
- **Storage:** Supabase Storage (workout selfies)
- **Security:** Row-Level Security (RLS) policies
- **API:** Next.js API routes + Server Actions

### AI Services
- **Provider:** Google Gemini 2.0 Flash
- **Use Case:** Weekly workout analysis
- **Cost:** ~$0.01 per analysis
- **Scheduling:** Vercel Cron (Monday 8AM)

## Key Architectural Decisions

See [ADRs](adr/) for detailed decision rationale:
- [001: Weekly Analysis with Gemini AI](adr/001-weekly-analysis-ai-gemini.md)

## Database Schema

```mermaid
erDiagram
    PROFILES ||--o{ WORKOUTS : creates
    PROFILES ||--o{ GOALS : sets
    PROFILES ||--o{ BODY_MEASUREMENTS : records
    PROFILES ||--o{ WORKOUT_PLANS : generates
    PROFILES ||--o{ WEEKLY_ANALYSIS : receives

    WORKOUTS ||--o{ EXERCISES : contains
    WORKOUTS ||--o{ WORKOUT_SELFIES : has

    WORKOUT_PLANS ||--o{ WORKOUT_PLAN_SESSIONS : schedules
    WORKOUT_PLANS }o--|| GOALS : targets

    WORKOUT_PLAN_SESSIONS }o--|| WORKOUT_TEMPLATES : uses
    WORKOUT_PLAN_SESSIONS }o--o| WORKOUTS : completed_as

    PROFILES {
        uuid id PK
        text email
        text full_name
        text fitness_level
        text[] fitness_goals
        timestamptz deleted_at
    }

    WORKOUTS {
        uuid id PK
        uuid user_id FK
        text name
        date date
        int duration_minutes
        int effort_level
        timestamptz deleted_at
    }

    EXERCISES {
        uuid id PK
        uuid workout_id FK
        text name
        text exercise_type
        int sets
        int reps
        float weight
        timestamptz deleted_at
    }

    GOALS {
        uuid id PK
        uuid user_id FK
        text title
        float current_value
        float target_value
        date target_date
        bool achieved
        timestamptz deleted_at
    }

    BODY_MEASUREMENTS {
        uuid id PK
        uuid user_id FK
        timestamptz measured_at
        float weight
        float body_fat_percentage
        float muscle_mass
        timestamptz deleted_at
    }

    WORKOUT_PLANS {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        text name
        text status
        int weeks_duration
        date start_date
        timestamptz deleted_at
    }

    WORKOUT_PLAN_SESSIONS {
        uuid id PK
        uuid plan_id FK
        int week_number
        int day_of_week
        text workout_name
        text status
        uuid completed_workout_id FK
        timestamptz deleted_at
    }

    WEEKLY_ANALYSIS {
        uuid id PK
        uuid user_id FK
        date week_start_date
        text analysis_summary
        text[] key_achievements
        jsonb weekly_stats
        timestamptz viewed_at
        bool is_dismissed
        timestamptz deleted_at
    }
```

### Design Patterns
- **Soft Delete:** All tables use `deleted_at` timestamp
- **RLS:** All queries filtered by `auth.uid()`
- **Denormalization:** Stats stored in JSONB for performance
- **Indexing:** Composite indexes on `(user_id, date, deleted_at)`

## Security Model

### Authentication
- Supabase Auth with JWT tokens
- Cookie-based sessions (httpOnly, secure)
- OAuth providers: Google

### Authorization
- Row-Level Security on all tables
- Policies enforce `user_id = auth.uid()`
- API routes verify auth before processing

### Data Protection
- No PII in logs
- Encrypted at rest (Supabase default)
- HTTPS only in production

## Deployment

### Production (Vercel)
- **Build:** `yarn build` (Next.js static + server)
- **Env Vars:** Supabase keys, Gemini API key, CRON_SECRET
- **Cron Jobs:** Configured in `vercel.json`
- **CDN:** Automatic via Vercel Edge Network

### Database (Supabase)
- **Migrations:** Applied via `npx supabase db push`
- **Backups:** Daily automatic backups
- **Monitoring:** Supabase Dashboard

## Performance Considerations

### Frontend
- Server-side rendering for SEO
- Client-side navigation (App Router)
- Optimistic updates on mutations
- Image optimization (next/image)

### Backend
- Database connection pooling
- Indexed queries only
- JSONB for flexible data
- Caching via React Server Components

### AI
- Async job processing
- Batched user analysis
- Error handling per-user (fail gracefully)

## Monitoring

- Build logs: Vercel Dashboard
- Cron execution: Vercel Functions logs
- Database: Supabase Logs
- Errors: Console logs (consider Sentry for production)

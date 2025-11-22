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
        API[API Routes - 21 endpoints]
        ServerActions[Server Actions]
    end

    subgraph Supabase
        Auth[Supabase Auth]
        DB[(PostgreSQL - 11 tables)]
        Storage[Storage Buckets]
        RLS[Row Level Security]
    end

    subgraph External
        Gemini[Google Gemini 2.5 Pro]
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
    API -->|Workout Plans| Gemini
    API -->|Weekly Analysis| Gemini
    Auth -->|Google Login| OAuth
```

## Tech Stack

### Frontend
- **Framework:** Next.js 16.0.3 (App Router with Turbopack)
- **Language:** TypeScript 5
- **UI:** React 19.2.0 + Tailwind CSS 4 + shadcn/ui (Radix UI)
- **State:** React hooks + Zustand 5.0.8 (minimal)
- **Forms:** React Hook Form 7.66.0 + Zod 4.1.12 validation
- **Charts:** Recharts 3.4.1
- **Icons:** Lucide React 0.554.0
- **Date Utils:** date-fns 4.1.0
- **PWA:** @ducanh2912/next-pwa 10.2.9

### Backend
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (@supabase/ssr 0.7.0, email/OAuth)
- **Storage:** Supabase Storage (workout selfies, max 5MB)
- **Security:** Row-Level Security (RLS) policies on all tables
- **API:** Next.js API routes (21 endpoints) + Server Actions

### AI Services
- **Provider:** Google Gemini 2.5 Pro (@google/generative-ai 0.24.1)
- **Use Cases:**
  - AI-generated workout plans
  - Weekly workout analysis
- **Cost:** ~$0.01 per analysis
- **Trigger:** Manual + Auto-generation on dashboard visit

## Key Architectural Decisions

See [ADRs](adr/) for detailed decision rationale:
- [001: Weekly Analysis with Gemini AI](adr/001-weekly-analysis-ai-gemini.md)

## Database Schema

11 tables with full Row-Level Security (RLS) policies.

```mermaid
erDiagram
    PROFILES ||--o{ WORKOUTS : creates
    PROFILES ||--o{ GOALS : sets
    PROFILES ||--o{ BODY_MEASUREMENTS : records
    PROFILES ||--o{ WORKOUT_PLANS : generates
    PROFILES ||--o{ WEEKLY_WORKOUT_ANALYSIS : receives
    PROFILES ||--|| USER_WORKOUT_PREFERENCES : configures

    WORKOUTS ||--o{ EXERCISES : contains
    WORKOUTS ||--o{ WORKOUT_SELFIES : has

    WORKOUT_PLANS ||--o{ WORKOUT_PLAN_SESSIONS : schedules
    WORKOUT_PLANS }o--|| GOALS : targets
    WORKOUT_PLANS ||--o{ WORKOUT_PLAN_GENERATION_JOBS : tracks

    WORKOUT_PLAN_SESSIONS }o--o| WORKOUT_TEMPLATES : uses
    WORKOUT_PLAN_SESSIONS }o--o| WORKOUTS : completed_as

    PROFILES {
        uuid id PK
        text email
        text full_name
        date date_of_birth
        text gender
        float height_cm
        text fitness_level
        text[] fitness_goals
        text medical_conditions
        text injuries
        timestamptz deleted_at
    }

    WORKOUTS {
        uuid id PK
        uuid user_id FK
        text name
        text description
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
        text weight_unit
        int duration_minutes
        float distance
        float speed
        int calories
        timestamptz deleted_at
    }

    WORKOUT_SELFIES {
        uuid id PK
        uuid workout_id FK
        uuid user_id FK
        text file_path
        text file_name
        int file_size
        text mime_type
        text caption
        timestamptz taken_at
        timestamptz deleted_at
    }

    GOALS {
        uuid id PK
        uuid user_id FK
        text title
        text description
        float initial_value
        float current_value
        float target_value
        text unit
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
        float bone_mass
        float water_percentage
        float height
        float neck
        float shoulders
        float chest
        float waist
        float hips
        timestamptz deleted_at
    }

    WORKOUT_PLANS {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        text name
        text description
        text goal_type
        int weeks_duration
        int workouts_per_week
        int avg_workout_duration
        text status
        date start_date
        timestamptz started_at
        timestamptz completed_at
        timestamptz deleted_at
    }

    WORKOUT_PLAN_SESSIONS {
        uuid id PK
        uuid plan_id FK
        int week_number
        int day_of_week
        text day_name
        date actual_date
        int session_order
        uuid workout_template_id FK
        text workout_name
        text workout_type
        int estimated_duration
        jsonb exercises
        text[] muscle_groups
        text intensity_level
        text status
        uuid completed_workout_id FK
        timestamptz completed_at
        timestamptz skipped_at
        text skip_reason
        text notes
        timestamptz deleted_at
    }

    WORKOUT_TEMPLATES {
        uuid id PK
        uuid user_id FK
        text name
        text description
        jsonb exercises
        bool is_public
        text workout_type
        int estimated_duration
        text intensity_level
        text difficulty_level
        text[] equipment_needed
        text[] target_muscle_groups
        int times_used
        text[] tags
        timestamptz deleted_at
    }

    USER_WORKOUT_PREFERENCES {
        uuid id PK
        uuid user_id FK
        text[] liked_exercises
        text[] avoided_exercises
        text[] available_equipment
        bool gym_access
        jsonb gym_locations
        int preferred_duration
        int min_duration
        int max_duration
        text[] focus_areas
        text constraints
        text[] injuries
        int[] preferred_days
        int[] avoid_days
        text preferred_time_of_day
        text fitness_level
        timestamptz deleted_at
    }

    WORKOUT_PLAN_GENERATION_JOBS {
        uuid id PK
        uuid user_id FK
        text status
        uuid plan_id FK
        text error_message
        jsonb request_data
        jsonb ai_request_data
        jsonb ai_response_data
        timestamptz deleted_at
    }

    WEEKLY_WORKOUT_ANALYSIS {
        uuid id PK
        uuid user_id FK
        date week_start_date
        date week_end_date
        text analysis_summary
        text[] key_achievements
        text[] areas_for_improvement
        jsonb weekly_stats
        jsonb goal_progress
        jsonb measurements_comparison
        text[] recommendations
        text motivational_quote
        timestamptz generated_at
        timestamptz viewed_at
        bool is_dismissed
        timestamptz deleted_at
    }
```

### Design Patterns
- **Soft Delete:** All tables use `deleted_at` timestamp
- **RLS:** All queries filtered by `auth.uid()` with specific policies per table
- **Denormalization:** Stats stored in JSONB for performance (exercises in sessions, weekly_stats, goal_progress)
- **Indexing:** Composite indexes on `(user_id, date, deleted_at)` for optimal query performance
- **Unique Constraints:** `unique_user_week` on weekly_workout_analysis prevents duplicate analysis

### Table Highlights
- **workout_selfies**: Stores images in Supabase Storage bucket 'workout-selfies' (max 5MB per file)
- **workout_templates**: 10 public templates seeded (StrongLifts 5x5, PPL, HIIT, Core, etc.)
- **workout_plan_sessions**: Day-of-week based scheduling (0=Sunday, 6=Saturday) with actual_date
- **body_measurements**: 20+ metrics tracked (weight, body fat, muscle mass, circumferences, visceral fat, metabolic age)
- **user_workout_preferences**: Used by AI to personalize workout plan generation

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

## Application Features

### Core Features
1. **Dashboard** (`/dashboard`)
   - Weekly analysis display with AI insights
   - Workout statistics and streak tracking
   - Active workout plan overview
   - Recent workouts list

2. **Workout Tracking** (`/workouts`)
   - Log workouts with exercises (strength/cardio/functional)
   - Upload progress selfies (max 5MB per image)
   - Track effort level (1-6 scale)
   - View workout history

3. **Goals Management** (`/goals`)
   - Create goals with initial, current, target values
   - Track progress with visual indicators
   - Sync with workout plans

4. **Body Measurements** (`/measurements`)
   - Track 20+ body metrics
   - Time-series charts
   - Compare measurements over time

5. **AI Workout Plans** (`/workout-plans`)
   - Generate personalized plans (1-12 weeks, 1-7 workouts/week)
   - Based on goals, profile, workout history, preferences
   - Progressive overload built-in
   - Weekly schedule with day-specific sessions
   - Track completion status

6. **Workout Templates** (`/workout-plans/templates`)
   - 10 public templates (StrongLifts, PPL, HIIT, etc.)
   - Create custom templates
   - Reusable across plans

7. **Profile & Preferences** (`/profile`, `/workout-plans/preferences`)
   - Set fitness level, medical conditions, injuries
   - Configure workout preferences (equipment, duration, focus areas)
   - Customize days and intensity

8. **Weekly Analysis** (Auto-generated)
   - AI analyzes previous week's performance
   - Key achievements, areas for improvement, recommendations
   - Motivational quote
   - View/dismiss functionality

### API Endpoints (21 routes)
- **Auth:** `/api/auth/callback`
- **Workouts:** `/api/workouts` (GET, POST)
- **Goals:** `/api/goals` (GET, POST)
- **Workout Plans:** `/api/workout-plans`, `/api/workout-plans/[id]`, `/api/workout-plans/generate`, `/api/workout-plans/[id]/activate`, `/api/workout-plans/[id]/deactivate`
- **Sessions:** `/api/workout-plans/sessions/[id]`, `/api/workout-plans/sessions/[id]/details`, `/api/workout-plans/sessions/[id]/complete`, `/api/workout-plans/sessions/current-week`, `/api/workout-plans/[id]/week/[weekNumber]`
- **Templates:** `/api/workout-templates`
- **Weekly Analysis:** `/api/weekly-analysis/generate`, `/api/weekly-analysis/latest`, `/api/weekly-analysis/[id]/view`, `/api/weekly-analysis/[id]/dismiss`
- **Images:** `/api/images/[...path]` (Optimized image serving)
- **Jobs:** `/api/workout-plans/jobs/[id]`

## AI Integration Details

### Workout Plan Generation (`lib/workout-plans/ai-generator.ts`)
**Model:** Google Gemini 2.5 Pro
**Temperature:** 0.7 (balanced creativity)
**Max Tokens:** 16,000

**Inputs:**
- User profile (age, gender, height, fitness level, medical conditions, injuries)
- Latest body measurements (weight, body fat, muscle mass, BMI)
- Workout history with exercise-specific performance data
- User preferences (equipment, gym access, duration, focus areas, preferred days)
- Goal details (weight loss, muscle building, endurance, general fitness)
- Available workout templates

**Process:**
1. Analyze exercise history to recommend appropriate weights (baseline + 5-10% progressive overload)
2. Generate 1-12 week plans with 1-7 workouts per week
3. Smart scheduling: ensures rest days between intense sessions
4. Day-of-week based scheduling (0=Sunday through 6=Saturday)
5. 4-6 exercises per workout (quality over quantity)

**Output:** Structured JSON with weekly schedule, exercises (sets/reps/weights), intensity levels, rationale, progression strategy

### Weekly Analysis (`lib/weekly-analysis/ai-analyzer.ts`)
**Model:** Google Gemini 2.5 Pro
**Schedule:** Auto-trigger on dashboard visit if no analysis exists for current week

**Data Analyzed:**
- Weekly stats (workouts completed, duration, effort level, exercise types)
- Goal progress with percentage complete
- Body measurement changes (weight, body fat, muscle mass)
- Active workout plan status
- Recent workout details

**Output:**
- 2-3 paragraph comprehensive analysis summary
- Key achievements (3 items)
- Areas for improvement (2 items)
- Actionable recommendations (3 items)
- Personalized motivational quote (not generic)

**Week Detection:** Monday-Sunday weeks, analysis for current week only

## Deployment

### Production (Vercel)
- **Build:** `yarn build` (linting + Next.js build with Turbopack)
- **Build Skip Lint:** `yarn build:skip-lint` (faster builds)
- **Env Vars:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `GEMINI_API_KEY` (optional, for AI features)
- **CDN:** Automatic via Vercel Edge Network
- **PWA:** Disabled in development, enabled in production

### Database (Supabase)
- **Migrations:** Applied via `npx supabase db push`
- **Current Migrations:**
  - `000_consolidated_schema.sql` - Base schema
  - `001_add_plan_start_dates.sql` - Added start_date fields
  - `002_add_weekly_workout_analysis.sql` - Weekly analysis table
- **Backups:** Daily automatic backups
- **Monitoring:** Supabase Dashboard

## Performance Considerations

### Frontend
- **Server-side rendering** for SEO and initial page load
- **Client-side navigation** (Next.js App Router with prefetching)
- **Turbopack** for faster development builds
- **Image optimization** (next/image with WebP/AVIF, responsive sizes)
- **PWA caching** with aggressive front-end nav caching
- **React 19** with improved concurrency features

### Backend
- **Database connection pooling** via Supabase
- **Indexed queries** with composite indexes on (user_id, date, deleted_at)
- **JSONB for flexible data** (exercises, stats, preferences)
- **Caching** via React Server Components
- **10MB body size limit** for file uploads

### AI
- **Async job processing** via workout_plan_generation_jobs table
- **Auto-trigger** weekly analysis on dashboard visit (not scheduled cron)
- **Error handling** per-user (fail gracefully with error messages)
- **Cost optimization** (~$0.01 per analysis with Gemini 2.5 Pro)

### Storage
- **Supabase Storage** for workout selfies
- **5MB max file size** per image
- **Private bucket** with RLS policies
- **Signed URLs** for secure access

## Configuration Files

### `next.config.ts`
- Turbopack enabled
- React Strict Mode
- Server Actions body size limit: 10MB
- Image optimization: WebP/AVIF formats
- PWA configuration via @ducanh2912/next-pwa

### `package.json`
- Node.js >= 22.0.0 required
- Yarn >= 1.22.0
- Scripts: `dev`, `build`, `build:skip-lint`, `test`, `lint`, `api:docs`, `api:validate`

### `public/manifest.json`
- App name: "GoodHealth - Gym Tracker"
- Display: standalone (full-screen PWA)
- Orientation: portrait-primary
- Theme color: #000000

## Testing & CI/CD

### Testing
- **Framework:** Jest 30.2.0 with jsdom environment
- **Library:** Testing Library (React, DOM, User Events)
- **Coverage:** Tracked with Codecov
- **Commands:**
  - `yarn test` - Run tests
  - `yarn test:watch` - Watch mode
  - `yarn test:coverage` - Generate coverage report

### CI/CD Pipeline (`.github/workflows/ci.yml`)
- **Triggers:** Push/PR to main or develop branches
- **Jobs:**
  1. **Test:** Lint + Jest with coverage → Codecov upload
  2. **Build:** Next.js build with Supabase env vars
- **Node Version:** 24 (should align with package.json requirement >=22)
- **Badges:** CI status, Codecov, MIT License

## Monitoring & Logging

- **Build Logs:** Vercel Dashboard
- **Function Logs:** Vercel Functions logs
- **Database:** Supabase Logs and Dashboard
- **Errors:** Console logs (consider Sentry for production)
- **AI Responses:** Logged in workout_plan_generation_jobs (request_data, ai_response_data)

## Code Organization

### Directory Structure
```
/app                    # Next.js App Router pages
  /api                  # 21 API routes
  /dashboard            # Main dashboard
  /workouts             # Workout tracking
  /goals                # Goal management
  /measurements         # Body measurements
  /workout-plans        # Workout plans & templates
  /profile              # User profile
  /settings             # App settings
  /auth                 # Auth callbacks

/lib                    # Business logic (73+ exported functions)
  /auth                 # Authentication actions & hooks
  /workout-plans        # Plan generation, AI, sessions
  /weekly-analysis      # AI analyzer
  /goals                # Goal logic & sync
  /measurements         # Measurement actions
  /workouts             # Workout actions
  /profile              # Profile actions
  /selfies              # Selfie upload actions
  /data                 # Static data (gym equipment)

/components             # React components (24+)
/migrations             # Database migrations (3 files)
/public                 # Static assets, manifest.json
/docs                   # Documentation
  /api                  # OpenAPI spec
  /adr                  # Architecture Decision Records
```

### Key Files
- `lib/workout-plans/ai-generator.ts` - Gemini workout plan generation
- `lib/weekly-analysis/ai-analyzer.ts` - Gemini weekly analysis
- `lib/supabase/client.ts` - Supabase client setup
- `lib/supabase/server.ts` - Supabase server-side client
- `app/layout.tsx` - Root layout with auth
- `docs/api/openapi.yaml` - OpenAPI 3.1.0 specification (22 operationIds)

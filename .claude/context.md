# GoodHealth - Fitness Tracking App

## Project Overview
GoodHealth is a comprehensive fitness tracking Progressive Web App (PWA) built with Next.js 16, TypeScript, and Supabase. It allows users to log workouts, track progress, set fitness goals, and monitor their fitness journey with detailed analytics.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type safety
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI component library
- **Sonner** - Toast notifications
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling and validation

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email/Password + Google OAuth)
  - Row Level Security (RLS)
  - Real-time capabilities
- **Server Actions** - Next.js server-side data mutations

### PWA
- **@ducanh2912/next-pwa** - Progressive Web App functionality
- Service worker for offline support
- Installable on mobile devices

## Project Structure

```
goodhealth/
├── app/                          # Next.js App Router pages
│   ├── api/auth/callback/        # OAuth callback handler
│   ├── auth/auth-code-error/     # Auth error page
│   ├── dashboard/                # Main dashboard
│   ├── workouts/                 # Workout management
│   │   ├── [id]/                 # Workout detail view
│   │   └── new/                  # Create new workout
│   ├── goals/                    # Goal management
│   │   └── new/                  # Create new goal
│   ├── progress/                 # Progress tracking & analytics
│   ├── profile/                  # User profile management
│   ├── settings/                 # App settings
│   ├── login/                    # Sign in page
│   ├── signup/                   # Sign up page
│   ├── forgot-password/          # Password reset
│   └── debug/                    # Debug utilities
├── components/
│   ├── layout/                   # Layout components
│   │   └── navbar.tsx            # Main navigation
│   └── ui/                       # shadcn/ui components
│       ├── effort-selector.tsx   # Custom effort level selector
│       └── sonner.tsx            # Toast notifications
├── lib/
│   ├── auth/                     # Authentication
│   │   ├── actions.ts            # Auth server actions
│   │   └── hooks.ts              # Auth React hooks
│   ├── workouts/                 # Workout operations
│   │   └── actions.ts            # Workout CRUD actions
│   ├── goals/                    # Goal operations
│   │   └── actions.ts            # Goal CRUD actions
│   ├── data/                     # Static data
│   │   └── gym-equipment.ts      # 70+ gym equipment database
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   └── utils.ts                  # Utility functions
├── types/
│   ├── database.ts               # Supabase generated types
│   └── index.ts                  # Custom types
├── migrations/                   # Database migrations
│   ├── README.md                 # Migration instructions
│   ├── 001_initial_schema.sql    # Initial database schema
│   ├── 002_add_effort_level.sql  # Effort level feature
│   └── 003_add_exercise_types.sql # Exercise type detection
└── .github/workflows/            # GitHub Actions CI/CD
    ├── ci.yml                    # Continuous integration
    ├── deploy-preview.yml        # PR preview deployments
    └── deploy-production.yml     # Production deployment

```

## Key Features

### 1. Authentication
- **Email/Password** authentication
- **Google OAuth** sign-in
- Email verification
- Password reset functionality
- Protected routes with proxy (Next.js 16 middleware)
- Row Level Security policies

### 2. Workout Tracking
- **Smart Exercise Inputs** - Dynamically adapts based on exercise type:
  - **Cardio**: Duration, Distance, Speed, Calories, Resistance, Incline
  - **Strength**: Sets, Reps, Weight
  - **Functional**: Duration, Rounds, Reps
- **70+ Pre-defined Equipment** from major brands (Technogym, Life Fitness, etc.)
- **Exercise Categories**: Cardio, Chest, Back, Shoulders, Arms, Legs, Core, Free Weights, Functional
- **Effort Level Tracking** - Visual heatmap selector (1-6 scale)
- **Workout Details** - View complete exercise breakdowns
- **Custom Exercises** - Add your own exercises

### 3. Progress Tracking
- **Real-time Statistics Dashboard**:
  - This month's workout count
  - Total training time (hours & minutes)
  - Total exercises completed
  - Current workout streak calculation
- **Tabbed Interface**:
  - **Overview**: Monthly summary with total workouts, duration, and averages
  - **Workouts**: Complete workout history with clickable cards
  - **Strength**: Exercise-specific tracking (latest, max, avg weights)
  - **Goals**: Visual progress bars with percentage completion
- **Smart Data Display**:
  - Automatic grouping of exercises by name
  - Max weight and average weight calculations
  - Progress visualization with color-coded bars
  - Target date tracking

### 4. Goal Management
- Create fitness goals with targets
- Track current progress
- Set target dates
- Progress bars and achievement badges
- Goal types: Weight, Reps, Distance, Duration, etc.

### 5. Profile & Settings
- Edit profile information
- View account statistics
- Customize units (kg/lbs, km/miles)
- Notification preferences
- Privacy settings

### 6. UI/UX Features
- **Toast Notifications** - Success/error feedback for all actions
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** ready
- **Loading States** - Proper feedback during async operations
- **Empty States** - Helpful prompts when no data exists
- **Form Validation** - Client and server-side validation

## Database Schema

### Tables

**profiles**
- User profile information
- Linked to Supabase auth.users

**workouts**
- Workout sessions
- Fields: name, description, date, duration_minutes, effort_level
- User-scoped with RLS

**exercises**
- Individual exercises within workouts
- **Polymorphic fields** based on exercise_type:
  - Strength: sets, reps, weight
  - Cardio: duration_minutes, distance, speed, calories, resistance_level, incline
- User-scoped via workout relationship

**workout_templates**
- Reusable workout templates
- JSONB field for exercise list

**goals**
- Fitness goals
- Fields: title, description, target_value, current_value, unit, target_date, achieved
- User-scoped with RLS

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Server-side authentication checks
- Protected API routes

## Recent Major Updates

### 1. Smart Exercise Type Detection
- Automatic input field adaptation based on equipment selection
- Separate data models for cardio vs strength exercises
- Migration: `supabase-migration-exercise-types.sql`

### 2. Effort Level Tracking
- Visual heatmap-style effort selector
- 6 levels from "Very Easy" to "Maximum"
- Color-coded interface with emojis
- Migration: `supabase-migration-effort.sql`

### 3. Comprehensive Gym Equipment Database
- 68+ equipment items from major brands
- Categorized by muscle group and type
- Brand information (Technogym, Life Fitness, Hammer Strength, etc.)
- Exercise type metadata (cardio/strength/functional)

### 4. Workout Detail Views
- Click any workout to see full details
- Exercise-by-exercise breakdown
- Type-specific data display
- Effort level badges
- Fixed Next.js 16 async params handling

### 5. Toast Notifications
- Success confirmations for all save operations
- Error messages with details
- Auto-dismiss with smooth animations

### 6. Dashboard with Real Statistics
- Displays actual workout counts and totals
- Workout streak calculation
- Recent activity feed with clickable workout cards
- Monthly statistics aggregation

### 7. Progress Page Enhancements
- Overview tab: Real monthly/all-time statistics
- Workouts tab: Chronological workout history
- Strength tab: Per-exercise progress tracking
- Goals tab: Visual progress bars and achievement tracking

### 8. Homepage Routing
- Logged-in users redirected to dashboard
- Non-logged-in users see marketing landing page

### 9. Testing & CI/CD
- Jest + React Testing Library setup
- 26 unit tests (utilities, data, components)
- GitHub Actions workflows for CI
- Automated testing on push/PR
- Preview deployments for pull requests
- Production deployment pipeline

## Environment Variables

Required in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Migrations

All migrations are in the `migrations/` directory. Run in order in Supabase SQL Editor:

1. **Initial Schema**: `migrations/001_initial_schema.sql`
   - Creates all tables, RLS policies, triggers

2. **Effort Level**: `migrations/002_add_effort_level.sql`
   - Adds effort_level to workouts table

3. **Exercise Types**: `migrations/003_add_exercise_types.sql`
   - Adds exercise_type and cardio fields to exercises table
   - Makes sets column nullable

See `migrations/README.md` for detailed migration instructions.

## API Structure

### Authentication (`lib/auth/actions.ts`)
- `signUp()` - User registration
- `signIn()` - Email/password login
- `signInWithGoogle()` - OAuth login
- `signOut()` - Logout
- `getUser()` - Get current user
- `resetPassword()` - Password reset
- `updatePassword()` - Update password

### Workouts (`lib/workouts/actions.ts`)
- `createWorkout()` - Create workout with exercises
- `getWorkouts()` - Fetch all user workouts
- `deleteWorkout()` - Delete workout

### Goals (`lib/goals/actions.ts`)
- `createGoal()` - Create new goal
- `getGoals()` - Fetch all user goals
- `updateGoalProgress()` - Update goal progress
- `deleteGoal()` - Delete goal

## Development Workflow

### Running the App
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Adding New Features
1. Create server actions in `lib/[feature]/actions.ts`
2. Add UI components in `app/[feature]/`
3. Update database schema if needed (create migration)
4. Add types in `types/` if needed
5. Test with Supabase RLS policies

### Debugging
- Use `/debug` page to check user auth and database connection
- Check browser console for client-side errors
- Check terminal for server-side logs
- Inspect Supabase logs in dashboard

## Common Patterns

### Server Actions
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function myAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Your logic here

  revalidatePath('/your-path')
  return { success: true }
}
```

### Dynamic Pages
```typescript
export const dynamic = 'force-dynamic' // Prevent caching

export default async function Page() {
  // Server-side data fetching
  const user = await getUser()
  if (!user) redirect('/login')

  // Render UI
}
```

### Toast Notifications
```typescript
import { toast } from 'sonner'

// Success
toast.success('Title', { description: 'Details' })

// Error
toast.error('Title', { description: error.message })
```

## Testing

### Test Suite
- **Jest** + **React Testing Library**
- **26 passing tests** covering:
  - Utility functions (cn class merging)
  - Gym equipment data (68+ items)
  - UI components (Button variants)

### Test Commands
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
```

### Test Files
```
lib/__tests__/utils.test.ts              # Utility tests
lib/data/__tests__/gym-equipment.test.ts # Data tests
components/ui/__tests__/button.test.tsx  # Component tests
```

See `TESTING.md` for full testing guide.

## CI/CD Pipeline

### GitHub Actions Workflows

**1. CI Workflow** (`.github/workflows/ci.yml`)
- Runs on push/PR to main/develop
- Lints code with ESLint
- Runs test suite
- Generates coverage report
- Builds application
- Uploads coverage to Codecov

**2. Preview Deployments** (`.github/workflows/deploy-preview.yml`)
- Creates preview environment for PRs
- Posts preview URL in PR comments

**3. Production Deploy** (`.github/workflows/deploy-production.yml`)
- Auto-deploys to Vercel on push to main
- Runs tests before deployment

### Required GitHub Secrets
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_APP_URL
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
CODECOV_TOKEN (optional)
```

## Deployment

### Recommended: Vercel
**Why Vercel?**
- ✅ Built for Next.js (zero-config)
- ✅ Free tier with generous limits
- ✅ Automatic HTTPS and CDN
- ✅ Preview deployments for PRs
- ✅ Serverless functions support

**Quick Deploy:**
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy (~5 minutes)

### Why Not GitHub Pages?
- ❌ Static HTML only (no SSR)
- ❌ No API routes
- ❌ No server actions
- ❌ No backend functionality

### Alternative Providers
- **Netlify**: Good Next.js support, similar to Vercel
- **Railway**: Best for full-stack + database hosting
- **Render**: Free tier with cold starts
- **AWS Amplify**: Most powerful but complex setup

See `DEPLOYMENT.md` for complete deployment guide with step-by-step instructions.

### Post-Deployment Checklist
1. ✅ Update Supabase Auth redirect URLs
2. ✅ Configure Google OAuth redirect URIs
3. ✅ Test authentication flow
4. ✅ Verify PWA installation
5. ✅ Monitor error logs
6. ✅ Test workout/goal creation

## Known Issues & TODOs

### Current Limitations
- Workout templates not yet implemented (table exists)
- Profile updates don't save to Supabase (UI only)
- Settings don't persist (UI only)
- No workout edit functionality yet

### Future Enhancements
- [ ] Implement workout templates
- [ ] Add charts using recharts
- [ ] Profile/settings persistence
- [ ] Exercise history tracking
- [ ] Personal records (PRs)
- [ ] Social features (sharing)
- [ ] Export data functionality
- [ ] Import from other apps

## Contributing

When adding features:
1. Follow existing patterns
2. Use TypeScript strictly
3. Add server-side validation
4. Include loading states
5. Show toast notifications
6. Update RLS policies if needed
7. Test authentication flow
8. Update this context file

## Support

- Check SETUP.md for setup instructions
- Check README.md for project info
- Review Supabase logs for errors
- Use /debug page for troubleshooting

# GoodHealth - Fitness Tracking App

## Project Overview
GoodHealth is a comprehensive fitness tracking Progressive Web App (PWA) built with Next.js 16, TypeScript, and Supabase. It allows users to log workouts with smart exercise inputs, track body measurements over time with interactive charts, upload progress photos, set fitness goals, and monitor their fitness journey with detailed analytics.

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type safety
- **React 19** - UI library
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI component library
- **Recharts 3.4.1** - Interactive time-series charts
- **Sonner** - Toast notifications
- **React Hook Form + Zod** - Form handling and validation

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Email/Password + Google OAuth)
  - Row Level Security (RLS)
  - Supabase Storage for images
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
│   ├── api/
│   │   ├── auth/callback/        # OAuth callback handler
│   │   └── images/[...path]/     # Image serving proxy
│   ├── auth/auth-code-error/     # Auth error page
│   ├── dashboard/                # Main dashboard
│   ├── workouts/                 # Workout management
│   │   ├── [id]/                 # Workout detail view
│   │   │   └── edit/             # Edit workout
│   │   └── new/                  # Create new workout
│   ├── measurements/             # Body measurements tracking
│   │   └── new/                  # Add new measurement
│   ├── goals/                    # Goal management
│   │   ├── [id]/edit/            # Edit goal
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
│   │   └── navbar.tsx            # Main navigation (with Measurements link)
│   ├── ui/                       # shadcn/ui components
│   │   ├── effort-selector.tsx   # Custom effort level selector
│   │   ├── alert-dialog.tsx      # Confirmation dialogs
│   │   ├── tabs.tsx              # Tab navigation
│   │   └── sonner.tsx            # Toast notifications
│   ├── workout-edit-form.tsx     # Edit workout form with exercise management
│   ├── workout-actions.tsx       # Workout delete actions
│   ├── measurement-form.tsx      # Body measurement input form
│   ├── measurements-chart.tsx    # Time series charts for measurements
│   ├── measurements-list.tsx     # Measurement history with trends
│   ├── selfie-upload.tsx         # Progress photo upload
│   └── workout-selfie-display.tsx # Display uploaded photos
├── lib/
│   ├── auth/                     # Authentication
│   │   ├── actions.ts            # Auth server actions
│   │   └── hooks.ts              # Auth React hooks
│   ├── workouts/                 # Workout operations
│   │   └── actions.ts            # Workout CRUD actions (includes updateWorkout)
│   ├── measurements/             # Measurement operations
│   │   └── actions.ts            # Measurement CRUD actions
│   ├── goals/                    # Goal operations
│   │   ├── actions.ts            # Goal CRUD actions
│   │   └── calculate-initial-value.ts # Goal value calculations
│   ├── selfies/                  # Selfie operations
│   │   └── actions.ts            # Selfie upload/delete with storage
│   ├── data/                     # Static data
│   │   └── gym-equipment.ts      # 68+ gym equipment database with type detection
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
│   ├── 003_add_exercise_types.sql # Exercise type detection
│   ├── 004_add_workout_selfies.sql # Selfies table
│   ├── 004b_add_storage_policies.sql # Storage bucket policies
│   └── 005_add_body_measurements.sql # Body measurements table
├── __tests__/                    # Test files
│   ├── goals/                    # Goal calculation tests
│   └── workouts/                 # Workout logic tests
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
  - **Functional**: Sets, Reps (no weight field)
- **68+ Pre-defined Equipment** from major brands (Technogym, Life Fitness, etc.)
- **Exercise Categories**: Cardio, Chest, Back, Shoulders, Arms, Legs, Core, Free Weights, Functional
- **Auto-detection** - Exercise type automatically set when selecting predefined equipment
- **Manual override** - Users can change exercise type for custom exercises
- **Effort Level Tracking** - Visual heatmap selector (1-6 scale)
- **Full CRUD Operations**:
  - Create workouts with multiple exercises
  - View workout details with complete exercise breakdown
  - Edit workouts (add, remove, modify exercises)
  - Delete workouts with confirmation
- **Workout Selfies**:
  - Upload progress photos during/after workout
  - Multiple photos per workout
  - Secure storage in Supabase Storage
  - Delete capability with storage cleanup
  - Gallery view on workout details

### 3. Body Measurements Tracking
- **Comprehensive Tracking Form** (20+ metrics):
  - **Body Composition**: Weight, Height, Body Fat %, Muscle Mass, Bone Mass, Water %, Protein %
  - **Circumference**: Chest, Waist, Hips, Shoulders, Neck
  - **Arms**: Biceps (L/R), Forearms (L/R)
  - **Legs**: Thighs (L/R), Calves (L/R)
  - **Additional Metrics**: BMR, Metabolic Age, Visceral Fat
  - **Notes**: Optional text field
- **Time Series Visualization**:
  - Interactive line charts using Recharts
  - Metric selector dropdown (8 metrics available)
  - Statistics dashboard: Latest, Change, Change %, Average, Min-Max range
  - Responsive chart with tooltips
- **Health-Aware Trend Indicators**:
  - **Green** for positive changes:
    - Weight/Body Fat/Waist decreasing
    - Muscle Mass/Chest/Biceps increasing
  - **Red** for negative changes:
    - Weight/Body Fat/Waist increasing
    - Muscle Mass/Chest/Biceps decreasing
  - **Blue** for neutral metrics (Hips)
  - Visual arrows (↑↓→) with change values
- **Measurement History**:
  - Chronological list with latest badge
  - Comparison with previous measurement
  - Organized sections by body part
  - Delete capability with confirmation
- **Tabbed Interface**:
  - Progress Chart tab (default): Chart + 3 recent measurements
  - All Measurements tab: Complete history

### 4. Progress Tracking
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

### 5. Goal Management
- Create fitness goals with targets and deadlines
- Track current progress vs. target
- Visual progress bars with percentage completion
- Goal types: Weight, Reps, Distance, Duration, etc.
- Edit and delete goals
- Achievement badges when goals completed

### 6. Navigation
- **Main Navigation Links**:
  - Dashboard
  - Workouts
  - **Measurements** (new)
  - Progress
  - Goals
- User dropdown with Profile, Settings, Sign out
- Theme toggle (dark/light mode ready)
- Responsive mobile menu

### 7. UI/UX Features
- **Toast Notifications** - Success/error feedback for all actions
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** ready
- **Loading States** - Proper feedback during async operations
- **Empty States** - Helpful prompts when no data exists
- **Form Validation** - Client and server-side validation
- **Confirmation Dialogs** - AlertDialog for destructive actions
- **Image Optimization** - Efficient loading and display

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
  - Functional: sets, reps (no weight)
- User-scoped via workout relationship

**workout_selfies**
- Progress photos
- Fields: workout_id, image_path, created_at
- Stored in Supabase Storage bucket: `workout-selfies`
- RLS policies for secure access

**body_measurements**
- Comprehensive body tracking (20+ fields)
- Fields: measured_at, weight, height, body_fat_percentage, muscle_mass, bone_mass, water_percentage, protein_percentage, neck, shoulders, chest, waist, hips, bicep_left, bicep_right, forearm_left, forearm_right, thigh_left, thigh_right, calf_left, calf_right, bmr, metabolic_age, visceral_fat, notes
- User-scoped with RLS
- Ordered by measured_at for time series

**workout_templates**
- Reusable workout templates
- JSONB field for exercise list
- Not yet implemented in UI

**goals**
- Fitness goals
- Fields: title, description, target_value, current_value, unit, target_date, achieved
- User-scoped with RLS

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensure users can only access their own data
- Server-side authentication checks
- Protected API routes
- Secure image storage with RLS policies

## Recent Major Updates

### 1. Workout Editing (Full CRUD)
- Complete workout edit functionality
- Add, remove, and modify exercises in existing workouts
- Exercise type selector with dynamic field rendering
- Same smart inputs as new workout form
- Effort level updates
- Migration: `updateWorkout` action updated with all fields

### 2. Body Measurements Time Series
- Comprehensive measurement tracking form (20+ metrics)
- Interactive Recharts line graphs
- Health-aware color coding:
  - Green for positive health changes
  - Red for negative health changes
- Statistics dashboard (Latest, Change, %, Average, Range)
- Measurement history with trend indicators
- Delete measurements capability
- Migration: `005_add_body_measurements.sql`

### 3. Workout Selfies
- Upload progress photos during workouts
- Supabase Storage integration
- Secure image serving via API route
- Delete capability with storage cleanup
- Gallery view on workout details
- Migration: `004_add_workout_selfies.sql`, `004b_add_storage_policies.sql`

### 4. Smart Exercise Type Detection
- Automatic input field adaptation based on equipment selection
- Separate data models for cardio vs strength exercises
- Manual override capability
- Functional type (no weight field)
- Migration: `003_add_exercise_types.sql`

### 5. Effort Level Tracking
- Visual heatmap-style effort selector
- 6 levels from "Very Easy" to "Maximum"
- Color-coded interface with emojis
- Migration: `002_add_effort_level.sql`

### 6. Comprehensive Gym Equipment Database
- 68+ equipment items from major brands
- Categorized by muscle group and type
- Brand information (Technogym, Life Fitness, Hammer Strength, etc.)
- Exercise type metadata (cardio/strength/functional)
- Auto-detection support

### 7. Navigation Updates
- Added "Measurements" link to main navigation
- Positioned between Workouts and Progress
- Accessible from all authenticated pages

### 8. Testing & CI/CD
- Jest + React Testing Library setup
- 26+ unit tests (utilities, data, components)
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

1. **Initial Schema**: `001_initial_schema.sql` - Creates all base tables, RLS policies, triggers
2. **Effort Level**: `002_add_effort_level.sql` - Adds effort_level to workouts
3. **Exercise Types**: `003_add_exercise_types.sql` - Adds exercise_type and cardio fields, makes sets nullable
4. **Workout Selfies**: `004_add_workout_selfies.sql` - Creates workout_selfies table
5. **Storage Policies**: `004b_add_storage_policies.sql` - Sets up storage bucket and RLS
6. **Body Measurements**: `005_add_body_measurements.sql` - Creates body_measurements table with 20+ fields

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
- `getWorkoutById()` - Fetch single workout with exercises
- `updateWorkout()` - Update workout with exercises (full replace)
- `deleteWorkout()` - Delete workout and all exercises

### Measurements (`lib/measurements/actions.ts`)
- `createMeasurement()` - Create new body measurement
- `getMeasurements()` - Fetch all user measurements (ordered by date)
- `getLatestMeasurement()` - Fetch most recent measurement
- `updateMeasurement()` - Update existing measurement
- `deleteMeasurement()` - Delete measurement

### Selfies (`lib/selfies/actions.ts`)
- `uploadWorkoutSelfie()` - Upload image to storage and create record
- `getWorkoutSelfies()` - Fetch selfies for a workout
- `deleteWorkoutSelfie()` - Delete selfie and remove from storage

### Goals (`lib/goals/actions.ts`)
- `createGoal()` - Create new goal
- `getGoals()` - Fetch all user goals
- `updateGoal()` - Update goal
- `updateGoalProgress()` - Update goal progress
- `deleteGoal()` - Delete goal

## Development Workflow

### Running the App
```bash
npm run dev              # Start development server
npm run build            # Build for production (with lint)
npm run build:skip-lint  # Build without linting (faster)
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
6. Update navigation if needed (`components/layout/navbar.tsx`)

### Debugging
- Use `/debug` page to check user auth and database connection
- Check browser console for client-side errors
- Check terminal for server-side logs
- Inspect Supabase logs in dashboard
- Check Supabase Storage for image issues

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

### Health-Aware Trend Indicators
```typescript
// Define which metrics improve when decreasing
const BETTER_WHEN_DECREASING: Record<string, boolean> = {
  weight: true,
  body_fat_percentage: true,
  waist: true,
  muscle_mass: false, // Better when increasing
  chest: false,
  bicep_left: false,
}

// Calculate if trend is positive for health
const isPositiveTrend = betterWhenDecreasing
  ? change < 0  // Decrease is good
  : change > 0  // Increase is good
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

### Image Upload to Supabase Storage
```typescript
const file = formData.get('image') as File
const fileName = `${Date.now()}-${file.name}`
const filePath = `${user.id}/${fileName}`

const { error: uploadError } = await supabase.storage
  .from('workout-selfies')
  .upload(filePath, file)

if (uploadError) return { error: uploadError.message }

// Save record to database with image_path
```

## Testing

### Test Suite
- **Jest** + **React Testing Library**
- **26+ passing tests** covering:
  - Utility functions (cn class merging)
  - Gym equipment data (68+ items)
  - UI components (Button variants)
  - Goal calculations
  - Workout logic

### Test Commands
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
```

### Test Files
```
__tests__/
├── goals/
│   └── calculate-initial-value.test.ts  # Goal calculation tests
├── workouts/
│   └── workout-logic.test.ts            # Workout logic tests
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

### Post-Deployment Checklist
1. ✅ Update Supabase Auth redirect URLs
2. ✅ Configure Google OAuth redirect URIs
3. ✅ Set up Storage bucket (`workout-selfies`)
4. ✅ Test authentication flow
5. ✅ Verify PWA installation
6. ✅ Test image uploads
7. ✅ Test workout/goal/measurement creation

See `DEPLOYMENT.md` for complete deployment guide.

## Known Issues & Current State

### Fully Implemented ✅
- ✅ Workout CRUD (Create, Read, Update, Delete)
- ✅ Exercise type detection and smart forms
- ✅ Effort level tracking
- ✅ Workout selfies with storage
- ✅ Body measurements with time series charts
- ✅ Health-aware trend indicators
- ✅ Goal CRUD operations
- ✅ Dashboard with real statistics
- ✅ Progress tracking analytics
- ✅ Authentication (Email + Google OAuth)
- ✅ PWA functionality

### Not Yet Implemented ❌
- ❌ Workout templates (table exists, UI pending)
- ❌ Profile/Settings persistence (UI only)
- ❌ Exercise history charts
- ❌ Personal records (PRs) tracking
- ❌ Social features
- ❌ Data export

### Future Enhancements
- [ ] Workout templates implementation
- [ ] Profile/settings persistence to database
- [ ] Exercise history tracking with charts
- [ ] Personal records (PRs) tracking
- [ ] Social features (sharing)
- [ ] Export data functionality (CSV/JSON)
- [ ] Import from other apps
- [ ] Body measurement photo comparisons
- [ ] Progress reports (weekly/monthly)
- [ ] Custom date ranges for analytics

## Development Rules & Preferences

**IMPORTANT: Always follow these rules when working on this project:**

### Git & Commit Rules
1. **NEVER auto-commit** - Always ask before committing changes
2. **NEVER disable lint checks** - Always run linting before building
3. **ALWAYS run build before committing** - Ensure `npm run build` passes before any commit
4. **Run tests before committing** - Verify all tests pass with `npm test`
5. **Before pushing, check if a GitHub issue and PR should be created**:
   - For new features or significant changes, create a GitHub issue first
   - Then create a feature branch and pull request
   - Link the PR to the issue with "Fixes #issue-number"
   - If working directly on main, evaluate if the change warrants a PR workflow

### Code Quality Standards
1. Use TypeScript strictly (no `any` types)
2. Follow existing patterns and conventions
3. Add proper error handling
4. Include loading states for async operations
5. Show toast notifications for user actions
6. Add comments for complex logic only

### Testing Requirements
1. **Write unit tests for new business logic** - Every new feature must have tests
2. **Add tests for new components** - UI components should have basic rendering tests
3. **Test new utility functions** - All helper/utility functions must be tested
4. **Ensure all tests pass before committing** - Zero tolerance for failing tests
5. **Update existing tests when modifying functionality** - Keep tests in sync with code
6. **Run `npm test` to verify all tests pass** - Before every commit
7. **Maintain or improve test coverage** - Don't reduce overall test coverage percentage

### API & Documentation
1. Update OpenAPI spec when adding/modifying API endpoints
2. Keep API documentation in sync with implementation
3. Document breaking changes in commit messages

### Image Handling & Optimization
1. **ALWAYS optimize images** - Use Next.js Image component or proper optimization
2. **Proper sizing** - Specify width/height to prevent layout shift
3. **Lazy loading** - Use lazy loading for images below the fold
4. **Format selection** - Use WebP/AVIF when possible with fallbacks
5. **Compression** - Compress images before upload (Supabase Storage)
6. **Responsive images** - Use srcset or Next.js Image for different screen sizes
7. **Alt text** - Always include descriptive alt text for accessibility

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
9. Add tests for new functionality

## Support & Documentation

- **SETUP.md** - Setup instructions
- **README.md** - Project overview
- **TESTING.md** - Testing guide
- **DEPLOYMENT.md** - Deployment guide
- **SELFIES_SETUP.md** - Selfie feature setup
- **CODECOV_SETUP.md** - Codecov integration
- Review Supabase logs for errors
- Use /debug page for troubleshooting

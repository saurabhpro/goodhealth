# GoodHealth - Fitness Tracking App

A comprehensive Progressive Web App for tracking gym workouts, body measurements, visualizing progress, setting fitness goals, and monitoring your fitness journey with detailed analytics and time-series tracking.

[![CI](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/saurabhpro/goodhealth/graph/badge.svg?token=ESKjLLgWVw)](https://codecov.io/gh/saurabhpro/goodhealth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🏋️ Workout Tracking
- **Smart Exercise Inputs** - Automatically adapts based on exercise type:
  - **Cardio**: Duration, Distance, Speed, Calories, Resistance, Incline
  - **Strength**: Sets, Reps, Weight
  - **Functional**: Sets, Reps (no weight)
- **68+ Pre-defined Equipment** from major brands (Technogym, Life Fitness, Hammer Strength)
- **Auto-detection** - Select equipment and exercise type auto-fills
- **Effort Level Tracking** - Visual heatmap selector (1-6 scale)
- **Workout Selfies** - Upload photos to track visual progress
- **Full CRUD Operations** - Create, view, edit, and delete workouts
- **Exercise Management** - Add, remove, and modify exercises in workouts
- **Custom Exercises** - Add your own exercises beyond the predefined list

### 📏 Body Measurements Tracking
- **Comprehensive Measurement Form** - Track 20+ body metrics:
  - Body Composition: Weight, Body Fat %, Muscle Mass, Bone Mass, Water %, Protein %
  - Circumference: Chest, Waist, Hips, Shoulders, Neck
  - Arms: Biceps and Forearms (left & right)
  - Legs: Thighs and Calves (left & right)
  - Additional: BMR, Metabolic Age, Visceral Fat
- **Time Series Charts** - Interactive line graphs showing progress over time
- **Health-Aware Trends** - Smart color coding:
  - Green when measurements improve (weight/fat down, muscle up)
  - Red when measurements worsen
  - Visual trend indicators (↑↓) with change values
- **Statistics Dashboard** - Latest, Change, Change %, Average, Min-Max range
- **Multiple Metrics** - Switch between 8 different measurements in charts
- **Measurement History** - Complete chronological list with trends
- **Delete Measurements** - Remove incorrect entries with confirmation

### 📊 Progress Analytics
- **Real-time Dashboard** - Live statistics showing:
  - Workout count and total time
  - Exercises completed
  - Current workout streak
  - Recent activity feed
- **Workout History** - Chronological view with clickable cards
- **Strength Tracking** - Per-exercise progress with max/average weights
- **Goal Monitoring** - Visual progress bars with percentage completion
- **Tabbed Interface** - Overview, Workouts, Strength, Goals views

### 🎯 Goal Management
- Create fitness goals with targets and deadlines
- Track current progress vs. target
- Achievement badges when goals completed
- Support for multiple goal types (weight, reps, distance, duration)
- Visual progress bars
- Goal editing and deletion

### 🤖 AI-Powered Weekly Workout Analysis (New!)
- **Automated Weekly Insights** - AI analyzes your workout performance every Monday
- **Comprehensive Analysis** includes:
  - Weekly workout statistics (count, duration, effort level)
  - Goal progress tracking with percentage completion
  - Body measurement changes (weight, body fat, muscle mass)
  - Key achievements highlighting your wins
  - Areas for improvement with constructive feedback
  - Personalized recommendations based on your fitness level and goals
  - Motivational quote tailored to your performance
- **Smart Dashboard Integration** - Analysis appears prominently when available
- **Interactive Cards** - Expandable details with dismiss functionality
- **Scheduled Automation** - Runs every Monday at 8:00 AM via Vercel Cron
- **User-Specific Analysis** - Only for users with active goals or workout plans

### 🔐 Authentication & Security
- Email/Password authentication
- Google OAuth sign-in
- Row Level Security (RLS) policies
- Protected routes with proxy (Next.js 16 middleware)
- Secure session management

### 📱 Progressive Web App
- **Install on mobile devices** - Works like a native app
- **Offline support** - Service worker for offline functionality
- **Responsive design** - Mobile-first approach
- **Toast notifications** - Success/error feedback
- **Dark mode ready** - Theme toggle support

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI**: Google Gemini 2.0 Flash (for workout analysis)
- **Charts**: Recharts for time-series visualizations
- **State Management**: React hooks + Server Actions
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (recommended) with Cron Jobs

## Getting Started

### Prerequisites

- Node.js 25.2.0+ installed (latest stable version)
- npm 11.6.2+ package manager
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [app.supabase.com](https://app.supabase.com)
2. Go to Project Settings > API to find your project URL and anon key
3. Go to SQL Editor and run migrations from `migrations/` directory in order:
   - `001_initial_schema.sql`
   - `002_add_effort_level.sql`
   - `003_add_exercise_types.sql`
   - `004_add_workout_selfies.sql`
   - `004b_add_storage_policies.sql`
   - `005_add_body_measurements.sql`

See `migrations/README.md` for detailed instructions.

### 3. Configure Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: For AI-powered workout plan generation
GEMINI_API_KEY=your_google_gemini_api_key
```

**Note**: The `GEMINI_API_KEY` is optional. If not provided, AI-powered workout plan generation will not be available, but template-based plans will still work. Get your free API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Run Tests

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
```

### 6. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
goodhealth/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── auth/callback/    # Supabase auth callback
│   │   └── images/[...path]/ # Image serving proxy
│   ├── workouts/             # Workout management
│   │   ├── [id]/             # Workout detail view
│   │   │   └── edit/         # Edit workout
│   │   └── new/              # Create new workout
│   ├── measurements/         # Body measurements
│   │   └── new/              # Add new measurement
│   ├── goals/                # Goal management
│   │   ├── [id]/edit/        # Edit goal
│   │   └── new/              # Create goal
│   ├── progress/             # Progress tracking
│   ├── dashboard/            # Main dashboard
│   └── layout.tsx            # Root layout with navbar
├── components/               # React components
│   ├── layout/               # Layout components
│   │   └── navbar.tsx        # Main navigation
│   ├── ui/                   # shadcn/ui components
│   │   └── effort-selector.tsx # Effort level selector
│   ├── workout-edit-form.tsx # Workout editing
│   ├── measurement-form.tsx  # Measurement input
│   ├── measurements-chart.tsx # Time series charts
│   ├── measurements-list.tsx # Measurement history
│   └── selfie-upload.tsx     # Photo upload
├── lib/                      # Utility functions and configs
│   ├── supabase/             # Supabase client configs
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   ├── auth/                 # Authentication utilities
│   │   ├── actions.ts        # Server actions for auth
│   │   └── hooks.ts          # Client hooks for auth
│   ├── workouts/             # Workout operations
│   │   └── actions.ts        # Workout CRUD actions
│   ├── measurements/         # Measurement operations
│   │   └── actions.ts        # Measurement CRUD actions
│   ├── goals/                # Goal operations
│   │   └── actions.ts        # Goal CRUD actions
│   ├── selfies/              # Selfie operations
│   │   └── actions.ts        # Selfie upload/delete
│   └── data/                 # Static data
│       └── gym-equipment.ts  # 68+ equipment database
├── types/                    # TypeScript type definitions
│   ├── database.ts           # Supabase database types
│   └── index.ts              # App-specific types
├── public/                   # Static assets
│   └── manifest.json         # PWA manifest
├── migrations/               # Database migrations
└── proxy.ts                  # Auth proxy (Next.js 16 middleware)
```

## Database Schema

The app uses the following main tables:

- **profiles**: User profile information
- **workouts**: Workout sessions with effort level
- **exercises**: Individual exercises with type-specific fields (cardio/strength/functional)
- **workout_templates**: Reusable workout templates
- **goals**: Fitness goals and tracking
- **workout_selfies**: Progress photos with metadata
- **body_measurements**: Comprehensive body tracking (20+ metrics)

See `migrations/` directory for the complete schema with Row Level Security policies.

## Key Features in Detail

### Smart Exercise Type System
- **Auto-detection** based on equipment selection
- **Dynamic forms** showing relevant fields:
  - Strength: Sets, Reps, Weight
  - Cardio: Duration, Distance, Speed, Resistance, Incline, Calories
  - Functional: Sets, Reps (no weight field)
- **Type selector** with clear visual indicators
- **Custom exercises** with manual type selection

### Body Measurements Time Series
- **Interactive charts** with Recharts
- **8 metrics available**: Weight, Body Fat %, Muscle Mass, Waist, Chest, Hips, Biceps
- **Health-aware colors**:
  - Green when improving (weight/fat down, muscle up)
  - Red when worsening
  - Blue for neutral metrics
- **Statistics**: Latest, Change, Change %, Average, Range
- **Comparison** with previous measurements
- **Full history** with trend indicators

### Workout Selfies
- **Upload photos** to track visual progress
- **Secure storage** in Supabase Storage
- **Auto-optimization** for web viewing
- **Gallery view** on workout details
- **Delete capability** with confirmation

### Progress Dashboard
- **Real-time stats** from actual data
- **Workout streaks** calculated automatically
- **Recent activity** with clickable cards
- **Tabbed navigation** for different views

## PWA Installation

### On Mobile (iOS/Android)

1. Open the app in your browser
2. Tap the share/menu button
3. Select "Add to Home Screen"
4. The app will now work offline and appear like a native app

### On Desktop

1. Open the app in Chrome, Edge, or another supported browser
2. Look for the install icon in the address bar
3. Click to install the PWA

## Development

### Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

### Type Generation

If you modify the database schema, regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

## 🧪 Testing

The project includes comprehensive unit tests:

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**Test Coverage:**
- ✅ Utility functions
- ✅ Gym equipment data (68+ items)
- ✅ UI components (Button, etc.)
- ✅ Goal calculations
- ✅ Workout logic

See `TESTING.md` for detailed testing guide.

## 🚀 Deployment

### Recommended: Vercel (Free)

**Why Vercel?**
- ✅ Zero-config for Next.js
- ✅ Automatic HTTPS & CDN
- ✅ Preview deployments for PRs
- ✅ Free tier with generous limits

**Quick Deploy:**
1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add environment variables
4. Click Deploy (~5 minutes)

### Alternative Options
- **Netlify** - Similar to Vercel, good Next.js support
- **Railway** - Best for full-stack + database
- **Render** - Free tier with cold starts

### Why NOT GitHub Pages?
- ❌ Static HTML only (no SSR/API routes/server actions)

See `DEPLOYMENT.md` for complete deployment guide.

## 🔄 CI/CD Pipeline

The project includes GitHub Actions workflows:

### CI Workflow
- ✅ Runs tests on every push/PR
- ✅ Lints code with ESLint
- ✅ Generates coverage reports
- ✅ Uploads coverage to Codecov
- ✅ Builds application

### Deployment Workflows
- ✅ Preview deployments for PRs
- ✅ Auto-deploy to production on push to main

## 📚 Documentation

- **[API Documentation](./docs/api/README.md)** - Complete REST API reference with OpenAPI spec
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[TESTING.md](./TESTING.md)** - Testing guide and best practices
- **[CODECOV_SETUP.md](./CODECOV_SETUP.md)** - Codecov integration guide
- **[SELFIES_SETUP.md](./SELFIES_SETUP.md)** - Selfie feature setup guide
- **[.claude/context.md](./.claude/context.md)** - Full project context for development

### API Reference
View the OpenAPI specification for the REST API:
- **[OpenAPI Spec](./docs/api/openapi.yaml)** - GitHub renders this automatically
- Run `npm run api:docs` to view locally with Swagger UI
- Import into Postman for testing

## 🗺️ Roadmap

### Completed ✅
- ✅ Smart exercise inputs (cardio/strength/functional)
- ✅ 68+ gym equipment database
- ✅ Effort level tracking
- ✅ Workout detail views
- ✅ Dashboard with real statistics
- ✅ Progress page with analytics
- ✅ Goal tracking system
- ✅ **Workout editing** - Full CRUD operations
- ✅ **Workout selfies** - Progress photo uploads
- ✅ **Body measurements** - Comprehensive tracking
- ✅ **Time series charts** - Interactive progress visualization
- ✅ **Health-aware trends** - Smart color coding
- ✅ **Delete functionality** - For measurements and selfies
- ✅ Jest + React Testing Library setup
- ✅ GitHub Actions CI/CD
- ✅ Codecov integration for coverage tracking
- ✅ Vercel deployment ready

### In Progress 🚧
- [ ] **AI-powered workout plan generation** - Using Google Gemini 2.5 Pro
  - ✅ Cost analysis complete
  - ✅ AI service integration
  - ✅ API endpoint created
  - ✅ UI integration (existing UI works)
  - ⏳ Testing and debugging

### Planned 📋
- [ ] initial landing page should be attractive
- [ ] change workout page to show ai is cooking your plan until it's generated
- [ ] ability to move workout to different date rescheduling
- [ ] Workout templates
- [ ] Profile/settings persistence
- [ ] Exercise history tracking with charts
- [ ] Personal records (PRs) tracking
- [ ] Social features (sharing workouts)
- [ ] Export data functionality (CSV/JSON)
- [ ] Nutrition tracking integration
- [ ] Integration with fitness wearables
- [ ] Apple Health integration (iOS companion app with HealthKit)
  - Native iOS app to sync Apple Health workout data to Supabase
  - Automatic background sync of workouts from Apple Health
  - Support for workout types, duration, calories, heart rate
  - Unified data view in PWA and iOS app
- [ ] Body measurement photo comparisons
- [ ] Progress reports (weekly/monthly summaries)
- [ ] Custom date ranges for analytics

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, and TypeScript

# GoodHealth - Fitness Tracking App

A comprehensive Progressive Web App for tracking gym workouts, visualizing progress, setting fitness goals, and monitoring your fitness journey with detailed analytics.

[![CI](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml/badge.svg)](https://github.com/saurabhpro/goodhealth/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/saurabhpro/goodhealth/graph/badge.svg?token=ESKjLLgWVw)](https://codecov.io/gh/saurabhpro/goodhealth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

### 🏋️ Workout Tracking
- **Smart Exercise Inputs** - Automatically adapts based on exercise type (cardio/strength/functional)
- **68+ Pre-defined Equipment** from major brands (Technogym, Life Fitness, Hammer Strength)
- **Effort Level Tracking** - Visual heatmap selector (1-6 scale)
- **Workout Details** - Click any workout to see complete exercise breakdown
- **Custom Exercises** - Add your own exercises

### 📊 Progress Analytics
- **Real-time Dashboard** - Live statistics showing workout count, total time, exercises, and streaks
- **Workout History** - Chronological view with clickable cards
- **Strength Tracking** - Per-exercise progress with max/average weights
- **Goal Monitoring** - Visual progress bars with percentage completion

### 🎯 Goal Management
- Create fitness goals with targets and deadlines
- Track current progress vs. target
- Achievement badges when goals completed
- Support for multiple goal types (weight, reps, distance, duration)

### 🔐 Authentication & Security
- Email/Password authentication
- Google OAuth sign-in
- Row Level Security (RLS) policies
- Protected routes with proxy (Next.js 16 middleware)

### 📱 Progressive Web App
- **Install on mobile devices** - Works like a native app
- **Offline support** - Service worker for offline functionality
- **Responsive design** - Mobile-first approach
- **Toast notifications** - Success/error feedback

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- npm or yarn package manager

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
```

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
│   │   └── auth/callback/    # Supabase auth callback
│   ├── layout.tsx            # Root layout with navbar
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── layout/               # Layout components (navbar, etc.)
│   ├── workout/              # Workout-related components
│   ├── dashboard/            # Dashboard components
│   └── ui/                   # shadcn/ui components
├── lib/                      # Utility functions and configs
│   ├── supabase/             # Supabase client configs
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   └── auth/                 # Authentication utilities
│       ├── actions.ts        # Server actions for auth
│       └── hooks.ts          # Client hooks for auth
├── types/                    # TypeScript type definitions
│   ├── database.ts           # Supabase database types
│   └── index.ts              # App-specific types
├── public/                   # Static assets
│   └── manifest.json         # PWA manifest
├── proxy.ts                  # Auth proxy (Next.js 16 middleware)
├── .vercelignore             # Files to exclude from Vercel deployment
└── supabase-schema.sql       # Database schema
```

## Database Schema

The app uses the following main tables:

- **profiles**: User profile information
- **workouts**: Workout sessions
- **exercises**: Individual exercises within workouts
- **workout_templates**: Reusable workout templates
- **goals**: Fitness goals and tracking

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

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
npm test                 # Run all tests (26 passing)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

**Test Coverage:**
- ✅ Utility functions
- ✅ Gym equipment data (68+ items)
- ✅ UI components (Button, etc.)

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

### Setting Up Codecov

1. **Sign up for Codecov** at [codecov.io](https://codecov.io) using your GitHub account
2. **Add your repository** to Codecov
3. **Get your repository token** from Codecov dashboard
4. **Add the token as a GitHub secret**:
   - Go to your repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `CODECOV_TOKEN`
   - Value: Your Codecov repository token (e.g., `27b4f80b-aad4-40ad-9b94-968b02a109f7`)
5. **Merge to main** - Once merged, Codecov will start tracking coverage on all PRs

The workflow automatically:
- Runs `npm run test:coverage` to generate coverage reports
- Uploads coverage data (JSON and LCOV formats) to Codecov
- Adds coverage badges and PR comments

Configure by adding GitHub secrets for Vercel and Codecov integration.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[TESTING.md](./TESTING.md)** - Testing guide and best practices
- **[CODECOV_SETUP.md](./CODECOV_SETUP.md)** - Codecov integration guide
- **[.claude/context.md](./.claude/context.md)** - Full project context for development

## 🗺️ Roadmap

### Completed ✅
- ✅ Smart exercise inputs (cardio/strength/functional)
- ✅ 68+ gym equipment database
- ✅ Effort level tracking
- ✅ Workout detail views
- ✅ Dashboard with real statistics
- ✅ Progress page with analytics
- ✅ Goal tracking system
- ✅ Jest + React Testing Library setup
- ✅ GitHub Actions CI/CD
- ✅ Codecov integration for coverage tracking
- ✅ Vercel deployment ready

### Planned 📋
- [ ] Workout templates
- [ ] Charts using recharts
- [ ] Profile/settings persistence
- [ ] Exercise history tracking
- [ ] Personal records (PRs)
- [ ] Workout edit functionality
- [ ] Social features (sharing)
- [ ] Export data functionality
- [ ] AI-powered workout recommendations
- [ ] Nutrition tracking
- [ ] Integration with fitness wearables

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with Next.js, Supabase, and TypeScript

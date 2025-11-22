# Setup Guide

## Prerequisites

- Node.js 25.2.0+
- Yarn 1.22+
- Supabase account (free tier)

## 1. Install Dependencies

```bash
yarn install
```

## 2. Supabase Setup

### Create Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project
3. Note your database password

### Run Migrations

**Option A: CLI**
```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

**Option B: Dashboard**
1. Go to SQL Editor
2. Run files in order:
   - `migrations/000_consolidated_schema.sql`
   - `migrations/001_add_plan_start_dates.sql`
   - `migrations/002_add_weekly_workout_analysis.sql`

### Get Credentials

1. Project Settings → API
2. Copy:
   - Project URL
   - anon/public key

## 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - for AI features
GEMINI_API_KEY=your_gemini_key
CRON_SECRET=your_cron_secret
```

Get Gemini key: [aistudio.google.com](https://aistudio.google.com/app/apikey)

## 4. Storage Setup

Create bucket in Supabase Dashboard → Storage:
- Name: `workout-selfies`
- Public: ❌ (must be private)
- File size limit: 5MB
- MIME types: `image/jpeg,image/png,image/webp,image/heic`

## 5. Run Development Server

```bash
yarn dev
```

Visit http://localhost:3000

## 6. OAuth Setup (Optional)

### Google OAuth

1. Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add authorized redirect URL:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://yourdomain.com/api/auth/callback`
4. Get credentials from [Google Cloud Console](https://console.cloud.google.com)

## Troubleshooting

**Build fails:**
```bash
yarn build:skip-lint  # Skip linting temporarily
```

**Migration errors:**
- Ensure migrations run in order
- Check Supabase logs in dashboard

**Auth issues:**
- Verify environment variables loaded
- Check RLS policies in Supabase

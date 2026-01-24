# Setup Guide

## Prerequisites

- **Node.js** 24+ (for frontend)
- **Python** 3.13+ (for backend)
- **Yarn** 1.22+
- **Supabase** account (free tier)
- **Google Gemini** API key (free tier available)

## Project Structure

```
goodhealth/
├── frontend/          # Next.js app
├── backend/           # Python FastAPI
├── docs/              # Documentation
└── package.json       # Monorepo scripts
```

## 1. Clone Repository

```bash
git clone https://github.com/saurabhpro/goodhealth.git
cd goodhealth
```

## 2. Frontend Setup

### Install Dependencies

```bash
cd frontend
yarn install
```

### Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API (local development)
PYTHON_API_URL=http://localhost:8000
```

## 3. Backend Setup

### Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.0-flash
```

## 4. Supabase Setup

### Create Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project
3. Note your database password

### Run Migrations

**Option A: Supabase CLI**

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

**Option B: SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Run migration files in order:
   - `backend/migrations/000_consolidated_schema.sql`
   - `backend/migrations/001_add_plan_start_dates.sql`
   - `backend/migrations/002_add_weekly_workout_analysis.sql`
   - `backend/migrations/003_add_user_preferences.sql`
   - `backend/migrations/004_add_goal_status.sql`

### Get Credentials

In Supabase Dashboard → Project Settings → API:

| Variable | Where to Find |
|----------|---------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon / public |
| `SUPABASE_SERVICE_KEY` | service_role |
| `SUPABASE_JWT_SECRET` | JWT Secret |

### Storage Setup

Create bucket in Supabase Dashboard → Storage:

1. Click **New Bucket**
2. Name: `workout-selfies`
3. Public: ❌ **No** (must be private)
4. File size limit: `5MB`
5. Allowed MIME types: `image/jpeg,image/png,image/webp,image/heic`

## 5. Google Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key to `backend/.env` as `GEMINI_API_KEY`

## 6. Run Development Servers

### Option A: Run Both Together

```bash
# From root directory
npm run dev
```

This uses `concurrently` to run both frontend and backend.

### Option B: Run Separately

**Terminal 1 - Backend:**

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
yarn dev
```

### Access the App

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 7. OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback`
   - Production: `https://yourdomain.com/api/auth/callback`

6. In Supabase Dashboard → Authentication → Providers:
   - Enable Google
   - Add Client ID and Client Secret

## 8. Verify Setup

### Check Backend Health

```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy"}
```

### Check Frontend

1. Visit http://localhost:3000
2. Create an account
3. Log a workout
4. Verify data appears in Supabase

## Troubleshooting

### Frontend build fails

```bash
cd frontend
yarn build:skip-lint  # Skip linting temporarily
```

### Backend won't start

1. Verify virtual environment is activated
2. Check all environment variables are set
3. Verify Python version: `python --version` (should be 3.13+)

### Database connection errors

1. Check `SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_KEY` (not anon key) for backend
3. Ensure migrations have run

### Auth not working

1. Verify `NEXT_PUBLIC_APP_URL` matches your frontend URL
2. Check OAuth redirect URLs in Supabase
3. Verify `SUPABASE_JWT_SECRET` matches Supabase settings

### AI features not working

1. Verify `GEMINI_API_KEY` is valid
2. Test the key:
   ```bash
   curl -H "x-goog-api-key: YOUR_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
   ```

## Development Scripts

### Frontend (from `frontend/` directory)

```bash
yarn dev          # Start dev server
yarn build        # Production build
yarn lint         # Run ESLint
yarn test         # Run Jest tests
yarn test:coverage # Tests with coverage
```

### Backend (from `backend/` directory)

```bash
uvicorn app.main:app --reload  # Start dev server
pytest                          # Run tests
pytest --cov=app               # Tests with coverage
ruff check .                   # Lint code
black .                        # Format code
mypy app                       # Type check
```

### Monorepo (from root directory)

```bash
npm run dev           # Start both servers
npm run build         # Build frontend
npm run test          # Test both
npm run lint          # Lint frontend
```

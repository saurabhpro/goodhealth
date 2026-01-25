# Deployment Guide

GoodHealth uses a split deployment model:
- **Frontend (Next.js)** → Vercel
- **Backend (FastAPI)** → Railway

## Prerequisites

- GitHub repository connected to both platforms
- Supabase project with database and auth configured
- Google Gemini API key

## Backend Deployment (Railway)

### One-Click Deploy

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/-NvLj4)

### Manual Deployment

#### 1. Create Railway Project

1. Go to [railway.com](https://railway.com) and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your `goodhealth` repository

#### 2. Configure Root Directory (IMPORTANT)

Since this is a monorepo, you **must** set the root directory:

1. Click on your service → **Settings**
2. Under **Source** section, find **Root Directory**
3. Set it to: `backend`
4. Save the changes

> **Note**: This step is critical! Without it, Railway will detect the root `package.json` and try to build the frontend instead of the Python backend.

#### 3. Builder Configuration

Railway uses **Railpack** to auto-detect and build Python projects. The configuration is in:
- `railway.json` (repo root) - specifies Railpack builder and root directory
- `backend/railpack.toml` - Python version and start command
- `backend/Procfile` - web process command

No Dockerfile is needed - Railpack handles everything automatically.

#### 4. Set Environment Variables

In Railway Dashboard → Variables, add:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.0-flash
```

**Where to find these values:**
- **SUPABASE_URL**: Supabase Dashboard → Settings → API
- **SUPABASE_SERVICE_KEY**: Supabase Dashboard → Settings → API → service_role key (NOT the anon key!)
- **GEMINI_API_KEY**: Google AI Studio → Get API Key

#### 5. Generate Public URL

1. Go to Settings → Networking
2. Click **Generate Domain**
3. Copy the URL (e.g., `https://goodhealth-backend.up.railway.app`)

#### 6. Verify Deployment

```bash
curl https://your-railway-url.up.railway.app/health
# Should return: {"status": "healthy"}
```

### Configuration Files Reference

**`railway.json`** (repo root):
```json
{
  "build": {
    "builder": "RAILPACK",
    "rootDirectory": "backend"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

**`backend/railpack.toml`**:
```toml
[build]
language = "python"

[build.python]
version = "3.12"

[start]
cmd = "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"
```

**`backend/Procfile`**:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Frontend Deployment (Vercel)

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/saurabhpro/goodhealth)

### Manual Deployment

#### 1. Import Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your `goodhealth` repository

#### 2. Configure Build Settings

Vercel should auto-detect from `vercel.json`:

```json
{
  "buildCommand": "cd frontend && yarn build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && yarn install",
  "framework": "nextjs"
}
```

If not, set manually:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `yarn build`
- **Output Directory**: `.next`

#### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Backend API (Railway URL)
PYTHON_API_URL=https://your-backend.up.railway.app
```

#### 4. Deploy

Click **Deploy**. Vercel will build and deploy automatically.

---

## Environment Variables Summary

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (full access, bypasses RLS) |
| `GEMINI_API_KEY` | Yes | Google AI API key |
| `GEMINI_MODEL` | No | Default: `gemini-3.0-flash` |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend URL (for OAuth redirect) |
| `PYTHON_API_URL` | Yes | Railway backend URL |

### GitHub Actions (CI)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | For build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | For build |
| `NEXT_PUBLIC_APP_URL` | Yes | For build |
| `PYTHON_API_URL` | Yes | For build |
| `SONAR_TOKEN` | No | SonarCloud analysis |
| `CODECOV_TOKEN` | No | Code coverage reports |

---

## Post-Deployment Checklist

### 1. Verify Backend Health

```bash
curl https://your-backend.up.railway.app/health
```

### 2. Test Authentication

1. Visit your frontend URL
2. Try signup/login
3. Check that OAuth redirect works

### 3. Test API Connection

1. Log in to the app
2. Create a workout or goal
3. Verify data appears (check browser Network tab)

### 4. Test AI Features

1. Navigate to workout plans
2. Generate a new plan
3. Visit dashboard to trigger weekly analysis

### 5. Verify Database

Check Supabase Dashboard:
- Tables should have data
- RLS policies should be active
- Storage bucket should exist

---

## CI/CD Integration

GitHub Actions automatically runs on push/PR:

```yaml
# .github/workflows/ci.yml
jobs:
  test-frontend:
    # Runs yarn lint && yarn test:coverage
    
  test-backend:
    # Runs ruff check && pytest --cov
    
  build:
    # Runs yarn build (Next.js)
    
  sonarcloud:
    # Code quality analysis
```

### Auto-Deploy Setup

**Vercel:**
- Connects to GitHub automatically
- Deploys on push to `main`
- Preview deploys on PRs

**Railway:**
- Connects to GitHub automatically  
- Deploys on push to `main`
- Can configure branch-specific deploys

---

## Monitoring

### Railway (Backend)

- **Logs**: Railway Dashboard → Deployments → View Logs
- **Metrics**: Railway Dashboard → Metrics (CPU, Memory)
- **Health**: `/health` endpoint

### Vercel (Frontend)

- **Logs**: Vercel Dashboard → Deployments → Functions
- **Analytics**: Vercel Dashboard → Analytics
- **Speed Insights**: Vercel Dashboard → Speed Insights

### Supabase (Database)

- **Logs**: Supabase Dashboard → Logs
- **Metrics**: Supabase Dashboard → Reports
- **Query Performance**: Supabase Dashboard → SQL Editor

---

## Scaling

### Railway

- **Horizontal**: Railway auto-scales based on traffic
- **Resources**: Upgrade plan for more CPU/memory
- **Regions**: Deploy to multiple regions if needed

### Vercel

- **Edge Functions**: Automatic global distribution
- **Serverless**: Auto-scales to zero when idle
- **Enterprise**: Custom scaling options

### Supabase

- **Connection Pooling**: Enabled by default
- **Read Replicas**: Available on Pro plan
- **Compute**: Upgrade for more resources

---

## Troubleshooting

### Railway Building Frontend Instead of Backend

**Symptom**: Railway runs `yarn build` and tries to build frontend

**Fix**: 
1. Go to Railway Dashboard → Your Service → Settings
2. Set **Root Directory** to `backend`
3. Redeploy

### Backend Not Responding

1. Check Railway deployment logs
2. Verify environment variables are set correctly
3. Check `/health` endpoint
4. Verify Root Directory is set to `backend`

### Frontend Build Fails

1. Check Vercel build logs
2. Run build locally: `cd frontend && yarn build`
3. Verify environment variables
4. Check for TypeScript errors

### Auth Not Working

1. Verify `NEXT_PUBLIC_APP_URL` matches Vercel URL
2. Check Supabase Auth settings (redirect URLs)
3. Add your Vercel URL to Supabase Auth → URL Configuration → Redirect URLs

### API Returns Empty Data

1. Verify `SUPABASE_SERVICE_KEY` is the **service_role** key (starts with `eyJ...`), NOT the anon key
2. Check Railway logs for authentication errors
3. Verify the backend can connect to Supabase

### AI Features Failing

1. Check `GEMINI_API_KEY` is valid
2. Verify `GEMINI_MODEL` is correct
3. Check Railway logs for API errors
4. Test API key: 
   ```bash
   curl -H "x-goog-api-key: YOUR_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
   ```

### Database Errors

1. Check Supabase logs
2. Verify RLS policies are correct
3. Check connection limits (Supabase Dashboard)
4. Verify service key has correct permissions

---

## Rollback

### Railway

1. Go to Deployments
2. Find previous successful deployment
3. Click "Rollback"

### Vercel

1. Go to Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

---

## Cost Estimates

| Service | Free Tier | Typical Usage |
|---------|-----------|---------------|
| Railway | $5/month credit | ~$5-15/month |
| Vercel | 100GB bandwidth | Free for hobby |
| Supabase | 500MB database | Free tier sufficient |
| Gemini | Free tier available | ~$1-5/month |

**Total estimated cost**: $5-25/month for moderate usage

# GoodHealth Deployment Guide

This guide covers testing, CI/CD setup, and deployment options for the GoodHealth fitness tracking application.

## Table of Contents
1. [Testing](#testing)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Deployment Options](#deployment-options)
4. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
5. [Alternative Hosting Providers](#alternative-hosting-providers)
6. [Environment Variables](#environment-variables)

---

## Testing

### Running Tests

The project uses Jest and React Testing Library for unit tests.

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
lib/__tests__/              # Library utility tests
lib/data/__tests__/         # Data module tests
components/ui/__tests__/    # UI component tests
```

### Coverage

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.

---

## CI/CD Pipeline

### GitHub Actions Workflows

The project includes three automated workflows:

#### 1. **CI Workflow** (`.github/workflows/ci.yml`)
Runs on every push and pull request to `main` or `develop` branches.

**Steps:**
- Checkout code
- Setup Node.js 20
- Install dependencies
- Run ESLint
- Run tests
- Generate coverage report
- Upload coverage to Codecov
- Build application

#### 2. **Deploy Preview** (`.github/workflows/deploy-preview.yml`)
Runs on pull requests to `main` branch.

**Steps:**
- Creates preview deployment on Vercel
- Posts preview URL in PR comments

#### 3. **Deploy Production** (`.github/workflows/deploy-production.yml`)
Runs when code is pushed to `main` branch.

**Steps:**
- Run tests
- Deploy to Vercel production

### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
NEXT_PUBLIC_SUPABASE_URL        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Your Supabase anonymous key
NEXT_PUBLIC_APP_URL             # Your production app URL
VERCEL_TOKEN                    # Vercel authentication token
VERCEL_ORG_ID                   # Vercel organization ID
VERCEL_PROJECT_ID               # Vercel project ID
CODECOV_TOKEN                   # Optional: Codecov token for coverage reports
```

---

## Deployment Options

### Why Not GitHub Pages?

**GitHub Pages is NOT suitable** for this project because:
- ❌ Only supports static HTML/CSS/JS
- ❌ No server-side rendering (SSR)
- ❌ No API routes support
- ❌ No server actions support
- ❌ No backend functionality

### Recommended: Vercel

**Best choice** for Next.js applications:
- ✅ Built by Next.js creators
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Preview deployments for PRs
- ✅ Free tier (generous limits)

### Alternative Options

| Provider | Free Tier | Next.js Support | Database Support | Notes |
|----------|-----------|----------------|------------------|-------|
| **Netlify** | ✅ Yes | ✅ Excellent | Limited | Good alternative to Vercel |
| **Railway** | ✅ $5/month credit | ✅ Good | ✅ Excellent | Best for full-stack apps |
| **Render** | ✅ Yes | ✅ Good | ✅ Good | Free tier has cold starts |
| **AWS Amplify** | ❌ Pay-as-you-go | ✅ Excellent | ✅ Excellent | More complex setup |
| **Cloudflare Pages** | ✅ Yes | ⚠️ Limited | Limited | Edge runtime limitations |

---

## Vercel Deployment (Recommended)

### Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

### Step 2: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign up/login

2. **Import Git Repository**
   - Click "Add New Project"
   - Connect your GitHub account
   - Select the `goodhealth` repository

3. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-configured)

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

### Step 4: Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add these to **Redirect URLs**:
```
https://your-app.vercel.app/api/auth/callback
https://your-app.vercel.app/auth/auth-code-error
```

Add to **Site URL**:
```
https://your-app.vercel.app
```

### Step 5: Update Google OAuth Redirect URIs

In Google Cloud Console → APIs & Services → Credentials:

Add to **Authorized redirect URIs**:
```
https://<your-supabase-project>.supabase.co/auth/v1/callback
```

---

## Alternative Hosting Providers

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build settings:**
- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: `.netlify/functions`

### Railway

1. Connect GitHub repository at [railway.app](https://railway.app)
2. Railway auto-detects Next.js
3. Add environment variables
4. Deploy automatically on push to main

### Render

1. Create new Web Service at [render.com](https://render.com)
2. Connect repository
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables

---

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Application URL (must match deployment URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Local Development

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials.

### Production

Add environment variables in your hosting provider's dashboard:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Railway**: Settings → Variables
- **Render**: Environment → Environment Variables

---

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication (email/password and Google OAuth)
- [ ] Update Supabase redirect URLs
- [ ] Update Google OAuth redirect URIs
- [ ] Test creating a workout
- [ ] Test creating a goal
- [ ] Check that RLS policies are working
- [ ] Test PWA installation on mobile
- [ ] Monitor error logs in hosting provider dashboard
- [ ] Set up custom domain (optional)
- [ ] Enable SSL certificate (usually automatic)

---

## Monitoring & Logs

### Vercel
- View logs: Project → Deployments → [Select deployment] → Function Logs
- Real-time logs: `vercel logs --follow`

### Error Tracking (Optional)

Consider adding:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **PostHog** - Product analytics

---

## Continuous Deployment

With GitHub Actions configured, deployments happen automatically:

- **Push to `main`** → Deploy to production
- **Open PR to `main`** → Deploy preview environment
- **Push to PR** → Update preview environment

### Manual Deployment

If needed, you can deploy manually:

```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel
```

---

## Rollback

### Vercel
1. Go to Deployments tab
2. Find previous successful deployment
3. Click "Promote to Production"

### Other Providers
- Most providers offer rollback in their dashboard
- Or redeploy a previous commit from Git

---

## Performance Optimization

### Already Configured
- ✅ Next.js 16 with Turbopack (faster builds)
- ✅ Automatic code splitting
- ✅ Image optimization
- ✅ Server components for better performance
- ✅ PWA with service worker

### Future Optimizations
- Add Redis caching for frequently accessed data
- Implement Edge Functions for global low-latency
- Add CDN for static assets
- Implement image optimization with next/image

---

## Troubleshooting

### Build Fails

**Check:**
- Environment variables are set correctly
- All dependencies are in `package.json`
- No TypeScript errors: `npm run build` locally
- Node version matches (20.x)

### Authentication Not Working

**Check:**
- Supabase redirect URLs include your production URL
- Google OAuth redirect URIs are configured
- `NEXT_PUBLIC_APP_URL` matches your deployment URL

### Database Connection Issues

**Check:**
- Supabase anon key is correct
- RLS policies are enabled
- Database migrations are run in Supabase SQL Editor

---

## Security Best Practices

- ✅ Never commit `.env.local` to Git
- ✅ Use environment variables for all secrets
- ✅ Enable Supabase Row Level Security (RLS)
- ✅ Use HTTPS in production (automatic with Vercel)
- ✅ Keep dependencies updated: `npm audit fix`
- ✅ Enable CORS only for your domain
- ✅ Use secure authentication flows

---

## Support

For deployment issues:
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

## Summary

**Recommended Setup:**
1. Deploy to Vercel (free tier)
2. Set up GitHub Actions for CI/CD
3. Configure Supabase redirect URLs
4. Test authentication and core features
5. Monitor with Vercel Analytics

**Total Cost:** $0/month for starter usage

**Deployment Time:** ~5 minutes

**Maintenance:** Automatic deployments on push to main
